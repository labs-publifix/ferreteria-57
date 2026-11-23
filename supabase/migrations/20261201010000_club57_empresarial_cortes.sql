-- Club 57 Empresarial · Etapa 5: corte mensual con Ferretería 57.
--
-- Cada empresa tiene ciclos (cortes) según su día de corte:
--   abierto → revision (al pasar el día de corte; estado de cuenta listo)
--           → conciliado (conformidad de la empresa, o tácita a los 3 días
--             hábiles sin observaciones abiertas)
--           → facturado (Ferretería 57 registra la factura que emite por
--             sus medios; corre el plazo de pago)
--           → pagado (Ferretería 57 registra el pago: se libera el crédito
--             de la empresa y los puntos Club 57 del ciclo)
--   facturado → vencido (pasa el plazo sin pago: la empresa se suspende sola
--             y se reactiva al registrar el pago).
--
-- Un pedido entra al ciclo abierto cuando la empresa lo autoriza y en ese
-- momento genera sus puntos Club 57 en «pendiente». Si se cancela antes de
-- facturar, sale del estado de cuenta; si se cancela después, queda como
-- saldo a favor de la empresa en su ciclo abierto.
--
-- Idempotente: se puede correr más de una vez.

alter table public.club57_empresas add column if not exists suspendida_por_pago boolean not null default false;

alter table public.club57_empresas_bitacora drop constraint if exists club57_empresas_bitacora_accion_check;
alter table public.club57_empresas_bitacora add constraint club57_empresas_bitacora_accion_check
  check (accion in (
    'solicitud', 'alta', 'aprobada', 'rechazada', 'suspendida', 'reactivada', 'baja',
    'datos', 'convenio', 'codigo', 'responsable', 'nomina', 'corte'
  ));

-- ---------------------------------------------------------------------
-- 1) Tablas
-- ---------------------------------------------------------------------
create table if not exists public.club57_ciclos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.club57_empresas (id) on delete cascade,
  periodo_inicio date not null,
  periodo_fin date not null,
  estado text not null default 'abierto'
    check (estado in ('abierto', 'revision', 'conciliado', 'facturado', 'pagado', 'vencido')),
  cerrado_at timestamptz,
  revision_vence_at timestamptz,
  conformidad_at timestamptz,
  conformidad_por uuid references auth.users (id) on delete set null,
  conformidad_tacita boolean not null default false,
  factura_folio text check (factura_folio is null or length(btrim(factura_folio)) between 1 and 60),
  factura_fecha date,
  factura_monto numeric(12, 2) check (factura_monto is null or factura_monto >= 0),
  factura_pdf_path text,
  factura_xml_path text,
  factura_registrada_at timestamptz,
  factura_por uuid references auth.users (id) on delete set null,
  pago_vence date,
  pago_fecha date,
  pago_monto numeric(12, 2) check (pago_monto is null or pago_monto >= 0),
  pago_referencia text check (pago_referencia is null or length(pago_referencia) <= 120),
  pagado_at timestamptz,
  pago_por uuid references auth.users (id) on delete set null,
  nota text check (nota is null or length(nota) <= 300),
  created_at timestamptz not null default now(),
  unique (empresa_id, periodo_fin),
  constraint club57_ciclos_periodo check (periodo_inicio <= periodo_fin)
);

create index if not exists club57_ciclos_estado_idx on public.club57_ciclos (estado, periodo_fin);

alter table public.orders add column if not exists ciclo_id uuid references public.club57_ciclos (id) on delete set null;
alter table public.orders add column if not exists empresa_cancelado_at timestamptz;
create index if not exists orders_ciclo_idx on public.orders (ciclo_id) where ciclo_id is not null;

create table if not exists public.club57_ciclo_ajustes (
  id uuid primary key default gen_random_uuid(),
  ciclo_id uuid not null references public.club57_ciclos (id) on delete cascade,
  empresa_id uuid not null references public.club57_empresas (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  monto numeric(12, 2) not null check (monto <> 0),
  concepto text not null check (length(concepto) between 1 and 200),
  created_at timestamptz not null default now()
);

create index if not exists club57_ciclo_ajustes_ciclo_idx on public.club57_ciclo_ajustes (ciclo_id);

create table if not exists public.club57_ciclo_observaciones (
  id uuid primary key default gen_random_uuid(),
  ciclo_id uuid not null references public.club57_ciclos (id) on delete cascade,
  empresa_id uuid not null references public.club57_empresas (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  comentario text not null check (length(btrim(comentario)) between 3 and 500),
  estado text not null default 'abierta' check (estado in ('abierta', 'resuelta')),
  respuesta text check (respuesta is null or length(respuesta) <= 500),
  creada_por uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  resuelta_at timestamptz,
  resuelta_por uuid references auth.users (id) on delete set null
);

create index if not exists club57_ciclo_observaciones_ciclo_idx on public.club57_ciclo_observaciones (ciclo_id, estado);

alter table public.club57_ciclos enable row level security;
alter table public.club57_ciclo_ajustes enable row level security;
alter table public.club57_ciclo_observaciones enable row level security;

drop policy if exists "Staff y empresa ven sus cortes" on public.club57_ciclos;
create policy "Staff y empresa ven sus cortes"
  on public.club57_ciclos for select
  using (public.is_admin() or empresa_id = public.club57_mi_empresa_responsable());

drop policy if exists "Staff y empresa ven los ajustes" on public.club57_ciclo_ajustes;
create policy "Staff y empresa ven los ajustes"
  on public.club57_ciclo_ajustes for select
  using (public.is_admin() or empresa_id = public.club57_mi_empresa_responsable());

drop policy if exists "Staff y empresa ven las observaciones" on public.club57_ciclo_observaciones;
create policy "Staff y empresa ven las observaciones"
  on public.club57_ciclo_observaciones for select
  using (public.is_admin() or empresa_id = public.club57_mi_empresa_responsable());

-- Facturas (PDF y XML): bucket privado, solo el servidor lo lee y escribe
-- (descargas con enlace firmado después de validar el permiso).
insert into storage.buckets (id, name, public)
values ('club57-facturas', 'club57-facturas', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2) Calendario de cortes
-- ---------------------------------------------------------------------
-- Día de corte vigente para una fecha: el primero en o después de p_fecha
-- (0 = último día del mes).
create or replace function public.club57_corte_de(p_dia_corte smallint, p_fecha date)
returns date
language sql
immutable
as $$
  select case
    when coalesce(p_dia_corte, 0) = 0 then (date_trunc('month', p_fecha) + interval '1 month - 1 day')::date
    when extract(day from p_fecha) <= p_dia_corte then (date_trunc('month', p_fecha) + (p_dia_corte - 1) * interval '1 day')::date
    else (date_trunc('month', p_fecha) + interval '1 month' + (p_dia_corte - 1) * interval '1 day')::date
  end;
$$;

-- Ciclo abierto de una empresa para una fecha (lo crea si no existe). Si el
-- de esa fecha ya se cerró (cierre anticipado), usa el siguiente.
create or replace function public.club57_ciclo_para(p_empresa_id uuid, p_fecha date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia smallint;
  v_fin date;
  v_inicio date;
  v_ciclo public.club57_ciclos;
  v_vueltas integer := 0;
begin
  select dia_corte into v_dia from public.club57_empresas where id = p_empresa_id;
  v_fin := public.club57_corte_de(v_dia, p_fecha);
  loop
    select * into v_ciclo from public.club57_ciclos where empresa_id = p_empresa_id and periodo_fin = v_fin;
    if not found then
      v_inicio := greatest(
        public.club57_corte_de(v_dia, (v_fin - interval '1 month')::date) + 1,
        coalesce((select max(c.periodo_fin) + 1 from public.club57_ciclos c where c.empresa_id = p_empresa_id and c.periodo_fin < v_fin), '1900-01-01'::date)
      );
      insert into public.club57_ciclos (empresa_id, periodo_inicio, periodo_fin)
      values (p_empresa_id, least(v_inicio, v_fin), v_fin)
      on conflict (empresa_id, periodo_fin) do nothing;
      select * into v_ciclo from public.club57_ciclos where empresa_id = p_empresa_id and periodo_fin = v_fin;
    end if;
    if v_ciclo.estado = 'abierto' then
      return v_ciclo.id;
    end if;
    v_vueltas := v_vueltas + 1;
    if v_vueltas > 24 then
      raise exception 'No se encontró un corte abierto para la empresa.';
    end if;
    v_fin := public.club57_corte_de(v_dia, v_fin + 1);
  end loop;
end;
$$;

revoke all on function public.club57_ciclo_para(uuid, date) from public, anon, authenticated;

-- ¿El pedido cuenta en el estado de cuenta de su ciclo? Los no cancelados,
-- y los cancelados después de registrar la factura (el estado de cuenta ya
-- facturado no cambia; el saldo a favor va al siguiente ciclo).
create or replace function public.club57_pedido_en_ciclo(p_status text, p_cancelado_at timestamptz, p_factura_at timestamptz)
returns boolean
language sql
immutable
as $$
  select p_status <> 'cancelado' or (p_factura_at is not null and p_cancelado_at is not null and p_cancelado_at >= p_factura_at);
$$;

-- Total del estado de cuenta: pedidos que cuentan + ajustes (saldo a favor).
create or replace function public.club57_ciclo_total(p_ciclo_id uuid)
returns numeric
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select sum(o.total) from public.orders o
    join public.club57_ciclos c on c.id = o.ciclo_id
    where o.ciclo_id = p_ciclo_id and public.club57_pedido_en_ciclo(o.status, o.empresa_cancelado_at, c.factura_registrada_at)
  ), 0) + coalesce((select sum(a.monto) from public.club57_ciclo_ajustes a where a.ciclo_id = p_ciclo_id), 0);
$$;

revoke all on function public.club57_ciclo_total(uuid) from public, anon, authenticated;

-- Crédito de la empresa con Ferretería 57: se libera cuando paga su corte.
-- Reemplaza la definición de la Etapa 3.
create or replace function public.club57_empresa_comprometido(p_empresa_id uuid)
returns numeric
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select sum(o.total) from public.orders o
    left join public.club57_ciclos c on c.id = o.ciclo_id
    where o.empresa_id = p_empresa_id and o.metodo_pago = 'empresa' and o.status <> 'cancelado'
      and (c.id is null or c.estado <> 'pagado')
  ), 0) + coalesce((
    select sum(a.monto) from public.club57_ciclo_ajustes a
    join public.club57_ciclos c on c.id = a.ciclo_id
    where a.empresa_id = p_empresa_id and c.estado <> 'pagado'
  ), 0);
$$;

revoke all on function public.club57_empresa_comprometido(uuid) from public, anon, authenticated;

-- Para el portal y el panel: límite, comprometido y disponible.
create or replace function public.club57_empresa_credito(p_empresa_id uuid)
returns table (limite numeric, comprometido numeric, disponible numeric)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_limite numeric;
  v_comprometido numeric;
begin
  if not (public.is_admin() or coalesce(p_empresa_id = public.club57_mi_empresa_responsable(), false)) then
    raise exception 'No autorizado.';
  end if;
  select limite_credito into v_limite from public.club57_empresas where id = p_empresa_id;
  v_comprometido := public.club57_empresa_comprometido(p_empresa_id);
  return query select v_limite, v_comprometido, greatest(coalesce(v_limite, 0) - v_comprometido, 0);
end;
$$;

revoke all on function public.club57_empresa_credito(uuid) from public, anon;
grant execute on function public.club57_empresa_credito(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3) Al autorizar: ciclo y puntos pendientes. Al cancelar: saldo a favor.
-- ---------------------------------------------------------------------
create or replace function public.club57_pedido_empresa_ciclo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.metodo_pago = 'empresa' and old.status = 'pendiente_autorizacion' and new.status = 'pagado'
     and new.ciclo_id is null and new.empresa_id is not null then
    new.ciclo_id := public.club57_ciclo_para(
      new.empresa_id, (coalesce(new.autorizado_at, now()) at time zone 'America/Mexico_City')::date
    );
  end if;
  -- Cuándo se canceló (el estado de cuenta ya facturado lo sigue mostrando).
  if new.metodo_pago = 'empresa' and new.status = 'cancelado' and old.status is distinct from 'cancelado' then
    new.empresa_cancelado_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists club57_orders_ciclo on public.orders;
create trigger club57_orders_ciclo
  before update of status on public.orders
  for each row execute function public.club57_pedido_empresa_ciclo();

create or replace function public.club57_pedido_empresa_puntos_y_ajustes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member uuid;
  v_monto numeric;
  v_puntos integer;
  v_ciclo public.club57_ciclos;
begin
  if new.metodo_pago <> 'empresa' then
    return new;
  end if;

  -- Puntos Club 57 en «pendiente» (se liberan cuando la empresa paga el corte).
  if old.status = 'pendiente_autorizacion' and new.status = 'pagado' then
    begin
      select v.member_id into v_member from public.club57_empresa_empleados v where v.id = new.empresa_empleado_id;
      select monto_por_punto into v_monto from public.club57_config limit 1;
      v_puntos := floor(new.subtotal / nullif(v_monto, 0));
      if v_member is not null and coalesce(v_puntos, 0) > 0
         and not exists (select 1 from public.club57_points_ledger where tipo = 'compra_online' and referencia = new.id::text) then
        insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, fecha_disponible, referencia)
        values (v_member, v_puntos, 'compra_online', 'pendiente', null, new.id::text);
      end if;
    exception when others then
      raise warning 'Club 57: no se pudieron generar puntos del pedido %: %', new.id, sqlerrm;
    end;
  end if;

  -- Cancelado después de facturarse: saldo a favor en el ciclo abierto.
  if new.status = 'cancelado' and old.status is distinct from 'cancelado' and new.ciclo_id is not null then
    select * into v_ciclo from public.club57_ciclos where id = new.ciclo_id;
    if v_ciclo.estado in ('facturado', 'pagado', 'vencido') then
      insert into public.club57_ciclo_ajustes (ciclo_id, empresa_id, order_id, monto, concepto)
      values (
        public.club57_ciclo_para(new.empresa_id, public.today_in_queretaro()),
        new.empresa_id, new.id, -new.total,
        'Saldo a favor: pedido ' || new.order_number || ' cancelado después del corte del ' || to_char(v_ciclo.periodo_fin, 'DD/MM/YYYY')
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists club57_orders_puntos_ajustes on public.orders;
create trigger club57_orders_puntos_ajustes
  after update of status on public.orders
  for each row execute function public.club57_pedido_empresa_puntos_y_ajustes();

-- Pedidos autorizados antes de esta etapa: entran al ciclo de su fecha de
-- autorización y generan sus puntos pendientes.
do $$
declare
  v_o record;
  v_member uuid;
  v_monto numeric;
  v_puntos integer;
begin
  select monto_por_punto into v_monto from public.club57_config limit 1;
  for v_o in
    select * from public.orders o
    where o.metodo_pago = 'empresa' and o.ciclo_id is null and o.empresa_id is not null
      and o.status not in ('cancelado', 'pendiente_autorizacion')
  loop
    update public.orders
    set ciclo_id = public.club57_ciclo_para(v_o.empresa_id, (coalesce(v_o.autorizado_at, v_o.created_at) at time zone 'America/Mexico_City')::date)
    where id = v_o.id;
    select member_id into v_member from public.club57_empresa_empleados where id = v_o.empresa_empleado_id;
    v_puntos := floor(v_o.subtotal / nullif(v_monto, 0));
    if v_member is not null and coalesce(v_puntos, 0) > 0
       and not exists (select 1 from public.club57_points_ledger where tipo = 'compra_online' and referencia = v_o.id::text) then
      insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, fecha_disponible, referencia)
      values (v_member, v_puntos, 'compra_online', 'pendiente', null, v_o.id::text);
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Cierre, conciliación y vencimiento
-- ---------------------------------------------------------------------
-- Cierra un ciclo: queda en revisión con 3 días hábiles para observar. Sin
-- cargos se da por pagado; con saldo a favor neto, el saldo pasa al
-- siguiente ciclo. Interna.
create or replace function public.club57_cerrar_ciclo_int(p_ciclo_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c public.club57_ciclos;
  v_total numeric;
  v_siguiente uuid;
begin
  select * into v_c from public.club57_ciclos where id = p_ciclo_id for update;
  if not found or v_c.estado <> 'abierto' then
    return null;
  end if;
  v_total := public.club57_ciclo_total(p_ciclo_id);

  if v_total <= 0 then
    update public.club57_ciclos
    set estado = 'pagado', cerrado_at = now(), pagado_at = now(),
        nota = case when v_total < 0 then 'Saldo a favor trasladado al siguiente corte' else 'Sin cargos en el periodo' end
    where id = p_ciclo_id;
    if v_total < 0 then
      v_siguiente := public.club57_ciclo_para(v_c.empresa_id, v_c.periodo_fin + 1);
      insert into public.club57_ciclo_ajustes (ciclo_id, empresa_id, monto, concepto)
      values (v_siguiente, v_c.empresa_id, v_total, 'Saldo a favor del corte del ' || to_char(v_c.periodo_fin, 'DD/MM/YYYY'));
    end if;
    return 'pagado';
  end if;

  update public.club57_ciclos
  set estado = 'revision', cerrado_at = now(),
      revision_vence_at = public.club57_vencimiento_autorizacion(now(), 3)
  where id = p_ciclo_id;
  insert into public.club57_empresas_bitacora (empresa_id, accion, detalle, actor_id)
  values (v_c.empresa_id, 'corte', 'Corte del ' || to_char(v_c.periodo_fin, 'DD/MM/YYYY') || ' cerrado: ' || to_char(v_total, 'FM$999,999,990.00'), auth.uid());
  return 'revision';
end;
$$;

revoke all on function public.club57_cerrar_ciclo_int(uuid) from public, anon, authenticated;

-- Tarea diaria: cierra los ciclos cuyo día de corte ya pasó. Regresa los
-- que quedaron en revisión (para avisar).
create or replace function public.club57_cerrar_ciclos()
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  for v_id in
    select c.id from public.club57_ciclos c
    where c.estado = 'abierto' and c.periodo_fin < public.today_in_queretaro()
    order by c.periodo_fin
  loop
    if public.club57_cerrar_ciclo_int(v_id) = 'revision' then
      return next v_id;
    end if;
  end loop;
end;
$$;

revoke all on function public.club57_cerrar_ciclos() from public, anon, authenticated;
grant execute on function public.club57_cerrar_ciclos() to service_role;

-- Conformidad tácita: revisión vencida sin observaciones abiertas.
create or replace function public.club57_conciliar_ciclos_tacitos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n integer;
begin
  update public.club57_ciclos c
  set estado = 'conciliado', conformidad_at = now(), conformidad_tacita = true
  where c.estado = 'revision' and c.revision_vence_at <= now()
    and not exists (select 1 from public.club57_ciclo_observaciones o where o.ciclo_id = c.id and o.estado = 'abierta');
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.club57_conciliar_ciclos_tacitos() from public, anon, authenticated;
grant execute on function public.club57_conciliar_ciclos_tacitos() to service_role;

-- Pagos vencidos: el ciclo pasa a vencido y la empresa se suspende sola.
create or replace function public.club57_vencer_ciclos()
returns table (ciclo_id uuid, empresa_id uuid, suspendida boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c public.club57_ciclos;
  v_suspendida boolean;
begin
  for v_c in
    select * from public.club57_ciclos c
    where c.estado = 'facturado' and c.pago_vence < public.today_in_queretaro()
    for update
  loop
    update public.club57_ciclos set estado = 'vencido' where id = v_c.id;
    update public.club57_empresas
    set estado = 'suspendida', suspendida_por_pago = true,
        motivo_estado = 'Pago vencido del corte del ' || to_char(v_c.periodo_fin, 'DD/MM/YYYY')
    where id = v_c.empresa_id and estado = 'activa';
    v_suspendida := found;
    if v_suspendida then
      insert into public.club57_empresas_bitacora (empresa_id, accion, detalle, actor_id)
      values (v_c.empresa_id, 'suspendida', 'Automática: pago vencido del corte del ' || to_char(v_c.periodo_fin, 'DD/MM/YYYY'), null);
    end if;
    ciclo_id := v_c.id;
    empresa_id := v_c.empresa_id;
    suspendida := v_suspendida;
    return next;
  end loop;
end;
$$;

revoke all on function public.club57_vencer_ciclos() from public, anon, authenticated;
grant execute on function public.club57_vencer_ciclos() to service_role;

-- ---------------------------------------------------------------------
-- 5) Portal Empresa: estados de cuenta
-- ---------------------------------------------------------------------
create or replace function public.club57_portal_ciclos()
returns table (
  id uuid,
  periodo_inicio date,
  periodo_fin date,
  estado text,
  total numeric,
  pedidos integer,
  observaciones_abiertas integer,
  revision_vence_at timestamptz,
  conformidad_at timestamptz,
  conformidad_tacita boolean,
  factura_folio text,
  factura_fecha date,
  factura_monto numeric,
  tiene_pdf boolean,
  tiene_xml boolean,
  pago_vence date,
  pago_fecha date,
  pago_monto numeric,
  pago_referencia text,
  nota text
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
  select c.id, c.periodo_inicio, c.periodo_fin, c.estado, public.club57_ciclo_total(c.id),
         (select count(*)::integer from public.orders o where o.ciclo_id = c.id and public.club57_pedido_en_ciclo(o.status, o.empresa_cancelado_at, c.factura_registrada_at)),
         (select count(*)::integer from public.club57_ciclo_observaciones ob where ob.ciclo_id = c.id and ob.estado = 'abierta'),
         c.revision_vence_at, c.conformidad_at, c.conformidad_tacita,
         c.factura_folio, c.factura_fecha, c.factura_monto, c.factura_pdf_path is not null, c.factura_xml_path is not null,
         c.pago_vence, c.pago_fecha, c.pago_monto, c.pago_referencia, c.nota
  from public.club57_ciclos c
  where c.empresa_id = v_empresa
  order by c.periodo_fin desc
  limit 36;
end;
$$;

revoke all on function public.club57_portal_ciclos() from public, anon;
grant execute on function public.club57_portal_ciclos() to authenticated;

-- Detalle de un ciclo para el estado de cuenta (PDF y Excel): pedidos con
-- empleado y productos, más los ajustes. Para el responsable o el staff.
create or replace function public.club57_ciclo_detalle(p_ciclo_id uuid)
returns table (
  tipo text,
  order_id uuid,
  order_number text,
  fecha timestamptz,
  empleado_id uuid,
  empleado_nombre text,
  numero_empleado text,
  status text,
  subtotal numeric,
  shipping_cost numeric,
  total numeric,
  items jsonb,
  concepto text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_empresa uuid;
begin
  select c.empresa_id into v_empresa from public.club57_ciclos c where c.id = p_ciclo_id;
  if v_empresa is null or not (public.is_admin() or coalesce(v_empresa = public.club57_mi_empresa_responsable(), false)) then
    raise exception 'No autorizado.';
  end if;
  return query
  select 'pedido'::text, o.id, o.order_number, coalesce(o.autorizado_at, o.created_at),
         v.id, coalesce(m.full_name, o.customer_name), v.numero_empleado, o.status,
         o.subtotal, o.shipping_cost, o.total,
         coalesce((
           select jsonb_agg(jsonb_build_object(
             'product_name', oi.product_name, 'variant_label', oi.variant_label, 'sku', oi.sku,
             'quantity', oi.quantity, 'unit_price', oi.unit_price
           ) order by oi.product_name)
           from public.order_items oi where oi.order_id = o.id
         ), '[]'::jsonb),
         null::text
  from public.orders o
  join public.club57_ciclos c on c.id = o.ciclo_id
  left join public.club57_empresa_empleados v on v.id = o.empresa_empleado_id
  left join public.club57_members m on m.id = v.member_id
  where o.ciclo_id = p_ciclo_id and public.club57_pedido_en_ciclo(o.status, o.empresa_cancelado_at, c.factura_registrada_at)
  union all
  select 'ajuste'::text, a.order_id, null::text, a.created_at, null::uuid, null::text, null::text, null::text,
         null::numeric, null::numeric, a.monto, '[]'::jsonb, a.concepto
  from public.club57_ciclo_ajustes a
  where a.ciclo_id = p_ciclo_id
  order by 1 desc, 6, 4;
end;
$$;

revoke all on function public.club57_ciclo_detalle(uuid) from public, anon;
grant execute on function public.club57_ciclo_detalle(uuid) to authenticated;

create or replace function public.club57_portal_conformidad_ciclo(p_ciclo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid := public.club57_requiere_responsable();
begin
  perform 1 from public.club57_ciclos where id = p_ciclo_id and empresa_id = v_empresa and estado = 'revision' for update;
  if not found then
    raise exception 'Este estado de cuenta ya no está en revisión.';
  end if;
  if exists (select 1 from public.club57_ciclo_observaciones where ciclo_id = p_ciclo_id and estado = 'abierta') then
    raise exception 'Tienes observaciones sin resolver. Ferretería 57 las revisará antes de que des tu conformidad.';
  end if;
  update public.club57_ciclos
  set estado = 'conciliado', conformidad_at = now(), conformidad_por = auth.uid(), conformidad_tacita = false
  where id = p_ciclo_id;
end;
$$;

revoke all on function public.club57_portal_conformidad_ciclo(uuid) from public, anon;
grant execute on function public.club57_portal_conformidad_ciclo(uuid) to authenticated;

create or replace function public.club57_portal_observar_pedido(p_ciclo_id uuid, p_order_id uuid, p_comentario text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid := public.club57_requiere_responsable();
  v_id uuid;
begin
  perform 1 from public.club57_ciclos where id = p_ciclo_id and empresa_id = v_empresa and estado = 'revision';
  if not found then
    raise exception 'Solo puedes observar pedidos de un estado de cuenta en revisión.';
  end if;
  perform 1 from public.orders where id = p_order_id and ciclo_id = p_ciclo_id;
  if not found then
    raise exception 'Ese pedido no está en este estado de cuenta.';
  end if;
  if length(btrim(coalesce(p_comentario, ''))) < 3 then
    raise exception 'Escribe qué hay que revisar.';
  end if;
  insert into public.club57_ciclo_observaciones (ciclo_id, empresa_id, order_id, comentario, creada_por)
  values (p_ciclo_id, v_empresa, p_order_id, left(btrim(p_comentario), 500), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.club57_portal_observar_pedido(uuid, uuid, text) from public, anon;
grant execute on function public.club57_portal_observar_pedido(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 6) Panel de Ferretería 57
-- ---------------------------------------------------------------------
create or replace function public.club57_admin_ciclos(p_empresa_id uuid default null)
returns table (
  id uuid,
  empresa_id uuid,
  empresa_nombre text,
  periodo_inicio date,
  periodo_fin date,
  estado text,
  total numeric,
  pedidos integer,
  observaciones_abiertas integer,
  revision_vence_at timestamptz,
  conformidad_at timestamptz,
  conformidad_tacita boolean,
  factura_folio text,
  factura_fecha date,
  factura_monto numeric,
  tiene_pdf boolean,
  tiene_xml boolean,
  pago_vence date,
  pago_fecha date,
  pago_monto numeric,
  pago_referencia text,
  nota text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;
  return query
  select c.id, c.empresa_id, e.nombre_comercial, c.periodo_inicio, c.periodo_fin, c.estado, public.club57_ciclo_total(c.id),
         (select count(*)::integer from public.orders o where o.ciclo_id = c.id and public.club57_pedido_en_ciclo(o.status, o.empresa_cancelado_at, c.factura_registrada_at)),
         (select count(*)::integer from public.club57_ciclo_observaciones ob where ob.ciclo_id = c.id and ob.estado = 'abierta'),
         c.revision_vence_at, c.conformidad_at, c.conformidad_tacita,
         c.factura_folio, c.factura_fecha, c.factura_monto, c.factura_pdf_path is not null, c.factura_xml_path is not null,
         c.pago_vence, c.pago_fecha, c.pago_monto, c.pago_referencia, c.nota
  from public.club57_ciclos c
  join public.club57_empresas e on e.id = c.empresa_id
  where p_empresa_id is null or c.empresa_id = p_empresa_id
  order by c.periodo_fin desc, e.nombre_comercial
  limit 500;
end;
$$;

revoke all on function public.club57_admin_ciclos(uuid) from public, anon;
grant execute on function public.club57_admin_ciclos(uuid) to authenticated;

create or replace function public.club57_admin_cerrar_ciclo(p_ciclo_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resultado text;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;
  v_resultado := public.club57_cerrar_ciclo_int(p_ciclo_id);
  if v_resultado is null then
    raise exception 'Este corte ya estaba cerrado.';
  end if;
  return v_resultado;
end;
$$;

revoke all on function public.club57_admin_cerrar_ciclo(uuid) from public, anon;
grant execute on function public.club57_admin_cerrar_ciclo(uuid) to authenticated;

create or replace function public.club57_admin_resolver_observacion(p_observacion_id uuid, p_respuesta text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;
  if length(btrim(coalesce(p_respuesta, ''))) < 3 then
    raise exception 'Escribe la respuesta para la empresa.';
  end if;
  update public.club57_ciclo_observaciones
  set estado = 'resuelta', respuesta = left(btrim(p_respuesta), 500), resuelta_at = now(), resuelta_por = auth.uid()
  where id = p_observacion_id and estado = 'abierta';
  if not found then
    raise exception 'Esta observación ya estaba resuelta.';
  end if;
end;
$$;

revoke all on function public.club57_admin_resolver_observacion(uuid, text) from public, anon;
grant execute on function public.club57_admin_resolver_observacion(uuid, text) to authenticated;

-- Registrar (o corregir) la factura de un corte conciliado.
create or replace function public.club57_admin_registrar_factura(
  p_ciclo_id uuid,
  p_folio text,
  p_fecha date,
  p_monto numeric,
  p_pdf_path text,
  p_xml_path text
)
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c public.club57_ciclos;
  v_plazo smallint;
  v_vence date;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;
  select * into v_c from public.club57_ciclos where id = p_ciclo_id for update;
  if not found then
    raise exception 'Corte no encontrado.';
  end if;
  if v_c.estado not in ('conciliado', 'facturado') then
    raise exception 'Solo se factura un corte conciliado (con la conformidad de la empresa o tácita).';
  end if;
  if length(btrim(coalesce(p_folio, ''))) = 0 or p_fecha is null or p_monto is null or p_monto < 0 then
    raise exception 'Captura folio, fecha y monto de la factura.';
  end if;
  select plazo_pago_dias into v_plazo from public.club57_empresas where id = v_c.empresa_id;
  v_vence := p_fecha + coalesce(v_plazo, 0);
  update public.club57_ciclos
  set estado = 'facturado', factura_folio = btrim(p_folio), factura_fecha = p_fecha, factura_monto = round(p_monto, 2),
      factura_pdf_path = coalesce(p_pdf_path, factura_pdf_path), factura_xml_path = coalesce(p_xml_path, factura_xml_path),
      factura_registrada_at = now(), factura_por = auth.uid(), pago_vence = v_vence
  where id = p_ciclo_id;
  insert into public.club57_empresas_bitacora (empresa_id, accion, detalle, actor_id)
  values (v_c.empresa_id, 'corte', 'Factura ' || btrim(p_folio) || ' registrada para el corte del ' || to_char(v_c.periodo_fin, 'DD/MM/YYYY'), auth.uid());
  return v_vence;
end;
$$;

revoke all on function public.club57_admin_registrar_factura(uuid, text, date, numeric, text, text) from public, anon;
grant execute on function public.club57_admin_registrar_factura(uuid, text, date, numeric, text, text) to authenticated;

-- Registrar el pago: libera el crédito y los puntos del ciclo, y reactiva a
-- la empresa si estaba suspendida por este (u otro) pago vencido y ya no
-- debe nada vencido. Regresa true si se reactivó.
create or replace function public.club57_admin_registrar_pago(
  p_ciclo_id uuid,
  p_fecha date,
  p_monto numeric,
  p_referencia text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c public.club57_ciclos;
  v_reactivada boolean := false;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;
  select * into v_c from public.club57_ciclos where id = p_ciclo_id for update;
  if not found then
    raise exception 'Corte no encontrado.';
  end if;
  if v_c.estado not in ('facturado', 'vencido') then
    raise exception 'Registra primero la factura de este corte.';
  end if;
  if p_fecha is null or p_monto is null or p_monto <= 0 then
    raise exception 'Captura la fecha y el monto del pago.';
  end if;

  update public.club57_ciclos
  set estado = 'pagado', pago_fecha = p_fecha, pago_monto = round(p_monto, 2),
      pago_referencia = nullif(btrim(coalesce(p_referencia, '')), ''), pagado_at = now(), pago_por = auth.uid()
  where id = p_ciclo_id;

  -- Puntos Club 57 de los pedidos del ciclo: quedan disponibles.
  update public.club57_points_ledger l
  set estado = 'disponible', fecha_disponible = public.today_in_queretaro()
  from public.orders o
  where o.ciclo_id = p_ciclo_id and o.status <> 'cancelado'
    and l.tipo = 'compra_online' and l.referencia = o.id::text and l.estado = 'pendiente';

  insert into public.club57_empresas_bitacora (empresa_id, accion, detalle, actor_id)
  values (v_c.empresa_id, 'corte', 'Pago registrado del corte del ' || to_char(v_c.periodo_fin, 'DD/MM/YYYY') || ': ' || to_char(p_monto, 'FM$999,999,990.00'), auth.uid());

  if not exists (select 1 from public.club57_ciclos where empresa_id = v_c.empresa_id and estado = 'vencido') then
    update public.club57_empresas
    set estado = 'activa', suspendida_por_pago = false, motivo_estado = null
    where id = v_c.empresa_id and estado = 'suspendida' and suspendida_por_pago;
    v_reactivada := found;
    if v_reactivada then
      insert into public.club57_empresas_bitacora (empresa_id, accion, detalle, actor_id)
      values (v_c.empresa_id, 'reactivada', 'Automática: pago registrado', auth.uid());
    end if;
  end if;
  return v_reactivada;
end;
$$;

revoke all on function public.club57_admin_registrar_pago(uuid, date, numeric, text) from public, anon;
grant execute on function public.club57_admin_registrar_pago(uuid, date, numeric, text) to authenticated;

-- Reactivar a mano desde el panel una empresa suspendida por pago también
-- limpia la marca (función de la Etapa 1, sin cambios de reglas).
create or replace function public.club57_empresa_limpia_suspension_pago()
returns trigger
language plpgsql
as $$
begin
  if new.estado <> 'suspendida' then
    new.suspendida_por_pago := false;
  end if;
  return new;
end;
$$;

drop trigger if exists club57_empresas_suspension_pago on public.club57_empresas;
create trigger club57_empresas_suspension_pago
  before update of estado on public.club57_empresas
  for each row execute function public.club57_empresa_limpia_suspension_pago();
