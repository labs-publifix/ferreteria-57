-- Club 57 Empresarial · Etapa 1: empresas.
--
-- Una empresa con convenio permite que sus empleados compren con cargo a
-- ella (etapas siguientes). Aquí se crea la base:
--   1) club57_empresas: datos de la empresa, datos fiscales, responsable,
--      convenio (crédito, corte, plazos, nómina) y estado.
--      Estados: solicitud → activa → suspendida → baja; o rechazada.
--   2) club57_empresas_bitacora: cada cambio (alta, aprobación, convenio,
--      suspensión, código…) con quién y cuándo.
--   3) club57_empresa_nuevo_codigo(): código fácil de dictar y difícil de
--      adivinar, p. ej. F57-ACME-7K2Q.
--   4) club57_empresa_cambiar_estado(): transiciones válidas en un solo
--      lugar; al activar por primera vez genera el código.
--
-- La solicitud pública se guarda desde el servidor del sitio (con la llave
-- de servicio), nunca con insert directo desde el navegador: la tabla solo
-- la leen y escriben admin y operador.
--
-- Idempotente: se puede correr más de una vez.

-- ---------------------------------------------------------------------
-- 1) Empresas
-- ---------------------------------------------------------------------
create table if not exists public.club57_empresas (
  id uuid primary key default gen_random_uuid(),
  -- Empresa
  razon_social text not null check (length(btrim(razon_social)) between 2 and 200),
  nombre_comercial text not null check (length(btrim(nombre_comercial)) between 2 and 120),
  rfc text check (rfc is null or rfc ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$'),
  giro text check (giro is null or length(giro) <= 120),
  num_empleados integer check (num_empleados is null or num_empleados between 1 and 1000000),
  -- Datos fiscales
  regimen_fiscal text check (regimen_fiscal is null or length(regimen_fiscal) <= 120),
  cp_fiscal text check (cp_fiscal is null or cp_fiscal ~ '^[0-9]{5}$'),
  uso_cfdi text check (uso_cfdi is null or length(uso_cfdi) <= 120),
  correo_facturas text check (correo_facturas is null or correo_facturas ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  -- Entrega (por si los empleados reciben ahí sus pedidos)
  domicilio_entrega text check (domicilio_entrega is null or length(domicilio_entrega) <= 400),
  -- Responsable (un solo usuario por empresa; su acceso al portal llega en
  -- la etapa 2 y queda en responsable_user_id)
  responsable_nombre text not null check (length(btrim(responsable_nombre)) between 2 and 120),
  responsable_puesto text check (responsable_puesto is null or length(responsable_puesto) <= 120),
  responsable_correo text not null check (responsable_correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  responsable_telefono text check (responsable_telefono is null or responsable_telefono ~ '^[0-9]{10}$'),
  responsable_user_id uuid references auth.users (id) on delete set null,
  -- Convenio (lo define Ferretería 57)
  limite_credito numeric(12, 2) check (limite_credito is null or limite_credito >= 0),
  dia_corte smallint check (dia_corte is null or dia_corte between 0 and 28), -- 0 = último día del mes
  plazo_pago_dias smallint check (plazo_pago_dias is null or plazo_pago_dias between 0 and 120),
  plazo_autorizacion_dias smallint not null default 5 check (plazo_autorizacion_dias between 1 and 30),
  exige_numero_empleado boolean not null default false,
  -- Nómina de la empresa (informativo: con esto se calcula cuándo vuelve a
  -- estar disponible el crédito de cada empleado). La empresa también lo
  -- ajusta desde su portal.
  nomina_frecuencia text check (nomina_frecuencia is null or nomina_frecuencia in ('semanal', 'quincenal', 'mensual')),
  nomina_dia_semana smallint check (nomina_dia_semana is null or nomina_dia_semana between 1 and 7), -- 1 = lunes
  nomina_dia_mes smallint check (nomina_dia_mes is null or nomina_dia_mes between 0 and 28), -- 0 = último día
  descuentos_por_compra smallint not null default 1 check (descuentos_por_compra between 1 and 24),
  politica_porcentaje numeric(5, 2) check (politica_porcentaje is null or (politica_porcentaje > 0 and politica_porcentaje <= 100)),
  -- Estado y código
  estado text not null default 'solicitud' check (estado in ('solicitud', 'activa', 'suspendida', 'baja', 'rechazada')),
  motivo_estado text check (motivo_estado is null or length(motivo_estado) <= 500),
  codigo text unique,
  origen text not null default 'solicitud' check (origen in ('solicitud', 'alta_directa')),
  acepto_terminos_at timestamptz,
  notas_internas text check (notas_internas is null or length(notas_internas) <= 2000),
  activada_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club57_empresas_estado_idx on public.club57_empresas (estado, created_at desc);
create unique index if not exists club57_empresas_rfc_vigente_key
  on public.club57_empresas (rfc)
  where rfc is not null and estado in ('solicitud', 'activa', 'suspendida');

alter table public.club57_empresas enable row level security;

drop policy if exists "El personal administra las empresas de Club 57" on public.club57_empresas;
create policy "El personal administra las empresas de Club 57"
  on public.club57_empresas for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.club57_empresas_touch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists club57_empresas_touch on public.club57_empresas;
create trigger club57_empresas_touch
  before update on public.club57_empresas
  for each row execute function public.club57_empresas_touch();

-- ---------------------------------------------------------------------
-- 2) Bitácora
-- ---------------------------------------------------------------------
create table if not exists public.club57_empresas_bitacora (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.club57_empresas (id) on delete cascade,
  accion text not null check (accion in (
    'solicitud', 'alta', 'aprobada', 'rechazada', 'suspendida', 'reactivada', 'baja',
    'datos', 'convenio', 'codigo'
  )),
  detalle text check (detalle is null or length(detalle) <= 1000),
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists club57_empresas_bitacora_empresa_idx
  on public.club57_empresas_bitacora (empresa_id, created_at desc);

alter table public.club57_empresas_bitacora enable row level security;

drop policy if exists "El personal lee la bitácora de empresas" on public.club57_empresas_bitacora;
create policy "El personal lee la bitácora de empresas"
  on public.club57_empresas_bitacora for select
  using (public.is_admin());

drop policy if exists "El personal registra en la bitácora de empresas" on public.club57_empresas_bitacora;
create policy "El personal registra en la bitácora de empresas"
  on public.club57_empresas_bitacora for insert
  with check (public.is_admin() and actor_id = auth.uid());

-- ---------------------------------------------------------------------
-- 3) Código de empresa: F57-<hasta 6 letras del nombre>-<4 caracteres>
--    Sin caracteres que se confunden al dictar (0/O, 1/I/L).
-- ---------------------------------------------------------------------
create or replace function public.club57_empresa_nuevo_codigo(p_nombre text)
returns text
language plpgsql
security definer
set search_path = public, extensions
volatile
as $$
declare
  v_base text;
  v_alfabeto constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_sufijo text;
  v_codigo text;
  i integer;
begin
  v_base := upper(regexp_replace(public.f57_unaccent(coalesce(p_nombre, '')), '[^A-Za-z]', '', 'g'));
  v_base := left(coalesce(nullif(v_base, ''), 'EMP'), 6);
  loop
    v_sufijo := '';
    for i in 1..4 loop
      v_sufijo := v_sufijo || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::integer, 1);
    end loop;
    v_codigo := 'F57-' || v_base || '-' || v_sufijo;
    exit when not exists (select 1 from public.club57_empresas where codigo = v_codigo);
  end loop;
  return v_codigo;
end;
$$;

revoke all on function public.club57_empresa_nuevo_codigo(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) Cambios de estado (admin y operador)
--    solicitud  → activa | rechazada
--    activa     → suspendida | baja
--    suspendida → activa | baja
--    Para activar, el convenio debe estar completo.
-- ---------------------------------------------------------------------
create or replace function public.club57_empresa_cambiar_estado(p_empresa_id uuid, p_estado text, p_motivo text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emp public.club57_empresas;
  v_accion text;
  v_motivo text := nullif(btrim(coalesce(p_motivo, '')), '');
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;

  select * into v_emp from public.club57_empresas where id = p_empresa_id for update;
  if not found then
    raise exception 'Empresa no encontrada.';
  end if;

  if not (
    (v_emp.estado = 'solicitud' and p_estado in ('activa', 'rechazada'))
    or (v_emp.estado = 'activa' and p_estado in ('suspendida', 'baja'))
    or (v_emp.estado = 'suspendida' and p_estado in ('activa', 'baja'))
  ) then
    raise exception 'No se puede pasar de % a %.', v_emp.estado, p_estado;
  end if;

  if p_estado in ('rechazada', 'suspendida', 'baja') and v_motivo is null then
    raise exception 'Escribe el motivo.';
  end if;

  if p_estado = 'activa' and (
    v_emp.limite_credito is null or v_emp.dia_corte is null or v_emp.plazo_pago_dias is null
  ) then
    raise exception 'Completa el convenio (límite de crédito, día de corte y plazo de pago) antes de activar.';
  end if;

  v_accion := case
    when p_estado = 'activa' and v_emp.estado = 'solicitud' then 'aprobada'
    when p_estado = 'activa' then 'reactivada'
    else p_estado
  end;

  update public.club57_empresas
  set estado = p_estado,
      motivo_estado = case when p_estado = 'activa' then null else v_motivo end,
      codigo = case when p_estado = 'activa' and codigo is null then public.club57_empresa_nuevo_codigo(nombre_comercial) else codigo end,
      activada_at = case when p_estado = 'activa' and activada_at is null then now() else activada_at end
  where id = p_empresa_id;

  insert into public.club57_empresas_bitacora (empresa_id, accion, detalle, actor_id)
  values (p_empresa_id, v_accion, v_motivo, auth.uid());

  return (select codigo from public.club57_empresas where id = p_empresa_id);
end;
$$;

revoke all on function public.club57_empresa_cambiar_estado(uuid, text, text) from public, anon;
grant execute on function public.club57_empresa_cambiar_estado(uuid, text, text) to authenticated;

-- Cambiar el código (si se filtró). El anterior deja de servir; los
-- empleados ya vinculados no se ven afectados.
create or replace function public.club57_empresa_regenerar_codigo(p_empresa_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emp public.club57_empresas;
  v_codigo text;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;
  select * into v_emp from public.club57_empresas where id = p_empresa_id for update;
  if not found then
    raise exception 'Empresa no encontrada.';
  end if;
  if v_emp.estado not in ('activa', 'suspendida') then
    raise exception 'Solo las empresas activas o suspendidas tienen código.';
  end if;

  v_codigo := public.club57_empresa_nuevo_codigo(v_emp.nombre_comercial);
  update public.club57_empresas set codigo = v_codigo where id = p_empresa_id;
  insert into public.club57_empresas_bitacora (empresa_id, accion, detalle, actor_id)
  values (p_empresa_id, 'codigo', 'Código anterior: ' || coalesce(v_emp.codigo, '—'), auth.uid());
  return v_codigo;
end;
$$;

revoke all on function public.club57_empresa_regenerar_codigo(uuid) from public, anon;
grant execute on function public.club57_empresa_regenerar_codigo(uuid) to authenticated;

-- Alta directa desde el panel: la empresa nace activa con su código, en la
-- misma transacción que su bitácora.
create or replace function public.club57_empresa_activar_alta_directa(p_empresa_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;
  insert into public.club57_empresas_bitacora (empresa_id, accion, detalle, actor_id)
  values (p_empresa_id, 'alta', 'Alta directa desde el panel', auth.uid());
  return public.club57_empresa_cambiar_estado(p_empresa_id, 'activa', null);
end;
$$;

revoke all on function public.club57_empresa_activar_alta_directa(uuid) from public, anon;
grant execute on function public.club57_empresa_activar_alta_directa(uuid) to authenticated;
