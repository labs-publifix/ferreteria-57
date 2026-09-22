-- Club 57 — corrige un bug de zona horaria en TODO cálculo/comparación de
-- fecha_disponible: usaban current_date, que toma la fecha del huso del
-- servidor de Postgres (UTC en Supabase), no la de la tienda (Querétaro,
-- America/Mexico_City, UTC-6). Entre las 6pm y medianoche hora de
-- Querétaro, UTC ya está en el día siguiente — eso corría el periodo de
-- espera de puntos un día de más o de menos según la hora exacta en la
-- que se compraba o se revisaba el saldo. Puramente un fix de CÓMO se
-- calcula la fecha: create or replace sobre las mismas 3 funciones, sin
-- tocar ninguna otra parte de su lógica (mismo criterio que ya usaron
-- 20260918010000/20260919010000 al corregir bugs en funciones ya
-- productivas).

-- today_in_queretaro(): mismo patrón que ya usa el sitio del lado de
-- TypeScript (todayInStoreTimezone() en lib/marketing/visibility.ts) para
-- lo mismo — un solo lugar con la conversión de huso horario, para no
-- repetir la expresión "at time zone" en cada función y arriesgar que se
-- escriba distinto en alguna.
create or replace function public.today_in_queretaro()
returns date
language sql
stable
as $$
  select (now() at time zone 'America/Mexico_City')::date;
$$;

-- create_order(): idéntica a la versión de 20260926010000, solo cambia
-- current_date -> public.today_in_queretaro() en el cálculo de
-- fecha_disponible de los puntos por compra en línea.
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
          public.today_in_queretaro() + v_dias_espera, v_order_id::text
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

-- promote_due_club57_points(): idéntica a 20260925010000, solo cambia
-- current_date -> public.today_in_queretaro() en la comparación.
create or replace function public.promote_due_club57_points()
returns void
language sql
security definer
set search_path = public
as $$
  update public.club57_points_ledger
  set estado = 'disponible'
  where member_id = auth.uid() and estado = 'pendiente' and fecha_disponible <= public.today_in_queretaro();
$$;

-- promote_due_club57_points_for_member(): idéntica a 20260927010000,
-- mismo cambio de comparación.
create or replace function public.promote_due_club57_points_for_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if not (
      public.is_vendedor() and exists (
        select 1 from public.club57_members m
        where m.id = p_member_id and m.creado_por_vendedor_id = auth.uid()
      )
    ) then
      raise exception 'No autorizado.';
    end if;
  end if;

  update public.club57_points_ledger
  set estado = 'disponible'
  where member_id = p_member_id and estado = 'pendiente' and fecha_disponible <= public.today_in_queretaro();
end;
$$;
