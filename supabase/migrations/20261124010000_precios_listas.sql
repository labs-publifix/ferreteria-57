-- Precios · Fase 1: listas de precio y blindaje del checkout.
--
-- 1) Cada presentación (product_variants) tiene 4 listas de precio en una
--    tabla PROTEGIDA (product_price_levels): solo el personal las lee y las
--    escribe. El público sigue leyendo únicamente product_variants.price,
--    que pasa a ser el «precio de tienda»: la lista que Ferretería 57 elige
--    en price_settings. Así nadie puede consultar desde fuera las listas
--    que no le corresponden.
-- 2) Al correr esta migración las 4 listas quedan IGUALES al precio actual
--    de cada presentación: la tienda no cambia en nada hasta que se importen
--    las listas reales (Fase 2).
-- 3) Triggers mantienen todo consistente:
--      - variante nueva → nacen sus 4 listas con su precio;
--      - se cambian las listas → product_variants.price se ajusta a la lista
--        de tienda;
--      - se cambia el precio de una variante desde las pantallas actuales →
--        la lista de tienda (y las listas que valían lo mismo) lo siguen.
-- 4) club57_members.lista_precio: lista asignada a un miembro (null = la de
--    tienda). La pantalla para asignarla llega en la Fase 3; la columna se
--    crea desde ahora para que el checkout ya calcule con la regla final.
-- 5) create_order() ya NO confía en el precio que manda el navegador:
--    calcula cada precio, nombre, código y subtotal desde la base, según
--    quién compra, y verifica que el producto siga activo. cotizar_carrito()
--    permite al servidor saber esos precios antes de crear el pedido (para
--    calcular el envío y avisar si cambiaron).
--
-- Idempotente: se puede correr más de una vez.

-- ---------------------------------------------------------------------
-- 1) Listas de precio por presentación
-- ---------------------------------------------------------------------
create table if not exists public.product_price_levels (
  variant_id uuid primary key references public.product_variants (id) on delete cascade,
  precio_1 numeric(10, 2) not null check (precio_1 >= 0),
  precio_2 numeric(10, 2) not null check (precio_2 >= 0),
  precio_3 numeric(10, 2) not null check (precio_3 >= 0),
  precio_4 numeric(10, 2) not null check (precio_4 >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.product_price_levels enable row level security;

drop policy if exists "El personal administra las listas de precio" on public.product_price_levels;
create policy "El personal administra las listas de precio"
  on public.product_price_levels for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 2) Configuración: qué lista es el precio de tienda (por defecto, Precio 2)
-- ---------------------------------------------------------------------
create table if not exists public.price_settings (
  id boolean primary key default true,
  lista_tienda smallint not null default 2 check (lista_tienda between 1 and 4),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint price_settings_singleton check (id)
);

insert into public.price_settings (id) values (true) on conflict (id) do nothing;

alter table public.price_settings enable row level security;

drop policy if exists "El personal lee la configuración de precios" on public.price_settings;
create policy "El personal lee la configuración de precios"
  on public.price_settings for select
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 3) Lista asignada a un miembro de Club 57 (null = precio de tienda)
-- ---------------------------------------------------------------------
alter table public.club57_members
  add column if not exists lista_precio smallint check (lista_precio is null or lista_precio between 1 and 4);

-- ---------------------------------------------------------------------
-- 4) Utilidades
-- ---------------------------------------------------------------------
create or replace function public.precio_de_lista(p_levels public.product_price_levels, p_lista smallint)
returns numeric
language sql
immutable
as $$
  select case p_lista
    when 1 then p_levels.precio_1
    when 2 then p_levels.precio_2
    when 3 then p_levels.precio_3
    when 4 then p_levels.precio_4
  end;
$$;

create or replace function public.lista_tienda_actual()
returns smallint
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select lista_tienda from public.price_settings where id), 2::smallint);
$$;

-- ---------------------------------------------------------------------
-- 5) Sincronización entre listas y precio de tienda
--    La bandera de sesión f57.sincronizando_precios evita que los triggers
--    se disparen en cadena entre sí.
-- ---------------------------------------------------------------------
create or replace function public.product_variants_crear_listas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.product_price_levels (variant_id, precio_1, precio_2, precio_3, precio_4)
  values (new.id, new.price, new.price, new.price, new.price)
  on conflict (variant_id) do nothing;
  return null;
end;
$$;

drop trigger if exists product_variants_crear_listas on public.product_variants;
create trigger product_variants_crear_listas
  after insert on public.product_variants
  for each row execute function public.product_variants_crear_listas();

-- Un cambio de precio hecho directamente sobre la variante (las pantallas
-- actuales del admin y el importador) se toma como el nuevo precio de
-- tienda: lo recibe la lista de tienda y cualquier lista que valiera lo
-- mismo que el precio anterior.
create or replace function public.product_variants_precio_manual()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lista smallint;
begin
  if coalesce(current_setting('f57.sincronizando_precios', true), '') = '1' then
    return null;
  end if;
  if new.price is not distinct from old.price then
    return null;
  end if;

  v_lista := public.lista_tienda_actual();
  perform set_config('f57.sincronizando_precios', '1', true);
  update public.product_price_levels l
  set precio_1 = case when v_lista = 1 or l.precio_1 = old.price then new.price else l.precio_1 end,
      precio_2 = case when v_lista = 2 or l.precio_2 = old.price then new.price else l.precio_2 end,
      precio_3 = case when v_lista = 3 or l.precio_3 = old.price then new.price else l.precio_3 end,
      precio_4 = case when v_lista = 4 or l.precio_4 = old.price then new.price else l.precio_4 end,
      updated_at = now()
  where l.variant_id = new.id;
  if not found then
    insert into public.product_price_levels (variant_id, precio_1, precio_2, precio_3, precio_4)
    values (new.id, new.price, new.price, new.price, new.price)
    on conflict (variant_id) do nothing;
  end if;
  perform set_config('f57.sincronizando_precios', '', true);
  return null;
end;
$$;

drop trigger if exists product_variants_precio_manual on public.product_variants;
create trigger product_variants_precio_manual
  after update of price on public.product_variants
  for each row execute function public.product_variants_precio_manual();

-- Cambian las listas (importador de precios, fichas de producto) → el
-- precio de tienda de la variante se ajusta a la lista elegida.
create or replace function public.product_price_levels_sincronizar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_precio numeric;
begin
  if coalesce(current_setting('f57.sincronizando_precios', true), '') = '1' then
    return null;
  end if;

  v_precio := public.precio_de_lista(new, public.lista_tienda_actual());
  perform set_config('f57.sincronizando_precios', '1', true);
  update public.product_variants
  set price = v_precio
  where id = new.variant_id and price is distinct from v_precio;
  perform set_config('f57.sincronizando_precios', '', true);
  return null;
end;
$$;

drop trigger if exists product_price_levels_sincronizar on public.product_price_levels;
create trigger product_price_levels_sincronizar
  after insert or update on public.product_price_levels
  for each row execute function public.product_price_levels_sincronizar();

-- Las 4 listas de cada presentación existente arrancan iguales a su precio
-- actual: la tienda no cambia.
insert into public.product_price_levels (variant_id, precio_1, precio_2, precio_3, precio_4)
select id, price, price, price, price from public.product_variants
on conflict (variant_id) do nothing;

-- ---------------------------------------------------------------------
-- 6) Precio que le corresponde a una persona para una presentación:
--    la lista asignada si es miembro con lista; si no, el precio de tienda.
--    Solo la usan funciones internas (create_order, cotizar_carrito).
-- ---------------------------------------------------------------------
create or replace function public.precio_para(p_variant_id uuid, p_user uuid)
returns numeric
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    case when m.lista_precio is not null and l.variant_id is not null
      then public.precio_de_lista(l, m.lista_precio)
    end,
    pv.price
  )
  from public.product_variants pv
  left join public.product_price_levels l on l.variant_id = pv.id
  left join public.club57_members m on p_user is not null and m.id = p_user
  where pv.id = p_variant_id;
$$;

revoke execute on function public.precio_para(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 7) Cotizar el carrito: precio vigente para quien está comprando, datos
--    del producto y si sigue disponible. La llama el servidor del checkout
--    antes de crear el pedido.
-- ---------------------------------------------------------------------
create or replace function public.cotizar_carrito(p_variant_ids uuid[])
returns table (
  variant_id uuid,
  product_id uuid,
  product_name text,
  variant_label text,
  sku text,
  unit_price numeric,
  stock integer,
  disponible boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    pv.id,
    p.id,
    p.name,
    pv.label,
    pv.sku,
    public.precio_para(pv.id, auth.uid()),
    pv.stock,
    p.active
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where pv.id = any (p_variant_ids);
$$;

grant execute on function public.cotizar_carrito(uuid[]) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 8) create_order(): misma firma de entrada (el checkout publicado sigue
--    funcionando mientras se actualiza), pero ahora:
--      - IGNORA unit_price, product_name, sku, variant_label, p_subtotal y
--        p_total que manda el cliente: todo sale de la base;
--      - el precio es el que le corresponde a quien compra (precio_para);
--      - rechaza productos inactivos o inexistentes y cantidades inválidas;
--      - total = subtotal calculado + costo de envío (que calcula el
--        servidor del checkout);
--      - devuelve también subtotal y total.
-- ---------------------------------------------------------------------
drop function if exists public.create_order(text, text, text, text, text, jsonb, numeric, numeric, numeric, jsonb);

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
returns table (id uuid, order_number text, created_at timestamptz, subtotal numeric, total numeric)
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
  v_name text;
  v_label text;
  v_sku text;
  v_active boolean;
  v_unit numeric;
  v_subtotal numeric := 0;
  v_lines jsonb := '[]'::jsonb;
begin
  if p_fulfillment_type not in ('pickup', 'local_delivery', 'foraneo') then
    raise exception 'fulfillment_type inválido: %', p_fulfillment_type;
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Un pedido necesita al menos un producto.';
  end if;
  if p_shipping_cost is null or p_shipping_cost < 0 then
    raise exception 'Costo de envío inválido.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_variant_id := (v_item ->> 'variant_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Cantidad inválida en el pedido.';
    end if;

    select p.name, pv.label, pv.sku, p.active
      into v_name, v_label, v_sku, v_active
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = v_variant_id;

    if not found or not v_active then
      raise exception 'Un producto de tu carrito ya no está disponible. Actualiza tu carrito e intenta de nuevo.'
        using errcode = 'F57NA';
    end if;

    v_unit := public.precio_para(v_variant_id, auth.uid());

    update public.product_variants pv
    set stock = pv.stock - v_quantity
    where pv.id = v_variant_id and pv.stock >= v_quantity;

    get diagnostics v_updated_rows = row_count;

    if v_updated_rows = 0 then
      raise exception 'No hay suficiente stock disponible para "%". Actualiza tu carrito e intenta de nuevo.', v_name
        using errcode = 'F57NS';
    end if;

    v_subtotal := v_subtotal + v_unit * v_quantity;
    v_lines := v_lines || jsonb_build_object(
      'variant_id', v_variant_id,
      'product_name', v_name,
      'variant_label', v_label,
      'sku', v_sku,
      'unit_price', v_unit,
      'quantity', v_quantity
    );
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
    p_fulfillment_type, p_colonia, p_shipping_address, p_shipping_cost, v_subtotal, v_subtotal + p_shipping_cost,
    'pendiente_pago'
  )
  returning orders.id, orders.created_at into v_order_id, v_created_at;

  insert into public.order_items (order_id, product_name, variant_label, sku, unit_price, quantity, variant_id)
  select
    v_order_id,
    line ->> 'product_name',
    line ->> 'variant_label',
    line ->> 'sku',
    (line ->> 'unit_price')::numeric,
    (line ->> 'quantity')::integer,
    (line ->> 'variant_id')::uuid
  from jsonb_array_elements(v_lines) as line;

  return query select v_order_id, v_order_number, v_created_at, v_subtotal, v_subtotal + p_shipping_cost;
end;
$$;

grant execute on function public.create_order(text, text, text, text, text, jsonb, numeric, numeric, numeric, jsonb)
  to anon, authenticated;
