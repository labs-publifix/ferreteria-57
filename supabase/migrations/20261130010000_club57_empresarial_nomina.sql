-- Club 57 Empresarial · Etapa 4: crédito revolvente y nómina.
--
-- Relación empleado ↔ empresa (informativa: Ferretería 57 sigue cobrando a
-- la empresa su corte mensual completo; la Etapa 5 lo cubre).
--
-- 1) Al autorizarse un pedido con cargo a la empresa, se reparte en N
--    descuentos de nómina (descuentos_por_compra de la empresa) en las
--    siguientes fechas de pago del empleado (su frecuencia o la de la
--    empresa). El último descuento absorbe los centavos.
-- 2) Cada fecha de pago de cada empresa es una «nómina» que la empresa
--    confirma desde su portal, con excepciones por empleado («no se
--    aplicó» o «monto distinto»). Lo que no se descontó se reprograma a la
--    siguiente nómina del empleado. Si no confirma en 3 días hábiles
--    después de la fecha, se toma como aplicada (la tarea diaria lo hace).
-- 3) Crédito disponible del empleado = línea − pedidos en espera − lo que
--    falta por descontar de sus pedidos autorizados. Cada descuento
--    aplicado libera crédito.
-- 4) Cancelación de un pedido autorizado: sus descuentos programados se
--    cancelan. Baja del empleado: lo que falta por descontar queda como
--    «saldo pendiente al momento de la baja» (la empresa lo resuelve en el
--    finiquito) y sus descuentos programados se cierran.
-- 5) Cambio de frecuencia: aplica a los descuentos que todavía no se han
--    programado (los ya programados conservan su fecha).
--
-- Idempotente: se puede correr más de una vez.

alter table public.club57_empresa_empleados
  add column if not exists saldo_baja numeric(12, 2) check (saldo_baja is null or saldo_baja >= 0);

-- ---------------------------------------------------------------------
-- 1) Tablas
-- ---------------------------------------------------------------------
create table if not exists public.club57_nominas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.club57_empresas (id) on delete cascade,
  fecha date not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmada', 'tacita')),
  confirmada_at timestamptz,
  confirmada_por uuid references auth.users (id) on delete set null,
  avisado_at timestamptz,
  created_at timestamptz not null default now(),
  unique (empresa_id, fecha)
);

create index if not exists club57_nominas_pendientes_idx on public.club57_nominas (fecha) where estado = 'pendiente';

alter table public.club57_nominas enable row level security;

drop policy if exists "El responsable ve las nóminas de su empresa" on public.club57_nominas;
create policy "El responsable ve las nóminas de su empresa"
  on public.club57_nominas for select
  using (empresa_id = public.club57_mi_empresa_responsable());

create table if not exists public.club57_descuentos_nomina (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.club57_empresas (id) on delete cascade,
  empleado_id uuid not null references public.club57_empresa_empleados (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  fecha_nomina date not null,
  numero smallint not null check (numero >= 1),
  de_total smallint not null check (de_total >= 1),
  monto numeric(12, 2) not null check (monto > 0),
  monto_aplicado numeric(12, 2) check (monto_aplicado is null or monto_aplicado >= 0),
  -- programado: por aplicar · aplicado: descontado (total o parcial) ·
  -- no_aplicado: la empresa marcó que no se descontó (se reprogramó) ·
  -- cancelado: el pedido se canceló · baja: el empleado salió con saldo.
  estado text not null default 'programado' check (estado in ('programado', 'aplicado', 'no_aplicado', 'cancelado', 'baja')),
  reprogramado_de uuid references public.club57_descuentos_nomina (id) on delete set null,
  aplicado_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists club57_descuentos_nomina_empresa_idx on public.club57_descuentos_nomina (empresa_id, fecha_nomina);
create index if not exists club57_descuentos_nomina_empleado_idx on public.club57_descuentos_nomina (empleado_id, estado);
create index if not exists club57_descuentos_nomina_order_idx on public.club57_descuentos_nomina (order_id);

alter table public.club57_descuentos_nomina enable row level security;

-- El empleado y su empresa. Ferretería 57 no ve el detalle de descuentos.
drop policy if exists "Empleado y empresa ven los descuentos" on public.club57_descuentos_nomina;
create policy "Empleado y empresa ven los descuentos"
  on public.club57_descuentos_nomina for select
  using (
    empresa_id = public.club57_mi_empresa_responsable()
    or exists (
      select 1 from public.club57_empresa_empleados v
      where v.id = empleado_id and v.member_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 2) Calendario de nómina
-- ---------------------------------------------------------------------
-- ¿Es fecha de pago? semanal: el día de la semana (1 = lunes … 7 =
-- domingo); quincenal: 15 y último del mes; mensual: el día del mes
-- (0 = último).
create or replace function public.club57_es_nomina(p_dia date, p_frecuencia text, p_dia_semana smallint, p_dia_mes smallint)
returns boolean
language sql
immutable
as $$
  select case coalesce(p_frecuencia, 'quincenal')
    when 'semanal' then extract(isodow from p_dia) = coalesce(p_dia_semana, 5)
    when 'mensual' then
      case when coalesce(p_dia_mes, 0) = 0
        then p_dia = (date_trunc('month', p_dia) + interval '1 month - 1 day')::date
        else extract(day from p_dia) = p_dia_mes
      end
    else extract(day from p_dia) = 15 or p_dia = (date_trunc('month', p_dia) + interval '1 month - 1 day')::date
  end;
$$;

-- Las siguientes p_n fechas de pago estrictamente después de p_desde.
create or replace function public.club57_proximas_nominas(
  p_frecuencia text,
  p_dia_semana smallint,
  p_dia_mes smallint,
  p_desde date,
  p_n integer
)
returns setof date
language plpgsql
immutable
as $$
declare
  v_dia date := p_desde;
  v_contadas integer := 0;
  v_vueltas integer := 0;
begin
  while v_contadas < greatest(p_n, 0) and v_vueltas < 2000 loop
    v_dia := v_dia + 1;
    v_vueltas := v_vueltas + 1;
    if public.club57_es_nomina(v_dia, p_frecuencia, p_dia_semana, p_dia_mes) then
      v_contadas := v_contadas + 1;
      return next v_dia;
    end if;
  end loop;
end;
$$;

-- Nómina vigente de un empleado: la suya si la empresa le asignó una, si no
-- la de la empresa.
create or replace function public.club57_nomina_empleado(p_empleado_id uuid)
returns table (frecuencia text, dia_semana smallint, dia_mes smallint)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(v.nomina_frecuencia, e.nomina_frecuencia, 'quincenal'),
    case when v.nomina_frecuencia is not null then v.nomina_dia_semana else e.nomina_dia_semana end,
    case when v.nomina_frecuencia is not null then v.nomina_dia_mes else e.nomina_dia_mes end
  from public.club57_empresa_empleados v
  join public.club57_empresas e on e.id = v.empresa_id
  where v.id = p_empleado_id;
$$;

revoke all on function public.club57_nomina_empleado(uuid) from public, anon, authenticated;

-- Siguiente fecha de pago de un empleado después de p_desde (y su nómina).
create or replace function public.club57_siguiente_nomina_empleado(p_empleado_id uuid, p_desde date)
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n record;
  v_fecha date;
  v_empresa uuid;
begin
  select * into v_n from public.club57_nomina_empleado(p_empleado_id);
  select f into v_fecha from public.club57_proximas_nominas(v_n.frecuencia, v_n.dia_semana, v_n.dia_mes, p_desde, 1) f;
  select empresa_id into v_empresa from public.club57_empresa_empleados where id = p_empleado_id;
  insert into public.club57_nominas (empresa_id, fecha) values (v_empresa, v_fecha) on conflict (empresa_id, fecha) do nothing;
  return v_fecha;
end;
$$;

revoke all on function public.club57_siguiente_nomina_empleado(uuid, date) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) Programar y cancelar descuentos (disparados por el pedido)
-- ---------------------------------------------------------------------
create or replace function public.club57_programar_descuentos(p_order_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o public.orders;
  v_emp public.club57_empresas;
  v_n record;
  v_partes integer;
  v_base numeric;
  v_fecha date;
  v_i integer := 0;
begin
  select * into v_o from public.orders where id = p_order_id;
  if not found or v_o.metodo_pago <> 'empresa' or v_o.empresa_empleado_id is null
     or v_o.status in ('cancelado', 'pendiente_autorizacion') then
    return 0;
  end if;
  if exists (select 1 from public.club57_descuentos_nomina where order_id = p_order_id) then
    return 0;
  end if;

  select * into v_emp from public.club57_empresas where id = v_o.empresa_id;
  select * into v_n from public.club57_nomina_empleado(v_o.empresa_empleado_id);
  v_partes := greatest(coalesce(v_emp.descuentos_por_compra, 1), 1);
  v_base := floor(v_o.total * 100 / v_partes) / 100;
  if v_base <= 0 then
    v_partes := 1;
    v_base := v_o.total;
  end if;

  for v_fecha in
    select f from public.club57_proximas_nominas(
      v_n.frecuencia, v_n.dia_semana, v_n.dia_mes,
      (coalesce(v_o.autorizado_at, now()) at time zone 'America/Mexico_City')::date, v_partes
    ) f
  loop
    v_i := v_i + 1;
    insert into public.club57_nominas (empresa_id, fecha) values (v_o.empresa_id, v_fecha) on conflict (empresa_id, fecha) do nothing;
    insert into public.club57_descuentos_nomina (empresa_id, empleado_id, order_id, fecha_nomina, numero, de_total, monto)
    values (
      v_o.empresa_id, v_o.empresa_empleado_id, p_order_id, v_fecha, v_i, v_partes,
      case when v_i = v_partes then v_o.total - v_base * (v_partes - 1) else v_base end
    );
  end loop;
  return v_i;
end;
$$;

revoke all on function public.club57_programar_descuentos(uuid) from public, anon, authenticated;

-- Pedido autorizado → se programan sus descuentos. Pedido cancelado → se
-- cancelan los que falten.
create or replace function public.club57_pedido_empresa_descuentos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.metodo_pago <> 'empresa' then
    return new;
  end if;
  if old.status = 'pendiente_autorizacion' and new.status = 'pagado' then
    perform public.club57_programar_descuentos(new.id);
  elsif new.status = 'cancelado' and old.status is distinct from 'cancelado' then
    update public.club57_descuentos_nomina set estado = 'cancelado'
    where order_id = new.id and estado = 'programado';
  end if;
  return new;
end;
$$;

drop trigger if exists club57_orders_descuentos on public.orders;
create trigger club57_orders_descuentos
  after update of status on public.orders
  for each row execute function public.club57_pedido_empresa_descuentos();

-- Pedidos ya autorizados antes de esta etapa: se programan ahora.
do $$
begin
  perform public.club57_programar_descuentos(o.id)
  from public.orders o
  where o.metodo_pago = 'empresa'
    and o.status not in ('cancelado', 'pendiente_autorizacion')
    and not exists (select 1 from public.club57_descuentos_nomina d where d.order_id = o.id);
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Saldo del empleado (crédito revolvente)
-- ---------------------------------------------------------------------
-- Lo que tiene comprometido: pedidos en espera completos + lo que falta
-- por descontar de sus pedidos autorizados. Reemplaza la definición de la
-- Etapa 3 (que sumaba los pedidos completos), así el checkout y la cuenta
-- ya liberan crédito con cada descuento aplicado.
create or replace function public.club57_empleado_comprometido(p_empleado_id uuid)
returns numeric
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(o.total - coalesce((
    select sum(d.monto_aplicado) from public.club57_descuentos_nomina d
    where d.order_id = o.id and d.estado = 'aplicado'
  ), 0)), 0)
  from public.orders o
  where o.empresa_empleado_id = p_empleado_id and o.metodo_pago = 'empresa' and o.status <> 'cancelado';
$$;

revoke all on function public.club57_empleado_comprometido(uuid) from public, anon, authenticated;

-- Desglose del saldo de un empleado.
create or replace function public.club57_saldo_empleado(p_empleado_id uuid)
returns table (en_espera numeric, por_descontar numeric, proximo_fecha date, proximo_monto numeric)
language sql
security definer
set search_path = public
stable
as $$
  with pedidos as (
    select o.id, o.status, o.total,
           coalesce((select sum(d.monto_aplicado) from public.club57_descuentos_nomina d
                     where d.order_id = o.id and d.estado = 'aplicado'), 0) as aplicado
    from public.orders o
    where o.empresa_empleado_id = p_empleado_id and o.metodo_pago = 'empresa' and o.status <> 'cancelado'
  ), proximo as (
    select d.fecha_nomina, sum(d.monto) as monto from public.club57_descuentos_nomina d
    where d.empleado_id = p_empleado_id and d.estado = 'programado'
    group by d.fecha_nomina order by d.fecha_nomina limit 1
  )
  select
    coalesce((select sum(total) from pedidos where status = 'pendiente_autorizacion'), 0),
    coalesce((select sum(total - aplicado) from pedidos where status <> 'pendiente_autorizacion'), 0),
    (select fecha_nomina from proximo),
    (select monto from proximo);
$$;

revoke all on function public.club57_saldo_empleado(uuid) from public, anon, authenticated;

-- Mi cuenta y checkout: se agregan el desglose y el próximo descuento.
drop function if exists public.club57_mi_credito_empresa();
create function public.club57_mi_credito_empresa()
returns table (
  empleado_id uuid,
  empresa_id uuid,
  empresa_nombre text,
  empresa_estado text,
  linea_credito numeric,
  comprometido numeric,
  disponible numeric,
  disponible_compra numeric,
  limitado_por_empresa boolean,
  plazo_autorizacion_dias smallint,
  domicilio_entrega text,
  en_espera numeric,
  por_descontar numeric,
  proximo_fecha date,
  proximo_monto numeric,
  nomina_frecuencia text,
  nomina_dia_semana smallint,
  nomina_dia_mes smallint
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_vinculo public.club57_empresa_empleados;
  v_emp public.club57_empresas;
  v_saldo record;
  v_nomina record;
  v_comprometido numeric;
  v_disponible numeric;
  v_empresa_disponible numeric;
begin
  select * into v_vinculo from public.club57_empresa_empleados
  where member_id = auth.uid() and estado = 'activo'
  limit 1;
  if not found then
    return;
  end if;
  select * into v_emp from public.club57_empresas where id = v_vinculo.empresa_id;
  select * into v_saldo from public.club57_saldo_empleado(v_vinculo.id);
  select * into v_nomina from public.club57_nomina_empleado(v_vinculo.id);

  v_comprometido := v_saldo.en_espera + v_saldo.por_descontar;
  v_disponible := greatest(coalesce(v_vinculo.linea_credito, 0) - v_comprometido, 0);
  v_empresa_disponible := greatest(coalesce(v_emp.limite_credito, 0) - public.club57_empresa_comprometido(v_emp.id), 0);

  return query select
    v_vinculo.id, v_emp.id, v_emp.nombre_comercial, v_emp.estado,
    v_vinculo.linea_credito, v_comprometido, v_disponible,
    least(v_disponible, v_empresa_disponible), v_empresa_disponible < v_disponible,
    v_emp.plazo_autorizacion_dias, v_emp.domicilio_entrega,
    v_saldo.en_espera, v_saldo.por_descontar, v_saldo.proximo_fecha, v_saldo.proximo_monto,
    v_nomina.frecuencia, v_nomina.dia_semana, v_nomina.dia_mes;
end;
$$;

revoke all on function public.club57_mi_credito_empresa() from public, anon;
grant execute on function public.club57_mi_credito_empresa() to authenticated;

-- Historial y calendario de descuentos del empleado (vínculo vigente y
-- anteriores).
create or replace function public.club57_mis_descuentos()
returns table (
  id uuid,
  empresa_nombre text,
  order_number text,
  fecha_nomina date,
  numero smallint,
  de_total smallint,
  monto numeric,
  monto_aplicado numeric,
  estado text,
  aplicado_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select d.id, e.nombre_comercial, o.order_number, d.fecha_nomina, d.numero, d.de_total, d.monto, d.monto_aplicado, d.estado, d.aplicado_at
  from public.club57_descuentos_nomina d
  join public.club57_empresa_empleados v on v.id = d.empleado_id
  join public.club57_empresas e on e.id = d.empresa_id
  join public.orders o on o.id = d.order_id
  where v.member_id = auth.uid() and d.estado <> 'cancelado'
  order by d.fecha_nomina desc, o.order_number
  limit 200;
$$;

revoke all on function public.club57_mis_descuentos() from public, anon;
grant execute on function public.club57_mis_descuentos() to authenticated;

-- ---------------------------------------------------------------------
-- 5) Portal Empresa: nóminas y saldos
-- ---------------------------------------------------------------------
-- Saldo de cada empleado activo y, de los dados de baja, el saldo que
-- quedó pendiente al salir (para la lista de empleados).
create or replace function public.club57_portal_saldos()
returns table (
  empleado_id uuid,
  en_espera numeric,
  por_descontar numeric,
  disponible numeric,
  proximo_fecha date,
  proximo_monto numeric,
  saldo_baja numeric
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
  select v.id, s.en_espera, s.por_descontar,
         greatest(coalesce(v.linea_credito, 0) - s.en_espera - s.por_descontar, 0),
         s.proximo_fecha, s.proximo_monto, null::numeric
  from public.club57_empresa_empleados v
  cross join lateral public.club57_saldo_empleado(v.id) s
  where v.empresa_id = v_empresa and v.estado = 'activo'
  union all
  select v.id, 0::numeric, 0::numeric, 0::numeric, null::date, null::numeric, v.saldo_baja
  from public.club57_empresa_empleados v
  where v.empresa_id = v_empresa and v.estado = 'baja' and v.saldo_baja is not null;
end;
$$;

revoke all on function public.club57_portal_saldos() from public, anon;
grant execute on function public.club57_portal_saldos() to authenticated;

-- Descuentos de las nóminas pendientes y de los últimos 6 meses, con el
-- empleado y el pedido. El portal los agrupa por fecha y por empleado.
create or replace function public.club57_portal_descuentos()
returns table (
  id uuid,
  fecha_nomina date,
  nomina_estado text,
  nomina_confirmada_at timestamptz,
  tacita_at timestamptz,
  empleado_id uuid,
  empleado_nombre text,
  empleado_correo text,
  numero_empleado text,
  empleado_estado text,
  order_number text,
  numero smallint,
  de_total smallint,
  monto numeric,
  monto_aplicado numeric,
  estado text
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
  select d.id, d.fecha_nomina, n.estado, n.confirmada_at,
         public.club57_vencimiento_autorizacion((d.fecha_nomina + time '12:00') at time zone 'America/Mexico_City', 3),
         v.id, m.full_name, m.email, v.numero_empleado, v.estado,
         o.order_number, d.numero, d.de_total, d.monto, d.monto_aplicado, d.estado
  from public.club57_descuentos_nomina d
  join public.club57_nominas n on n.empresa_id = d.empresa_id and n.fecha = d.fecha_nomina
  join public.club57_empresa_empleados v on v.id = d.empleado_id
  join public.club57_members m on m.id = v.member_id
  join public.orders o on o.id = d.order_id
  where d.empresa_id = v_empresa
    and d.estado <> 'cancelado'
    and (n.estado = 'pendiente' or d.fecha_nomina >= public.today_in_queretaro() - 186)
  order by d.fecha_nomina, m.full_name, o.order_number;
end;
$$;

revoke all on function public.club57_portal_descuentos() from public, anon;
grant execute on function public.club57_portal_descuentos() to authenticated;

-- Aplica una nómina: cada empleado se descuenta completo salvo que venga en
-- p_excepciones ([{ "empleado_id": uuid, "monto_aplicado": número }],
-- 0 = no se aplicó). Lo que no se descontó se reprograma a su siguiente
-- nómina. Interna.
create or replace function public.club57_aplicar_nomina(p_empresa_id uuid, p_fecha date, p_excepciones jsonb, p_tacita boolean)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nomina public.club57_nominas;
  v_emp record;
  v_d public.club57_descuentos_nomina;
  v_restante numeric;
  v_aplica numeric;
  v_siguiente date;
  v_empleados integer := 0;
  v_exc jsonb;
begin
  select * into v_nomina from public.club57_nominas where empresa_id = p_empresa_id and fecha = p_fecha for update;
  if not found then
    raise exception 'No hay descuentos para esa nómina.';
  end if;
  if v_nomina.estado <> 'pendiente' then
    raise exception 'Esta nómina ya se confirmó.';
  end if;

  for v_emp in
    select d.empleado_id, sum(d.monto) as total
    from public.club57_descuentos_nomina d
    where d.empresa_id = p_empresa_id and d.fecha_nomina = p_fecha and d.estado = 'programado'
    group by d.empleado_id
  loop
    v_empleados := v_empleados + 1;
    v_restante := v_emp.total;
    select x.value into v_exc from jsonb_array_elements(coalesce(p_excepciones, '[]'::jsonb)) as x(value)
    where x.value ->> 'empleado_id' = v_emp.empleado_id::text
    limit 1;
    if v_exc is not null then
      v_restante := round((v_exc ->> 'monto_aplicado')::numeric, 2);
      if v_restante is null or v_restante < 0 or v_restante > v_emp.total then
        raise exception 'El monto aplicado debe estar entre 0 y %.', to_char(v_emp.total, 'FM$999,999,990.00');
      end if;
    end if;

    for v_d in
      select * from public.club57_descuentos_nomina d
      where d.empresa_id = p_empresa_id and d.fecha_nomina = p_fecha and d.estado = 'programado'
        and d.empleado_id = v_emp.empleado_id
      order by d.created_at, d.numero
      for update
    loop
      v_aplica := least(v_restante, v_d.monto);
      v_restante := v_restante - v_aplica;
      update public.club57_descuentos_nomina
      set estado = case when v_aplica > 0 then 'aplicado' else 'no_aplicado' end,
          monto_aplicado = v_aplica,
          aplicado_at = now()
      where id = v_d.id;

      if v_aplica < v_d.monto then
        v_siguiente := public.club57_siguiente_nomina_empleado(v_d.empleado_id, p_fecha);
        insert into public.club57_descuentos_nomina (empresa_id, empleado_id, order_id, fecha_nomina, numero, de_total, monto, reprogramado_de)
        values (v_d.empresa_id, v_d.empleado_id, v_d.order_id, v_siguiente, v_d.numero, v_d.de_total, v_d.monto - v_aplica, v_d.id);
      end if;
    end loop;
  end loop;

  update public.club57_nominas
  set estado = case when p_tacita then 'tacita' else 'confirmada' end,
      confirmada_at = now(),
      confirmada_por = case when p_tacita then null else auth.uid() end
  where id = v_nomina.id;
  return v_empleados;
end;
$$;

revoke all on function public.club57_aplicar_nomina(uuid, date, jsonb, boolean) from public, anon, authenticated;

-- El responsable confirma una nómina (ya llegada su fecha).
create or replace function public.club57_portal_confirmar_nomina(p_fecha date, p_excepciones jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid := public.club57_requiere_responsable();
begin
  if p_fecha > public.today_in_queretaro() then
    raise exception 'Esta nómina todavía no llega a su fecha de pago.';
  end if;
  return public.club57_aplicar_nomina(v_empresa, p_fecha, p_excepciones, false);
end;
$$;

revoke all on function public.club57_portal_confirmar_nomina(date, jsonb) from public, anon;
grant execute on function public.club57_portal_confirmar_nomina(date, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 6) Tarea diaria (solo servidor)
-- ---------------------------------------------------------------------
-- Nóminas sin confirmar 3 días hábiles después de su fecha: se aplican
-- completas. Regresa cuántas.
create or replace function public.club57_confirmar_nominas_tacitas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n public.club57_nominas;
  v_total integer := 0;
begin
  for v_n in
    select * from public.club57_nominas n
    where n.estado = 'pendiente'
      and public.club57_vencimiento_autorizacion((n.fecha + time '12:00') at time zone 'America/Mexico_City', 3) <= now()
  loop
    perform public.club57_aplicar_nomina(v_n.empresa_id, v_n.fecha, '[]'::jsonb, true);
    v_total := v_total + 1;
  end loop;
  return v_total;
end;
$$;

revoke all on function public.club57_confirmar_nominas_tacitas() from public, anon, authenticated;
grant execute on function public.club57_confirmar_nominas_tacitas() to service_role;

-- Nóminas con descuentos que llegan en los próximos 3 días y todavía no se
-- avisaron a la empresa. Las marca como avisadas.
create or replace function public.club57_nominas_por_avisar()
returns table (empresa_id uuid, fecha date, empleados integer, total numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with marcadas as (
    update public.club57_nominas n
    set avisado_at = now()
    where n.estado = 'pendiente'
      and n.avisado_at is null
      and n.fecha <= public.today_in_queretaro() + 3
      and exists (
        select 1 from public.club57_descuentos_nomina d
        where d.empresa_id = n.empresa_id and d.fecha_nomina = n.fecha and d.estado = 'programado'
      )
    returning n.empresa_id, n.fecha
  )
  select m.empresa_id, m.fecha, count(distinct d.empleado_id)::integer, sum(d.monto)
  from marcadas m
  join public.club57_descuentos_nomina d
    on d.empresa_id = m.empresa_id and d.fecha_nomina = m.fecha and d.estado = 'programado'
  group by m.empresa_id, m.fecha;
end;
$$;

revoke all on function public.club57_nominas_por_avisar() from public, anon, authenticated;
grant execute on function public.club57_nominas_por_avisar() to service_role;

-- ---------------------------------------------------------------------
-- 7) Baja del empleado: saldo pendiente al momento de la baja
-- ---------------------------------------------------------------------
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
  v_order uuid;
  v_saldo numeric;
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

  -- Sus pedidos en espera se cancelan (Etapa 3).
  for v_order in
    select o.id from public.orders o
    where o.empresa_empleado_id = p_empleado_id and o.status = 'pendiente_autorizacion'
  loop
    perform public.club57_cancelar_pedido_empresa_int(v_order, 'baja_empleado', 'Ya no participas en el programa de tu empresa');
  end loop;

  -- Lo que falta por descontar de sus pedidos autorizados queda registrado.
  select por_descontar into v_saldo from public.club57_saldo_empleado(p_empleado_id);
  update public.club57_descuentos_nomina set estado = 'baja'
  where empleado_id = p_empleado_id and estado = 'programado';

  update public.club57_empresa_empleados
  set estado = v_nuevo, motivo = left(v_motivo, 500), resuelto_at = now(), resuelto_por = auth.uid(),
      saldo_baja = case when v_nuevo = 'baja' and coalesce(v_saldo, 0) > 0 then v_saldo else null end
  where id = p_empleado_id;
  delete from public.club57_empleado_salarios where empleado_id = p_empleado_id;
  return v_nuevo;
end;
$$;

revoke all on function public.club57_portal_cerrar_empleado(uuid, text) from public, anon;
grant execute on function public.club57_portal_cerrar_empleado(uuid, text) to authenticated;
