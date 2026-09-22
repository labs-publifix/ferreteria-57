-- Club 57 — conecta el flujo de Pedidos con los puntos, por primera vez.
-- create_order() y update_order_status() se reemplazan (mismo patrón que
-- ya usó 20260919010000 para agregar el descuento de stock) para agregar,
-- ADEMÁS de todo lo que ya hacían, la parte de puntos. El cuerpo original
-- de ambas funciones queda intacto carácter por carácter; todo lo nuevo
-- vive en un bloque propio envuelto en su "exception when others" — si
-- algo de la lógica de puntos fallara (config faltante, lo que sea), ese
-- bloque absorbe el error y el pedido se crea/cancela exactamente igual
-- que antes. Nunca debe poder pasar que un pedido falle por culpa de
-- Club 57.

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
  v_member_id uuid;
  v_referred_by uuid;
  v_monto_por_punto numeric;
  v_dias_espera integer;
  v_puntos integer;
  v_is_first_purchase boolean;
  v_puntos_referidor integer;
  v_puntos_referido integer;
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
      -- errcode custom (fuera de los que Postgres/PL/pgSQL ya usan) para
      -- que el Server Action pueda distinguir "no hay stock" (mensaje
      -- seguro de mostrar tal cual al cliente) de cualquier otro error de
      -- base de datos (donde sí conviene un mensaje genérico).
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
    p_fulfillment_type, p_colonia, p_shipping_address, p_shipping_cost, p_subtotal, p_total, 'pagado'
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

  -- Club 57: todo pedido nace ya 'pagado' (no hay pasarela de pago real —
  -- ver lib/orders/status.ts), así que este es el único momento en que un
  -- pedido "pasa a pagado" hoy. Si el correo del pedido no corresponde a
  -- ningún club57_members, no se genera ningún punto (a propósito: comprar
  -- sin cuenta de Club 57 sigue funcionando exactamente igual que hoy).
  begin
    -- club57_members.id calificado a propósito: create_order() declara
    -- "returns table (id uuid, ...)", así que un "id" sin calificar aquí
    -- es ambiguo entre esa columna de salida y la de este SELECT (mismo
    -- tipo de bug que ya arregló 20260918010000_fix_create_order_ambiguous_column).
    select club57_members.id, club57_members.referred_by into v_member_id, v_referred_by
    from public.club57_members
    where lower(email) = lower(p_customer_email)
    limit 1;

    if v_member_id is not null then
      select monto_por_punto, dias_espera_pendiente into v_monto_por_punto, v_dias_espera
      from public.club57_config
      limit 1;

      v_puntos := floor(p_subtotal / v_monto_por_punto);

      -- ¿Es esta su primera compra en línea pagada? Se calcula ANTES de
      -- insertar el movimiento de esta compra — el bono de referido es
      -- "una sola vez por relación" y este chequeo es, a propósito, la
      -- única puerta: después de esta compra ya nunca vuelve a ser cierto.
      select not exists (
        select 1 from public.club57_points_ledger
        where member_id = v_member_id and tipo = 'compra_online'
      ) into v_is_first_purchase;

      if v_puntos > 0 then
        insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, fecha_disponible, referencia)
        values (
          v_member_id, v_puntos, 'compra_online', 'pendiente',
          current_date + v_dias_espera, v_order_id::text
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
    raise warning 'Club 57: no se pudieron aplicar puntos al pedido %: %', v_order_id, sqlerrm;
  end;

  return query select v_order_id, v_order_number, v_created_at;
end;
$$;

create or replace function public.update_order_status(
  p_order_id uuid,
  p_expected_status text,
  p_new_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status text;
  v_order_number text;
  v_original_movement record;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;

  select status, order_number into v_current_status, v_order_number
  from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  if v_current_status is distinct from p_expected_status then
    raise exception 'Este pedido ya cambió de estatus — actualiza la página e intenta de nuevo.'
      using errcode = 'F57ST';
  end if;

  update public.orders set status = p_new_status where id = p_order_id;

  -- Restaura stock solo al ENTRAR a cancelado (nunca si ya estaba
  -- cancelado, lo cual ya es imposible llegar aquí de todas formas porque
  -- getAvailableNextStatuses() nunca ofrece "cancelado" como opción desde
  -- un pedido ya cancelado — este chequeo es solo la segunda capa).
  -- variant_id nulo (variante borrada después de la compra) se ignora
  -- solo: el UPDATE no encuentra a quién sumarle el stock y no hace nada.
  if p_new_status = 'cancelado' and v_current_status is distinct from 'cancelado' then
    update public.product_variants pv
    set stock = pv.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.variant_id = pv.id;

    -- Club 57: si este pedido había generado puntos (compra_online con
    -- referencia = este order_id), se revierte con una entrada NUEVA y
    -- negativa por la misma cantidad exacta — el movimiento original
    -- nunca se edita (ver el comentario de "append-only" en
    -- club57_points_ledger, migración 20260921010000). El reembolso queda
    -- en el mismo estado en el que esté el original AHORA MISMO (si ya
    -- pasó a 'disponible' y el cliente ya lo gastó, esto puede dejarlo en
    -- negativo — caso de negocio explícitamente fuera de alcance aquí).
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

-- promote_due_club57_points(): pasa a 'disponible' los movimientos
-- 'pendiente' del propio miembro cuya fecha_disponible ya llegó. No hay
-- política de UPDATE sobre club57_points_ledger para ningún rol (a
-- propósito, ver migración 1) — esta función SECURITY DEFINER es la única
-- forma de aplicar esa transición, que hasta ahora solo se calculaba y
-- mostraba pero nada la aplicaba. Se llama al cargar /cuenta — aceptable
-- para esta primera versión (ver prompt), sin cron ni trigger de tiempo.
create or replace function public.promote_due_club57_points()
returns void
language sql
security definer
set search_path = public
as $$
  update public.club57_points_ledger
  set estado = 'disponible'
  where member_id = auth.uid() and estado = 'pendiente' and fecha_disponible <= current_date;
$$;

grant execute on function public.promote_due_club57_points() to authenticated;
