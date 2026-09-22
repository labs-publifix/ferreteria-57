-- Conecta el checkout real con Mercado Pago (modo Marketplace): los
-- pedidos ya no nacen 'pagado' (ver comentario de 20260925010000 —  "no
-- hay pasarela de pago real" dejó de ser cierto), nacen 'pendiente_pago'
-- y solo pasan a 'pagado' cuando el webhook de Mercado Pago confirma el
-- cobro. Los puntos de Club 57 se mueven con ese mismo cambio: antes se
-- otorgaban al CREAR el pedido (porque nacía ya pagado), ahora se otorgan
-- al CONFIRMARSE el pago — nunca antes, para no regalar puntos por
-- pedidos que el cliente nunca terminó de pagar.

alter table public.orders
  add column if not exists mp_preference_id text,
  add column if not exists mp_payment_id text;

-- El único camino real para crear un pedido sigue siendo create_order()
-- (que ahora siempre inserta 'pendiente_pago' explícito, ver más abajo),
-- pero la política "Los admins administran pedidos" sí permite un INSERT
-- directo de un admin — este default es solo esa segunda capa de defensa,
-- para que ese camino excepcional tampoco pueda crear un pedido que nazca
-- 'pagado' sin pasar por Mercado Pago.
alter table public.orders alter column status set default 'pendiente_pago';

-- Evita que el mismo payment_id de Mercado Pago quede atribuido a dos
-- pedidos distintos (p. ej. por un reintento con datos manipulados) — el
-- índice ignora los null (todo pedido sin pagar exitosamente todavía).
create unique index if not exists orders_mp_payment_id_key
  on public.orders (mp_payment_id) where mp_payment_id is not null;

-- create_order(): idéntica a 20260925010000, salvo dos cambios — (1) el
-- pedido nace 'pendiente_pago' en vez de 'pagado', (2) se quita por
-- completo el bloque que otorgaba puntos de Club 57 al crear el pedido
-- (esa lógica se mueve, copiada, a confirm_order_payment() más abajo —
-- ahora corre cuando el pago se confirma, no cuando el pedido se crea).
create or replace function public.create_order(
  p_customer_email text,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment_type text,
  p_colonia text,
  p_shipping_address jsonb,
  p_shipping_cost numeric,
  p_subtotal numeric,
  p_total numeric,
  p_items jsonb
)
returns table (id uuid, order_number text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_created_at timestamptz;
  v_item jsonb;
  v_variant_id uuid;
  v_quantity integer;
  v_updated_rows integer;
begin
  if p_fulfillment_type not in ('pickup', 'local_delivery', 'foraneo') then
    raise exception 'fulfillment_type inválido: %', p_fulfillment_type;
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Un pedido necesita al menos un producto.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_variant_id := (v_item ->> 'variant_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::integer;

    update public.product_variants pv
    set stock = pv.stock - v_quantity
    where pv.id = v_variant_id and pv.stock >= v_quantity;

    get diagnostics v_updated_rows = row_count;

    if v_updated_rows = 0 then
      raise exception 'No hay suficiente stock disponible para "%". Actualiza tu carrito e intenta de nuevo.',
        (v_item ->> 'product_name')
        using errcode = 'F57NS';
    end if;
  end loop;

  loop
    v_order_number := 'F57-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    exit when not exists (select 1 from public.orders o where o.order_number = v_order_number);
  end loop;

  insert into public.orders (
    order_number, customer_email, customer_name, customer_phone,
    fulfillment_type, colonia, shipping_address, shipping_cost, subtotal, total, status
  ) values (
    v_order_number, p_customer_email, p_customer_name, p_customer_phone,
    p_fulfillment_type, p_colonia, p_shipping_address, p_shipping_cost, p_subtotal, p_total, 'pendiente_pago'
  )
  returning orders.id, orders.created_at into v_order_id, v_created_at;

  insert into public.order_items (order_id, product_name, variant_label, sku, unit_price, quantity, variant_id)
  select
    v_order_id,
    item ->> 'product_name',
    item ->> 'variant_label',
    item ->> 'sku',
    (item ->> 'unit_price')::numeric,
    (item ->> 'quantity')::integer,
    (item ->> 'variant_id')::uuid
  from jsonb_array_elements(p_items) as item;

  return query select v_order_id, v_order_number, v_created_at;
end;
$$;

-- confirm_order_payment(): la contraparte de "el pedido nace pagado" que
-- ya no existe — la llama exclusivamente el webhook de Mercado Pago (ver
-- app/api/mercadopago/webhook/route.ts) usando la service_role, nunca un
-- cliente autenticado. Por eso NO valida is_admin() (no hay sesión de
-- usuario en ese contexto): en su lugar, el acceso se cierra por completo
-- con REVOKE/GRANT más abajo — a diferencia de update_order_status(), que
-- sí puede confiar en auth.uid() porque siempre lo llama un admin logueado.
-- Idempotente a propósito: Mercado Pago puede reintentar el mismo webhook
-- más de una vez (entrega "al menos una vez"), así que un pedido que ya
-- está 'pagado' simplemente no hace nada en la segunda llamada.
create or replace function public.confirm_order_payment(
  p_order_id uuid,
  p_mp_payment_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status text;
  v_customer_email text;
  v_subtotal numeric;
  v_member_id uuid;
  v_referred_by uuid;
  v_monto_por_punto numeric;
  v_dias_espera integer;
  v_puntos integer;
  v_is_first_purchase boolean;
  v_puntos_referidor integer;
  v_puntos_referido integer;
begin
  select status, customer_email, subtotal
    into v_current_status, v_customer_email, v_subtotal
  from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  -- Ya estaba pagado (reintento del webhook): no hacer nada, ni
  -- reescribir mp_payment_id ni volver a otorgar puntos.
  if v_current_status = 'pagado' then
    return;
  end if;

  if v_current_status <> 'pendiente_pago' then
    raise exception 'No se puede confirmar el pago de un pedido en estatus %.', v_current_status;
  end if;

  update public.orders
  set status = 'pagado', mp_payment_id = p_mp_payment_id
  where id = p_order_id;

  -- Club 57: mismo bloque que antes vivía dentro de create_order() (ver
  -- 20260925010000) — solo se movió el momento en que corre, la lógica en
  -- sí es idéntica carácter por carácter.
  begin
    select club57_members.id, club57_members.referred_by into v_member_id, v_referred_by
    from public.club57_members
    where lower(email) = lower(v_customer_email)
    limit 1;

    if v_member_id is not null then
      select monto_por_punto, dias_espera_pendiente into v_monto_por_punto, v_dias_espera
      from public.club57_config
      limit 1;

      v_puntos := floor(v_subtotal / v_monto_por_punto);

      select not exists (
        select 1 from public.club57_points_ledger
        where member_id = v_member_id and tipo = 'compra_online'
      ) into v_is_first_purchase;

      if v_puntos > 0 then
        insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, fecha_disponible, referencia)
        values (
          v_member_id, v_puntos, 'compra_online', 'pendiente',
          current_date + v_dias_espera, p_order_id::text
        );
      end if;

      if v_is_first_purchase and v_referred_by is not null then
        select puntos_referidor, puntos_referido into v_puntos_referidor, v_puntos_referido
        from public.club57_config
        limit 1;

        insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, referencia)
        values (v_referred_by, v_puntos_referidor, 'referido_bono', 'disponible', 'Bono por referir — primera compra de tu referido');

        insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, referencia)
        values (v_member_id, v_puntos_referido, 'referido_bono', 'disponible', 'Bono de bienvenida por referido');
      end if;
    end if;
  exception when others then
    raise warning 'Club 57: no se pudieron aplicar puntos al pedido %: %', p_order_id, sqlerrm;
  end;
end;
$$;

revoke execute on function public.confirm_order_payment(uuid, text) from public;
grant execute on function public.confirm_order_payment(uuid, text) to service_role;

-- mark_order_payment_failed(): contraparte de confirm_order_payment()
-- para cuando Mercado Pago reporta el pago como rechazado/cancelado —
-- libera el stock reservado (mismo patrón que la rama "cancelado" de
-- update_order_status(), ver 20260925010000) y deja el pedido en
-- 'cancelado'. Solo actúa si el pedido sigue 'pendiente_pago': si ya
-- avanzó (p. ej. un admin ya lo marcó 'pagado' a mano mientras tanto), no
-- lo toca — mismo criterio "no pisar un estado más avanzado" que ya usa
-- confirm_order_payment(). Mismos permisos: solo service_role.
create or replace function public.mark_order_payment_failed(
  p_order_id uuid,
  p_mp_payment_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status text;
begin
  select status into v_current_status from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  if v_current_status <> 'pendiente_pago' then
    return;
  end if;

  update public.orders
  set status = 'cancelado', mp_payment_id = coalesce(p_mp_payment_id, mp_payment_id)
  where id = p_order_id;

  update public.product_variants pv
  set stock = pv.stock + oi.quantity
  from public.order_items oi
  where oi.order_id = p_order_id
    and oi.variant_id = pv.id;
end;
$$;

revoke execute on function public.mark_order_payment_failed(uuid, text) from public;
grant execute on function public.mark_order_payment_failed(uuid, text) to service_role;
