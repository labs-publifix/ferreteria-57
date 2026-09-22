-- Club 57 — dos añadidos, ambos aditivos sobre lo que ya funciona:
-- 1) El bono de referido (hasta ahora solo en create_order) se extrae a
--    una función compartida, para que "compra en tienda" (registro manual,
--    Prompt 1) también lo dispare — y de paso ambos flujos cuentan la
--    "primera compra real" igual: online O manual, nunca solo una.
-- 2) Una versión de la promoción de puntos vencidos que un ADMIN puede
--    ejecutar sobre CUALQUIER cliente (verificando is_admin(), no
--    auth.uid()), para que el saldo que ve un vendedor en mostrador ya
--    esté al día sin depender de que el cliente haya entrado a su cuenta.

-- grant_club57_referral_bonus(): se llama DESPUÉS de insertar el
-- movimiento de una compra (online o manual) ya hecho por el llamador —
-- esta función no inserta el movimiento de la compra en sí, solo decide
-- si corresponde el bono. "Primera compra real" = exactamente 1 movimiento
-- de tipo compra_online/compra_manual para este miembro a estas alturas.
-- Doblemente protegida contra volver a otorgarlo: además de ese conteo,
-- revisa que el miembro referido no tenga ya un 'referido_bono' propio —
-- así que llamarla de más (dos veces sobre el mismo pedido, o sin que en
-- realidad sea la primera compra) nunca duplica nada.
create or replace function public.grant_club57_referral_bonus(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referred_by uuid;
  v_ya_tiene_bono boolean;
  v_num_compras integer;
  v_puntos_referidor integer;
  v_puntos_referido integer;
begin
  select referred_by into v_referred_by from public.club57_members where id = p_member_id;
  if v_referred_by is null then
    return;
  end if;

  select exists (
    select 1 from public.club57_points_ledger
    where member_id = p_member_id and tipo = 'referido_bono'
  ) into v_ya_tiene_bono;
  if v_ya_tiene_bono then
    return;
  end if;

  select count(*) into v_num_compras
  from public.club57_points_ledger
  where member_id = p_member_id and tipo in ('compra_online', 'compra_manual');
  if v_num_compras <> 1 then
    return;
  end if;

  select puntos_referidor, puntos_referido into v_puntos_referidor, v_puntos_referido
  from public.club57_config
  limit 1;

  insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, referencia)
  values (v_referred_by, v_puntos_referidor, 'referido_bono', 'disponible', 'Bono por referir — primera compra de tu referido');

  insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, referencia)
  values (p_member_id, v_puntos_referido, 'referido_bono', 'disponible', 'Bono de bienvenida por referido');
end;
$$;

grant execute on function public.grant_club57_referral_bonus(uuid) to authenticated;

-- create_order(): idéntica a 20260925010000, salvo el bloque de puntos —
-- ahora llama a grant_club57_referral_bonus() en vez de tener su propia
-- copia de la lógica (que además solo miraba compra_online). Sigue dentro
-- del mismo "exception when others": si el bono fallara, el pedido y sus
-- puntos de compra se crean igual.
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
  v_monto_por_punto numeric;
  v_dias_espera integer;
  v_puntos integer;
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
    select club57_members.id into v_member_id
    from public.club57_members
    where lower(email) = lower(p_customer_email)
    limit 1;

    if v_member_id is not null then
      select monto_por_punto, dias_espera_pendiente into v_monto_por_punto, v_dias_espera
      from public.club57_config
      limit 1;

      v_puntos := floor(p_subtotal / v_monto_por_punto);

      if v_puntos > 0 then
        insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, fecha_disponible, referencia)
        values (
          v_member_id, v_puntos, 'compra_online', 'pendiente',
          current_date + v_dias_espera, v_order_id::text
        );

        perform public.grant_club57_referral_bonus(v_member_id);
      end if;
    end if;
  exception when others then
    raise warning 'Club 57: no se pudieron aplicar puntos al pedido %: %', v_order_id, sqlerrm;
  end;

  return query select v_order_id, v_order_number, v_created_at;
end;
$$;

-- promote_due_club57_points_for_member(): misma transición que
-- promote_due_club57_points() (pendiente -> disponible cuando ya llegó su
-- fecha), pero para UN cliente puntual y verificando is_admin() en vez de
-- auth.uid() = member_id — la usa /admin/lealtad/clientes/[id] al abrir el
-- detalle, para que el saldo que ve el vendedor en mostrador ya esté al
-- día sin depender de que el cliente haya entrado a /cuenta.
create or replace function public.promote_due_club57_points_for_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;

  update public.club57_points_ledger
  set estado = 'disponible'
  where member_id = p_member_id and estado = 'pendiente' and fecha_disponible <= current_date;
end;
$$;

grant execute on function public.promote_due_club57_points_for_member(uuid) to authenticated;
