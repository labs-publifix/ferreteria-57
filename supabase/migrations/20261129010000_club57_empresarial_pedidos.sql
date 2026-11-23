-- Club 57 Empresarial · Etapa 3: compra con cargo a la empresa.
--
-- 1) Pedidos: forma de pago (Mercado Pago o cargo a empresa), empresa y
--    vínculo del empleado, y un estado nuevo «pendiente_autorizacion».
--    Un pedido con cargo a empresa nace en ese estado (con el stock ya
--    apartado, igual que hoy) y nunca pasa por Mercado Pago:
--      pendiente_autorizacion → pagado (la empresa lo autorizó; desde ahí
--                               sigue el flujo normal de la tienda)
--      pendiente_autorizacion → cancelado (rechazado por la empresa,
--                               cancelado por el empleado, vencido, baja
--                               del empleado o de la empresa, o cancelado
--                               por Ferretería 57)
-- 2) Crédito: lo que el empleado y la empresa tienen comprometido es la
--    suma de sus pedidos con cargo a empresa no cancelados. La Etapa 4
--    restará los descuentos de nómina aplicados (crédito revolvente) y la
--    Etapa 5 los pagos de la empresa.
-- 3) Funciones para comprar, autorizar o rechazar (en bloque), cancelar,
--    vencer y recordar.
--
-- Idempotente: se puede correr más de una vez.

-- ---------------------------------------------------------------------
-- 1) Pedidos
-- ---------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in (
    'pendiente_pago', 'pendiente_autorizacion', 'pagado', 'preparando', 'listo', 'enviado', 'entregado', 'cancelado'
  ));

alter table public.orders add column if not exists metodo_pago text not null default 'mercadopago';
alter table public.orders drop constraint if exists orders_metodo_pago_check;
alter table public.orders add constraint orders_metodo_pago_check check (metodo_pago in ('mercadopago', 'empresa'));

alter table public.orders add column if not exists empresa_id uuid references public.club57_empresas (id) on delete set null;
alter table public.orders add column if not exists empresa_empleado_id uuid references public.club57_empresa_empleados (id) on delete set null;
alter table public.orders add column if not exists autorizacion_vence_at timestamptz;
alter table public.orders add column if not exists autorizado_at timestamptz;
alter table public.orders add column if not exists autorizado_por uuid references auth.users (id) on delete set null;
-- Cómo se resolvió el pedido del lado de la empresa y por qué.
alter table public.orders add column if not exists empresa_resolucion text;
alter table public.orders drop constraint if exists orders_empresa_resolucion_check;
alter table public.orders add constraint orders_empresa_resolucion_check
  check (empresa_resolucion is null or empresa_resolucion in (
    'autorizado', 'rechazado', 'cancelado_empleado', 'vencido', 'baja_empleado', 'baja_empresa', 'cancelado_tienda'
  ));
alter table public.orders add column if not exists empresa_motivo text check (empresa_motivo is null or length(empresa_motivo) <= 500);
alter table public.orders add column if not exists empresa_resuelto_at timestamptz;
alter table public.orders add column if not exists recordatorio_at timestamptz;

create index if not exists orders_empresa_idx on public.orders (empresa_id, status) where empresa_id is not null;
create index if not exists orders_empresa_empleado_idx on public.orders (empresa_empleado_id) where empresa_empleado_id is not null;
create index if not exists orders_pendiente_autorizacion_idx on public.orders (autorizacion_vence_at)
  where status = 'pendiente_autorizacion';

-- ---------------------------------------------------------------------
-- 2) Crédito comprometido
-- ---------------------------------------------------------------------
create or replace function public.club57_empleado_comprometido(p_empleado_id uuid)
returns numeric
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(o.total), 0) from public.orders o
  where o.empresa_empleado_id = p_empleado_id and o.metodo_pago = 'empresa' and o.status <> 'cancelado';
$$;

create or replace function public.club57_empresa_comprometido(p_empresa_id uuid)
returns numeric
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(o.total), 0) from public.orders o
  where o.empresa_id = p_empresa_id and o.metodo_pago = 'empresa' and o.status <> 'cancelado';
$$;

revoke all on function public.club57_empleado_comprometido(uuid) from public, anon, authenticated;
revoke all on function public.club57_empresa_comprometido(uuid) from public, anon, authenticated;

-- Fin del plazo para autorizar: N días hábiles (lunes a viernes) después
-- de la compra, hasta las 23:59 de ese día, hora del centro de México.
create or replace function public.club57_vencimiento_autorizacion(p_desde timestamptz, p_dias integer)
returns timestamptz
language plpgsql
stable
as $$
declare
  v_dia date := (p_desde at time zone 'America/Mexico_City')::date;
  v_contados integer := 0;
begin
  while v_contados < greatest(coalesce(p_dias, 1), 1) loop
    v_dia := v_dia + 1;
    if extract(isodow from v_dia) < 6 then
      v_contados := v_contados + 1;
    end if;
  end loop;
  return (v_dia + 1)::timestamp at time zone 'America/Mexico_City';
end;
$$;

-- Lo que ve el empleado en el checkout y en Mi cuenta → Empresarial.
-- disponible_compra ya considera el crédito de la empresa con Ferretería 57.
create or replace function public.club57_mi_credito_empresa()
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
  domicilio_entrega text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_vinculo public.club57_empresa_empleados;
  v_emp public.club57_empresas;
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

  v_comprometido := public.club57_empleado_comprometido(v_vinculo.id);
  v_disponible := greatest(coalesce(v_vinculo.linea_credito, 0) - v_comprometido, 0);
  v_empresa_disponible := greatest(coalesce(v_emp.limite_credito, 0) - public.club57_empresa_comprometido(v_emp.id), 0);

  return query select
    v_vinculo.id, v_emp.id, v_emp.nombre_comercial, v_emp.estado,
    v_vinculo.linea_credito, v_comprometido, v_disponible,
    least(v_disponible, v_empresa_disponible), v_empresa_disponible < v_disponible,
    v_emp.plazo_autorizacion_dias, v_emp.domicilio_entrega;
end;
$$;

revoke all on function public.club57_mi_credito_empresa() from public, anon;
grant execute on function public.club57_mi_credito_empresa() to authenticated;

-- ---------------------------------------------------------------------
-- 3) Comprar con cargo a la empresa
-- ---------------------------------------------------------------------
-- Crea el pedido con create_order() (mismos precios, stock y validaciones)
-- y lo carga a la empresa. Todo en una transacción: si el crédito no
-- alcanza, no queda pedido ni stock apartado.
create or replace function public.club57_crear_pedido_empresa(
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment_type text,
  p_colonia text,
  p_shipping_address jsonb,
  p_shipping_cost numeric,
  p_items jsonb
)
returns table (
  id uuid,
  order_number text,
  created_at timestamptz,
  subtotal numeric,
  total numeric,
  autorizacion_vence_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_vinculo public.club57_empresa_empleados;
  v_emp public.club57_empresas;
  v_email text;
  v_pedido record;
  v_disponible numeric;
  v_vence timestamptz;
begin
  if v_uid is null then
    raise exception 'Inicia sesión para cargar tu compra a tu empresa.' using errcode = 'F57E1';
  end if;

  -- Bloquea el vínculo y la empresa: dos compras simultáneas del mismo
  -- empleado (o de la misma empresa) se validan una después de la otra.
  select * into v_vinculo from public.club57_empresa_empleados
  where member_id = v_uid and estado = 'activo'
  for update;
  if not found then
    raise exception 'No tienes una empresa vinculada activa.' using errcode = 'F57E1';
  end if;

  select * into v_emp from public.club57_empresas where club57_empresas.id = v_vinculo.empresa_id for update;
  if v_emp.estado <> 'activa' then
    raise exception 'El cargo a tu empresa no está disponible en este momento. Puedes pagar con tarjeta.' using errcode = 'F57E2';
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;

  select * into v_pedido from public.create_order(
    v_email, p_customer_name, p_customer_phone, p_fulfillment_type, p_colonia,
    p_shipping_address, p_shipping_cost, 0, 0, p_items
  );

  v_disponible := coalesce(v_vinculo.linea_credito, 0) - public.club57_empleado_comprometido(v_vinculo.id);
  if v_pedido.total > v_disponible then
    raise exception 'El total de tu pedido (%) rebasa tu crédito disponible (%). Puedes pagar con tarjeta.',
      to_char(v_pedido.total, 'FM$999,999,990.00'), to_char(greatest(v_disponible, 0), 'FM$999,999,990.00')
      using errcode = 'F57E3';
  end if;

  if v_pedido.total > coalesce(v_emp.limite_credito, 0) - public.club57_empresa_comprometido(v_emp.id) then
    raise exception 'Tu empresa alcanzó su límite de crédito con Ferretería 57. Puedes pagar con tarjeta.'
      using errcode = 'F57E4';
  end if;

  v_vence := public.club57_vencimiento_autorizacion(now(), v_emp.plazo_autorizacion_dias);

  update public.orders o
  set status = 'pendiente_autorizacion',
      metodo_pago = 'empresa',
      empresa_id = v_emp.id,
      empresa_empleado_id = v_vinculo.id,
      autorizacion_vence_at = v_vence
  where o.id = v_pedido.id;

  return query select v_pedido.id, v_pedido.order_number, v_pedido.created_at, v_pedido.subtotal, v_pedido.total, v_vence;
end;
$$;

revoke all on function public.club57_crear_pedido_empresa(text, text, text, text, jsonb, numeric, jsonb) from public, anon;
grant execute on function public.club57_crear_pedido_empresa(text, text, text, text, jsonb, numeric, jsonb) to authenticated;

-- Cancela un pedido en espera de autorización y regresa su stock. Interna.
create or replace function public.club57_cancelar_pedido_empresa_int(p_order_id uuid, p_resolucion text, p_motivo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set status = 'cancelado',
      empresa_resolucion = p_resolucion,
      empresa_motivo = left(nullif(btrim(coalesce(p_motivo, '')), ''), 500),
      empresa_resuelto_at = now()
  where id = p_order_id and status = 'pendiente_autorizacion' and metodo_pago = 'empresa';
  if not found then
    return false;
  end if;

  update public.product_variants pv
  set stock = pv.stock + oi.quantity
  from public.order_items oi
  where oi.order_id = p_order_id and oi.variant_id = pv.id;
  return true;
end;
$$;

revoke all on function public.club57_cancelar_pedido_empresa_int(uuid, text, text) from public, anon, authenticated;

-- El empleado cancela su pedido mientras sigue en espera.
create or replace function public.club57_cancelar_mi_pedido_empresa(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.orders o
  join public.club57_empresa_empleados v on v.id = o.empresa_empleado_id
  where o.id = p_order_id and v.member_id = auth.uid()
  for update of o;
  if not found then
    raise exception 'Pedido no encontrado.';
  end if;
  if not public.club57_cancelar_pedido_empresa_int(p_order_id, 'cancelado_empleado', 'Cancelado por el empleado') then
    raise exception 'Este pedido ya no está en espera de autorización.';
  end if;
end;
$$;

revoke all on function public.club57_cancelar_mi_pedido_empresa(uuid) from public, anon;
grant execute on function public.club57_cancelar_mi_pedido_empresa(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 4) Portal Empresa: pedidos
-- ---------------------------------------------------------------------
create or replace function public.club57_portal_pedidos()
returns table (
  id uuid,
  order_number text,
  created_at timestamptz,
  status text,
  fulfillment_type text,
  subtotal numeric,
  shipping_cost numeric,
  total numeric,
  empleado_nombre text,
  empleado_correo text,
  numero_empleado text,
  autorizacion_vence_at timestamptz,
  autorizado_at timestamptz,
  empresa_resolucion text,
  empresa_motivo text,
  items jsonb
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
  select o.id, o.order_number, o.created_at, o.status, o.fulfillment_type, o.subtotal, o.shipping_cost, o.total,
         coalesce(m.full_name, o.customer_name), o.customer_email, v.numero_empleado,
         o.autorizacion_vence_at, o.autorizado_at, o.empresa_resolucion, o.empresa_motivo,
         coalesce((
           select jsonb_agg(jsonb_build_object(
             'product_name', oi.product_name, 'variant_label', oi.variant_label,
             'quantity', oi.quantity, 'unit_price', oi.unit_price
           ) order by oi.product_name)
           from public.order_items oi where oi.order_id = o.id
         ), '[]'::jsonb)
  from public.orders o
  left join public.club57_empresa_empleados v on v.id = o.empresa_empleado_id
  left join public.club57_members m on m.id = v.member_id
  where o.empresa_id = v_empresa and o.metodo_pago = 'empresa'
  order by (o.status = 'pendiente_autorizacion') desc, o.created_at desc
  limit 500;
end;
$$;

revoke all on function public.club57_portal_pedidos() from public, anon;
grant execute on function public.club57_portal_pedidos() to authenticated;

-- Autoriza uno o varios pedidos. Regresa los que sí se autorizaron.
create or replace function public.club57_portal_autorizar_pedidos(p_order_ids uuid[])
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid := public.club57_requiere_responsable();
begin
  if (select estado from public.club57_empresas where id = v_empresa) <> 'activa' then
    raise exception 'Tu empresa está suspendida: no se pueden autorizar pedidos. Escríbenos para revisarlo.';
  end if;
  if coalesce(array_length(p_order_ids, 1), 0) = 0 or array_length(p_order_ids, 1) > 200 then
    raise exception 'Elige entre 1 y 200 pedidos.';
  end if;

  return query
  update public.orders o
  set status = 'pagado',
      autorizado_at = now(),
      autorizado_por = auth.uid(),
      empresa_resolucion = 'autorizado',
      empresa_resuelto_at = now()
  where o.id = any(p_order_ids)
    and o.empresa_id = v_empresa
    and o.metodo_pago = 'empresa'
    and o.status = 'pendiente_autorizacion'
  returning o.id;
end;
$$;

revoke all on function public.club57_portal_autorizar_pedidos(uuid[]) from public, anon;
grant execute on function public.club57_portal_autorizar_pedidos(uuid[]) to authenticated;

create or replace function public.club57_portal_rechazar_pedido(p_order_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid := public.club57_requiere_responsable();
begin
  if nullif(btrim(coalesce(p_motivo, '')), '') is null then
    raise exception 'Escribe el motivo del rechazo.';
  end if;
  perform 1 from public.orders where id = p_order_id and empresa_id = v_empresa for update;
  if not found then
    raise exception 'Pedido no encontrado.';
  end if;
  if not public.club57_cancelar_pedido_empresa_int(p_order_id, 'rechazado', p_motivo) then
    raise exception 'Este pedido ya no está en espera de autorización.';
  end if;
end;
$$;

revoke all on function public.club57_portal_rechazar_pedido(uuid, text) from public, anon;
grant execute on function public.club57_portal_rechazar_pedido(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 5) Tarea diaria (solo servidor): vencer y recordar
-- ---------------------------------------------------------------------
create or replace function public.club57_vencer_pedidos_empresa()
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  for v_id in
    select o.id from public.orders o
    where o.status = 'pendiente_autorizacion' and o.autorizacion_vence_at <= now()
    for update skip locked
  loop
    if public.club57_cancelar_pedido_empresa_int(v_id, 'vencido', 'Tu empresa no lo autorizó a tiempo') then
      return next v_id;
    end if;
  end loop;
end;
$$;

revoke all on function public.club57_vencer_pedidos_empresa() from public, anon, authenticated;
grant execute on function public.club57_vencer_pedidos_empresa() to service_role;

-- Pedidos en espera por los que toca recordar a la empresa (uno al día,
-- nunca el mismo día de la compra: ese día ya recibió el aviso). Los marca.
create or replace function public.club57_pedidos_empresa_por_recordar()
returns table (order_id uuid, empresa_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.orders o
  set recordatorio_at = now()
  where o.status = 'pendiente_autorizacion'
    and coalesce(o.recordatorio_at, o.created_at) < now() - interval '20 hours'
  returning o.id, o.empresa_id;
end;
$$;

revoke all on function public.club57_pedidos_empresa_por_recordar() from public, anon, authenticated;
grant execute on function public.club57_pedidos_empresa_por_recordar() to service_role;

-- ---------------------------------------------------------------------
-- 6) Bajas: los pedidos en espera se cancelan solos
-- ---------------------------------------------------------------------
-- Baja de la empresa (desde el panel de Ferretería 57).
create or replace function public.club57_empresa_baja_cancela_pedidos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if new.estado = 'baja' and old.estado is distinct from 'baja' then
    for v_id in
      select o.id from public.orders o
      where o.empresa_id = new.id and o.status = 'pendiente_autorizacion'
    loop
      perform public.club57_cancelar_pedido_empresa_int(v_id, 'baja_empresa', 'La empresa dejó el programa');
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists club57_empresas_baja_pedidos on public.club57_empresas;
create trigger club57_empresas_baja_pedidos
  after update of estado on public.club57_empresas
  for each row execute function public.club57_empresa_baja_cancela_pedidos();

-- Baja o rechazo del empleado desde el Portal Empresa (misma función de la
-- Etapa 2, ahora también cancela sus pedidos en espera).
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

  for v_order in
    select o.id from public.orders o
    where o.empresa_empleado_id = p_empleado_id and o.status = 'pendiente_autorizacion'
  loop
    perform public.club57_cancelar_pedido_empresa_int(v_order, 'baja_empleado', 'Ya no participas en el programa de tu empresa');
  end loop;
  return v_nuevo;
end;
$$;

revoke all on function public.club57_portal_cerrar_empleado(uuid, text) from public, anon;
grant execute on function public.club57_portal_cerrar_empleado(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 7) Panel de pedidos: un pedido en espera de la empresa solo se puede
--    cancelar (misma función de antes, con esa regla y la marca de
--    cancelación por la tienda).
-- ---------------------------------------------------------------------
create or replace function public.update_order_status(p_order_id uuid, p_expected_status text, p_new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status text;
  v_fulfillment_type text;
  v_order_number text;
  v_metodo_pago text;
  v_original_movement record;
  v_sequence text[];
  v_current_idx int;
  v_expected_next text;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;

  select status, fulfillment_type, order_number, metodo_pago
    into v_current_status, v_fulfillment_type, v_order_number, v_metodo_pago
  from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  if v_current_status is distinct from p_expected_status then
    raise exception 'Este pedido ya cambió de estatus — actualiza la página e intenta de nuevo.'
      using errcode = 'F57ST';
  end if;

  if v_current_status in ('entregado', 'cancelado') then
    raise exception 'Este pedido ya está en un estatus final y no admite más cambios.'
      using errcode = 'F57ST';
  end if;

  -- Club 57 Empresarial: mientras la empresa no lo autorice, la tienda
  -- solo puede cancelarlo.
  if v_current_status = 'pendiente_autorizacion' and p_new_status is distinct from 'cancelado' then
    raise exception 'Este pedido espera la autorización de la empresa; solo se puede cancelar.'
      using errcode = 'F57ST';
  end if;

  v_sequence := case v_fulfillment_type
    when 'pickup' then array['pendiente_pago', 'pagado', 'preparando', 'listo', 'entregado']
    else array['pendiente_pago', 'pagado', 'preparando', 'listo', 'enviado', 'entregado']
  end;

  v_current_idx := array_position(v_sequence, v_current_status);
  v_expected_next := case
    when v_current_idx is not null and v_current_idx < array_length(v_sequence, 1)
      then v_sequence[v_current_idx + 1]
    else null
  end;

  if p_new_status is distinct from v_expected_next
     and p_new_status is distinct from 'entregado'
     and p_new_status is distinct from 'cancelado' then
    raise exception 'Transición de estatus inválida: % -> %.', v_current_status, p_new_status
      using errcode = 'F57ST';
  end if;

  update public.orders set status = p_new_status where id = p_order_id;

  if p_new_status = 'cancelado' and v_current_status is distinct from 'cancelado' then
    update public.product_variants pv
    set stock = pv.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.variant_id = pv.id;

    if v_metodo_pago = 'empresa' then
      update public.orders
      set empresa_resolucion = 'cancelado_tienda', empresa_motivo = 'Cancelado por Ferretería 57', empresa_resuelto_at = now()
      where id = p_order_id;
    end if;

    begin
      select * into v_original_movement
      from public.club57_points_ledger
      where tipo = 'compra_online' and referencia = p_order_id::text
      limit 1;

      if found then
        insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, referencia)
        values (
          v_original_movement.member_id,
          -v_original_movement.cantidad,
          'reversion_cancelacion',
          v_original_movement.estado,
          'Cancelación pedido ' || v_order_number
        );
      end if;
    exception when others then
      raise warning 'Club 57: no se pudo revertir puntos del pedido %: %', p_order_id, sqlerrm;
    end;
  end if;
end;
$$;
