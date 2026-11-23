-- Club 57 Empresarial · Etapa 2: Portal Empresa y empleados.
--
-- 1) El responsable de cada empresa (club57_empresas.responsable_user_id)
--    entra al Portal Empresa del sitio: lee los datos de SU empresa.
-- 2) club57_empresa_empleados: el vínculo de un miembro de Club 57 con su
--    empresa. Estados: pendiente → activo | rechazado | cancelado;
--    activo → baja. Un miembro solo puede tener un vínculo pendiente o
--    activo a la vez.
--    La línea de crédito del empleado la define la empresa: un % de su
--    salario neto o un monto fijo, nunca más del 100 % del salario.
-- 3) club57_empleado_salarios: el salario es un dato personal y solo lo ve
--    el responsable de la empresa. Ferretería 57 ve únicamente la línea.
-- 4) club57_empresa_precarga: la empresa sube una lista (Excel); quien se
--    registre con el código y coincida por correo o número de empleado se
--    aprueba solo con esos datos.
-- 5) Funciones para vincularse (con el código, al registrarse o desde
--    Mi cuenta) y para que el responsable apruebe, ajuste, rechace o dé de
--    baja, configure su nómina y cambie su código.
--
-- Idempotente: se puede correr más de una vez.

-- La bitácora de empresas suma el cambio de responsable y la nómina.
alter table public.club57_empresas_bitacora drop constraint if exists club57_empresas_bitacora_accion_check;
alter table public.club57_empresas_bitacora add constraint club57_empresas_bitacora_accion_check
  check (accion in (
    'solicitud', 'alta', 'aprobada', 'rechazada', 'suspendida', 'reactivada', 'baja',
    'datos', 'convenio', 'codigo', 'responsable', 'nomina'
  ));

-- ---------------------------------------------------------------------
-- 1) El responsable lee su empresa
-- ---------------------------------------------------------------------
drop policy if exists "El responsable lee su empresa" on public.club57_empresas;
create policy "El responsable lee su empresa"
  on public.club57_empresas for select
  using (responsable_user_id is not null and responsable_user_id = auth.uid());

-- Empresa (activa o suspendida) que administra la sesión, o null.
create or replace function public.club57_mi_empresa_responsable()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select e.id from public.club57_empresas e
  where e.responsable_user_id = auth.uid() and e.estado in ('activa', 'suspendida')
  order by e.activada_at desc nulls last
  limit 1;
$$;

grant execute on function public.club57_mi_empresa_responsable() to authenticated;

-- ---------------------------------------------------------------------
-- 2) Vínculo empleado ↔ empresa
-- ---------------------------------------------------------------------
create table if not exists public.club57_empresa_empleados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.club57_empresas (id) on delete cascade,
  member_id uuid not null references public.club57_members (id) on delete cascade,
  numero_empleado text check (numero_empleado is null or length(btrim(numero_empleado)) between 1 and 40),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'activo', 'rechazado', 'cancelado', 'baja')),
  linea_tipo text check (linea_tipo is null or linea_tipo in ('porcentaje', 'monto')),
  linea_porcentaje numeric(5, 2) check (linea_porcentaje is null or (linea_porcentaje > 0 and linea_porcentaje <= 100)),
  linea_credito numeric(12, 2) check (linea_credito is null or linea_credito >= 0),
  nomina_frecuencia text check (nomina_frecuencia is null or nomina_frecuencia in ('semanal', 'quincenal', 'mensual')),
  nomina_dia_semana smallint check (nomina_dia_semana is null or nomina_dia_semana between 1 and 7),
  nomina_dia_mes smallint check (nomina_dia_mes is null or nomina_dia_mes between 0 and 28),
  motivo text check (motivo is null or length(motivo) <= 500),
  origen text not null default 'cuenta' check (origen in ('registro', 'cuenta')),
  autorizacion_at timestamptz not null default now(),
  aprobado_automatico boolean not null default false,
  solicitado_at timestamptz not null default now(),
  resuelto_at timestamptz,
  resuelto_por uuid references auth.users (id) on delete set null,
  notificado_at timestamptz,
  constraint club57_empresa_empleados_activo_linea check (estado <> 'activo' or linea_credito is not null)
);

create unique index if not exists club57_empresa_empleados_vigente_key
  on public.club57_empresa_empleados (member_id)
  where estado in ('pendiente', 'activo');
create index if not exists club57_empresa_empleados_empresa_idx
  on public.club57_empresa_empleados (empresa_id, estado);

alter table public.club57_empresa_empleados enable row level security;

drop policy if exists "Cada quien ve sus vínculos con empresas" on public.club57_empresa_empleados;
create policy "Cada quien ve sus vínculos con empresas"
  on public.club57_empresa_empleados for select
  using (
    member_id = auth.uid()
    or public.is_admin()
    or empresa_id = public.club57_mi_empresa_responsable()
  );

-- Salario: solo el responsable de la empresa (ni siquiera el personal de
-- Ferretería 57 desde el panel).
create table if not exists public.club57_empleado_salarios (
  empleado_id uuid primary key references public.club57_empresa_empleados (id) on delete cascade,
  salario_mensual numeric(12, 2) not null check (salario_mensual > 0),
  updated_at timestamptz not null default now()
);

alter table public.club57_empleado_salarios enable row level security;

drop policy if exists "El responsable ve los salarios de su empresa" on public.club57_empleado_salarios;
create policy "El responsable ve los salarios de su empresa"
  on public.club57_empleado_salarios for select
  using (
    exists (
      select 1 from public.club57_empresa_empleados e
      where e.id = empleado_id and e.empresa_id = public.club57_mi_empresa_responsable()
    )
  );

-- ---------------------------------------------------------------------
-- 3) Precarga de empleados
-- ---------------------------------------------------------------------
create table if not exists public.club57_empresa_precarga (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.club57_empresas (id) on delete cascade,
  nombre text check (nombre is null or length(nombre) <= 120),
  correo text check (correo is null or correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  numero_empleado text check (numero_empleado is null or length(btrim(numero_empleado)) between 1 and 40),
  salario_mensual numeric(12, 2) check (salario_mensual is null or salario_mensual > 0),
  linea_tipo text not null check (linea_tipo in ('porcentaje', 'monto')),
  linea_valor numeric(12, 2) not null check (linea_valor > 0),
  usado_at timestamptz,
  empleado_id uuid references public.club57_empresa_empleados (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint club57_empresa_precarga_identifica check (correo is not null or numero_empleado is not null)
);

create index if not exists club57_empresa_precarga_empresa_idx on public.club57_empresa_precarga (empresa_id);

alter table public.club57_empresa_precarga enable row level security;

drop policy if exists "El responsable ve su precarga" on public.club57_empresa_precarga;
create policy "El responsable ve su precarga"
  on public.club57_empresa_precarga for select
  using (empresa_id = public.club57_mi_empresa_responsable());

-- ---------------------------------------------------------------------
-- 4) Reglas de la línea de crédito
-- ---------------------------------------------------------------------
-- Línea final: % del salario o monto fijo, nunca más del salario neto.
create or replace function public.club57_calcular_linea(p_tipo text, p_valor numeric, p_salario numeric)
returns numeric
language plpgsql
immutable
as $$
begin
  if p_tipo not in ('porcentaje', 'monto') or p_valor is null or p_valor <= 0 then
    raise exception 'Define la línea de crédito: un porcentaje del salario o un monto.';
  end if;
  if p_salario is not null and p_salario <= 0 then
    raise exception 'El salario debe ser mayor a 0.';
  end if;
  if p_tipo = 'porcentaje' then
    if p_salario is null then
      raise exception 'Para una línea en porcentaje, captura el salario mensual neto.';
    end if;
    if p_valor > 100 then
      raise exception 'La línea no puede pasar del 100 %% del salario.';
    end if;
    return round(p_salario * p_valor / 100, 2);
  end if;
  if p_salario is not null and p_valor > p_salario then
    raise exception 'La línea no puede pasar del salario mensual neto.';
  end if;
  return round(p_valor, 2);
end;
$$;

-- Aplica una línea (y el salario) a un vínculo; lo deja activo.
create or replace function public.club57_aplicar_linea(
  p_empleado_id uuid,
  p_salario numeric,
  p_tipo text,
  p_valor numeric,
  p_automatico boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_linea numeric := public.club57_calcular_linea(p_tipo, p_valor, p_salario);
begin
  update public.club57_empresa_empleados
  set estado = 'activo',
      linea_tipo = p_tipo,
      linea_porcentaje = case when p_tipo = 'porcentaje' then p_valor else null end,
      linea_credito = v_linea,
      motivo = null,
      resuelto_at = coalesce(resuelto_at, now()),
      resuelto_por = case when p_automatico then resuelto_por else coalesce(resuelto_por, auth.uid()) end,
      aprobado_automatico = aprobado_automatico or p_automatico
  where id = p_empleado_id;

  if p_salario is not null then
    insert into public.club57_empleado_salarios (empleado_id, salario_mensual)
    values (p_empleado_id, round(p_salario, 2))
    on conflict (empleado_id) do update set salario_mensual = excluded.salario_mensual, updated_at = now();
  else
    delete from public.club57_empleado_salarios where empleado_id = p_empleado_id;
  end if;
end;
$$;

revoke all on function public.club57_aplicar_linea(uuid, numeric, text, numeric, boolean) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5) Vincularse con el código
-- ---------------------------------------------------------------------
-- Para el formulario (aún sin sesión): ¿el código es de una empresa activa?
create or replace function public.club57_empresa_por_codigo(p_codigo text)
returns table (nombre_comercial text, exige_numero_empleado boolean)
language sql
security definer
set search_path = public
stable
as $$
  select e.nombre_comercial, e.exige_numero_empleado
  from public.club57_empresas e
  where e.codigo = upper(btrim(coalesce(p_codigo, ''))) and e.estado = 'activa';
$$;

grant execute on function public.club57_empresa_por_codigo(text) to anon, authenticated;

-- Crea el vínculo de un miembro; si coincide con la precarga, lo aprueba.
create or replace function public.club57_crear_vinculo(
  p_member_id uuid,
  p_codigo text,
  p_numero text,
  p_origen text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emp public.club57_empresas;
  v_numero text := nullif(btrim(coalesce(p_numero, '')), '');
  v_correo text;
  v_id uuid;
  v_pre public.club57_empresa_precarga;
begin
  select * into v_emp from public.club57_empresas
  where codigo = upper(btrim(coalesce(p_codigo, ''))) and estado = 'activa';
  if not found then
    raise exception 'No encontramos una empresa activa con ese código.' using errcode = 'F57EC';
  end if;
  if v_emp.exige_numero_empleado and v_numero is null then
    raise exception 'Tu empresa pide tu número de empleado.' using errcode = 'F57EN';
  end if;
  if exists (
    select 1 from public.club57_empresa_empleados
    where member_id = p_member_id and estado in ('pendiente', 'activo')
  ) then
    raise exception 'Ya tienes una empresa vinculada o una solicitud en revisión.' using errcode = 'F57EV';
  end if;

  insert into public.club57_empresa_empleados (empresa_id, member_id, numero_empleado, origen)
  values (v_emp.id, p_member_id, v_numero, p_origen)
  returning id into v_id;

  select lower(email) into v_correo from public.club57_members where id = p_member_id;
  select * into v_pre from public.club57_empresa_precarga p
  where p.empresa_id = v_emp.id and p.usado_at is null
    and ((p.correo is not null and lower(p.correo) = v_correo)
      or (v_numero is not null and p.numero_empleado is not null and btrim(p.numero_empleado) = v_numero))
  order by (p.correo is not null and lower(p.correo) = v_correo) desc, p.created_at
  limit 1;

  if found then
    begin
      perform public.club57_aplicar_linea(v_id, v_pre.salario_mensual, v_pre.linea_tipo, v_pre.linea_valor, true);
      update public.club57_empresa_precarga set usado_at = now(), empleado_id = v_id where id = v_pre.id;
      if v_numero is null and v_pre.numero_empleado is not null then
        update public.club57_empresa_empleados set numero_empleado = v_pre.numero_empleado where id = v_id;
      end if;
      return 'activo';
    exception when others then
      -- Datos de precarga inválidos: queda pendiente para revisión manual.
      return 'pendiente';
    end;
  end if;
  return 'pendiente';
end;
$$;

revoke all on function public.club57_crear_vinculo(uuid, text, text, text) from public, anon, authenticated;

-- Desde Mi cuenta (miembro con sesión). Exige la autorización explícita.
create or replace function public.club57_vincular_empresa(p_codigo text, p_numero text, p_acepta boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (select 1 from public.club57_members where id = auth.uid()) then
    raise exception 'Inicia sesión con tu cuenta de Club 57.';
  end if;
  if not coalesce(p_acepta, false) then
    raise exception 'Necesitamos tu autorización para vincularte con tu empresa.' using errcode = 'F57EA';
  end if;
  return public.club57_crear_vinculo(auth.uid(), p_codigo, p_numero, 'cuenta');
end;
$$;

revoke all on function public.club57_vincular_empresa(text, text, boolean) from public, anon;
grant execute on function public.club57_vincular_empresa(text, text, boolean) to authenticated;

-- El empleado retira su solicitud mientras está en revisión.
create or replace function public.club57_cancelar_vinculo()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.club57_empresa_empleados
  set estado = 'cancelado', resuelto_at = now(), resuelto_por = auth.uid(), motivo = 'Cancelada por el empleado'
  where member_id = auth.uid() and estado = 'pendiente';
  if not found then
    raise exception 'No tienes una solicitud en revisión.';
  end if;
end;
$$;

revoke all on function public.club57_cancelar_vinculo() from public, anon;
grant execute on function public.club57_cancelar_vinculo() to authenticated;

-- Registro nuevo con «Tengo código de empresa»: el código viaja en los datos
-- de la cuenta. Corre después de crear la membresía (los triggers de una
-- tabla se ejecutan en orden alfabético) y nunca tumba el registro: si el
-- código ya no sirve, la cuenta se crea igual sin vínculo.
create or replace function public.club57_vincular_desde_registro()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'empresa_codigo', '')), '');
begin
  if v_codigo is null or coalesce(new.raw_user_meta_data ->> 'empresa_acepta', '') <> 'true' then
    return new;
  end if;
  begin
    perform public.club57_crear_vinculo(new.id, v_codigo, new.raw_user_meta_data ->> 'empresa_numero', 'registro');
  exception when others then
    null;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_zz_empresa on auth.users;
create trigger on_auth_user_created_zz_empresa
  after insert on auth.users
  for each row execute function public.club57_vincular_desde_registro();

-- Lo que ve el empleado en Mi cuenta → Empresarial.
create or replace function public.club57_mis_empresas()
returns table (
  id uuid,
  empresa_nombre text,
  empresa_estado text,
  estado text,
  numero_empleado text,
  linea_credito numeric,
  motivo text,
  solicitado_at timestamptz,
  resuelto_at timestamptz,
  domicilio_entrega text
)
language sql
security definer
set search_path = public
stable
as $$
  select v.id, e.nombre_comercial, e.estado, v.estado, v.numero_empleado, v.linea_credito, v.motivo,
         v.solicitado_at, v.resuelto_at, e.domicilio_entrega
  from public.club57_empresa_empleados v
  join public.club57_empresas e on e.id = v.empresa_id
  where v.member_id = auth.uid()
  order by v.solicitado_at desc;
$$;

grant execute on function public.club57_mis_empresas() to authenticated;

-- ---------------------------------------------------------------------
-- 6) Portal Empresa (solo el responsable de la empresa)
-- ---------------------------------------------------------------------
create or replace function public.club57_requiere_responsable()
returns uuid
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_empresa uuid := public.club57_mi_empresa_responsable();
begin
  if v_empresa is null then
    raise exception 'No autorizado.';
  end if;
  return v_empresa;
end;
$$;

revoke all on function public.club57_requiere_responsable() from public, anon, authenticated;

create or replace function public.club57_portal_empleados()
returns table (
  id uuid,
  member_id uuid,
  nombre text,
  correo text,
  telefono text,
  numero_empleado text,
  estado text,
  linea_tipo text,
  linea_porcentaje numeric,
  linea_credito numeric,
  salario_mensual numeric,
  nomina_frecuencia text,
  nomina_dia_semana smallint,
  nomina_dia_mes smallint,
  motivo text,
  origen text,
  aprobado_automatico boolean,
  solicitado_at timestamptz,
  resuelto_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_empresa uuid := public.club57_requiere_responsable();
begin
  return query
  select v.id, v.member_id, m.full_name, m.email, m.phone, v.numero_empleado, v.estado, v.linea_tipo,
         v.linea_porcentaje, v.linea_credito, s.salario_mensual, v.nomina_frecuencia, v.nomina_dia_semana,
         v.nomina_dia_mes, v.motivo, v.origen, v.aprobado_automatico, v.solicitado_at, v.resuelto_at
  from public.club57_empresa_empleados v
  join public.club57_members m on m.id = v.member_id
  left join public.club57_empleado_salarios s on s.empleado_id = v.id
  where v.empresa_id = v_empresa
  order by v.solicitado_at desc;
end;
$$;

revoke all on function public.club57_portal_empleados() from public, anon;
grant execute on function public.club57_portal_empleados() to authenticated;

-- Aprobar una solicitud o ajustar a un empleado activo: salario, línea y,
-- si cobra distinto al resto, su nómina.
create or replace function public.club57_portal_guardar_empleado(
  p_empleado_id uuid,
  p_salario numeric,
  p_linea_tipo text,
  p_linea_valor numeric,
  p_numero text,
  p_nomina_frecuencia text,
  p_nomina_dia_semana smallint,
  p_nomina_dia_mes smallint
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid := public.club57_requiere_responsable();
  v_estado text;
  v_exige boolean;
  v_numero text := nullif(btrim(coalesce(p_numero, '')), '');
begin
  select v.estado into v_estado from public.club57_empresa_empleados v
  where v.id = p_empleado_id and v.empresa_id = v_empresa
  for update;
  if not found then
    raise exception 'Empleado no encontrado.';
  end if;
  if v_estado not in ('pendiente', 'activo') then
    raise exception 'Este empleado ya no está activo ni en revisión.';
  end if;
  select exige_numero_empleado into v_exige from public.club57_empresas where id = v_empresa;
  if v_exige and v_numero is null then
    raise exception 'Captura el número de empleado.';
  end if;
  if p_nomina_frecuencia is not null and p_nomina_frecuencia not in ('semanal', 'quincenal', 'mensual') then
    raise exception 'Frecuencia de nómina inválida.';
  end if;

  update public.club57_empresa_empleados
  set numero_empleado = v_numero,
      nomina_frecuencia = p_nomina_frecuencia,
      nomina_dia_semana = case when p_nomina_frecuencia = 'semanal' then coalesce(p_nomina_dia_semana, 5) else null end,
      nomina_dia_mes = case when p_nomina_frecuencia = 'mensual' then coalesce(p_nomina_dia_mes, 0) else null end
  where id = p_empleado_id;

  perform public.club57_aplicar_linea(p_empleado_id, p_salario, p_linea_tipo, p_linea_valor, false);
  return v_estado;
end;
$$;

revoke all on function public.club57_portal_guardar_empleado(uuid, numeric, text, numeric, text, text, smallint, smallint) from public, anon;
grant execute on function public.club57_portal_guardar_empleado(uuid, numeric, text, numeric, text, text, smallint, smallint) to authenticated;

-- Rechazar una solicitud o dar de baja a un empleado activo.
create or replace function public.club57_portal_cerrar_empleado(p_empleado_id uuid, p_motivo text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid := public.club57_requiere_responsable();
  v_estado text;
  v_nuevo text;
  v_motivo text := nullif(btrim(coalesce(p_motivo, '')), '');
begin
  if v_motivo is null then
    raise exception 'Escribe el motivo.';
  end if;
  select estado into v_estado from public.club57_empresa_empleados
  where id = p_empleado_id and empresa_id = v_empresa
  for update;
  if not found then
    raise exception 'Empleado no encontrado.';
  end if;
  v_nuevo := case v_estado when 'pendiente' then 'rechazado' when 'activo' then 'baja' else null end;
  if v_nuevo is null then
    raise exception 'Este empleado ya no está activo ni en revisión.';
  end if;
  update public.club57_empresa_empleados
  set estado = v_nuevo, motivo = left(v_motivo, 500), resuelto_at = now(), resuelto_por = auth.uid()
  where id = p_empleado_id;
  -- El salario ya no hace falta guardarlo.
  delete from public.club57_empleado_salarios where empleado_id = p_empleado_id;
  return v_nuevo;
end;
$$;

revoke all on function public.club57_portal_cerrar_empleado(uuid, text) from public, anon;
grant execute on function public.club57_portal_cerrar_empleado(uuid, text) to authenticated;

-- Nómina y política de la empresa (informativo para el crédito revolvente).
create or replace function public.club57_portal_configurar_nomina(
  p_frecuencia text,
  p_dia_semana smallint,
  p_dia_mes smallint,
  p_descuentos smallint,
  p_politica numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid := public.club57_requiere_responsable();
begin
  if p_frecuencia not in ('semanal', 'quincenal', 'mensual') then
    raise exception 'Elige la frecuencia de nómina.';
  end if;
  update public.club57_empresas
  set nomina_frecuencia = p_frecuencia,
      nomina_dia_semana = case when p_frecuencia = 'semanal' then coalesce(p_dia_semana, 5) else null end,
      nomina_dia_mes = case when p_frecuencia = 'mensual' then coalesce(p_dia_mes, 0) else null end,
      descuentos_por_compra = p_descuentos,
      politica_porcentaje = p_politica
  where id = v_empresa;
  insert into public.club57_empresas_bitacora (empresa_id, accion, detalle, actor_id)
  values (v_empresa, 'nomina', 'Nómina actualizada desde el Portal Empresa', null);
end;
$$;

revoke all on function public.club57_portal_configurar_nomina(text, smallint, smallint, smallint, numeric) from public, anon;
grant execute on function public.club57_portal_configurar_nomina(text, smallint, smallint, smallint, numeric) to authenticated;

-- La empresa también puede cambiar su código si se compartió de más.
create or replace function public.club57_portal_regenerar_codigo()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid := public.club57_requiere_responsable();
  v_anterior text;
  v_codigo text;
begin
  select codigo into v_anterior from public.club57_empresas where id = v_empresa for update;
  v_codigo := public.club57_empresa_nuevo_codigo((select nombre_comercial from public.club57_empresas where id = v_empresa));
  update public.club57_empresas set codigo = v_codigo where id = v_empresa;
  insert into public.club57_empresas_bitacora (empresa_id, accion, detalle, actor_id)
  values (v_empresa, 'codigo', 'Cambiado desde el Portal Empresa. Código anterior: ' || coalesce(v_anterior, '—'), null);
  return v_codigo;
end;
$$;

revoke all on function public.club57_portal_regenerar_codigo() from public, anon;
grant execute on function public.club57_portal_regenerar_codigo() to authenticated;

-- Precarga: reemplaza la lista pendiente y aprueba en el acto las
-- solicitudes en revisión que coincidan. p_filas: arreglo de objetos con
-- nombre, correo, numero_empleado, salario_mensual, linea_tipo, linea_valor.
create or replace function public.club57_portal_precargar(p_filas jsonb)
returns table (cargadas integer, aprobadas integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid := public.club57_requiere_responsable();
  v_fila jsonb;
  v_cargadas integer := 0;
  v_aprobadas integer := 0;
  v_pre public.club57_empresa_precarga;
  v_emp record;
begin
  if jsonb_typeof(p_filas) <> 'array' or jsonb_array_length(p_filas) > 5000 then
    raise exception 'La lista no es válida (máximo 5,000 filas).';
  end if;

  delete from public.club57_empresa_precarga where empresa_id = v_empresa and usado_at is null;

  for v_fila in select * from jsonb_array_elements(p_filas) loop
    insert into public.club57_empresa_precarga (empresa_id, nombre, correo, numero_empleado, salario_mensual, linea_tipo, linea_valor)
    values (
      v_empresa,
      nullif(btrim(v_fila ->> 'nombre'), ''),
      nullif(lower(btrim(v_fila ->> 'correo')), ''),
      nullif(btrim(v_fila ->> 'numero_empleado'), ''),
      nullif(v_fila ->> 'salario_mensual', '')::numeric,
      v_fila ->> 'linea_tipo',
      (v_fila ->> 'linea_valor')::numeric
    )
    returning * into v_pre;
    -- Valida la combinación salario/línea antes de aceptarla.
    perform public.club57_calcular_linea(v_pre.linea_tipo, v_pre.linea_valor, v_pre.salario_mensual);
    v_cargadas := v_cargadas + 1;
  end loop;

  -- Solicitudes en revisión que coinciden: se aprueban con esos datos.
  for v_emp in
    select v.id as empleado_id, v.numero_empleado, lower(m.email) as correo
    from public.club57_empresa_empleados v
    join public.club57_members m on m.id = v.member_id
    where v.empresa_id = v_empresa and v.estado = 'pendiente'
  loop
    select * into v_pre from public.club57_empresa_precarga p
    where p.empresa_id = v_empresa and p.usado_at is null
      and ((p.correo is not null and p.correo = v_emp.correo)
        or (v_emp.numero_empleado is not null and p.numero_empleado = btrim(v_emp.numero_empleado)))
    limit 1;
    if found then
      perform public.club57_aplicar_linea(v_emp.empleado_id, v_pre.salario_mensual, v_pre.linea_tipo, v_pre.linea_valor, true);
      update public.club57_empresa_precarga set usado_at = now(), empleado_id = v_emp.empleado_id where id = v_pre.id;
      update public.club57_empresa_empleados
      set numero_empleado = coalesce(numero_empleado, v_pre.numero_empleado), resuelto_por = auth.uid()
      where id = v_emp.empleado_id;
      v_aprobadas := v_aprobadas + 1;
    end if;
  end loop;

  return query select v_cargadas, v_aprobadas;
end;
$$;

revoke all on function public.club57_portal_precargar(jsonb) from public, anon;
grant execute on function public.club57_portal_precargar(jsonb) to authenticated;
