-- Pedidos reales del checkout: el pago sigue simulado (Mercado Pago es
-- trabajo posterior), pero el pedido en sí ya se persiste de verdad, no
-- solo en sessionStorage como hasta ahora (ver lib/checkout/lastOrder.ts).

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_email text not null,
  customer_name text not null,
  customer_phone text not null,
  fulfillment_type text not null check (fulfillment_type in ('pickup', 'local_delivery', 'foraneo')),
  -- Solo tiene sentido para local_delivery — null en los otros dos flujos.
  colonia text,
  -- null en pickup (no se pide dirección); jsonb libre en vez de columnas
  -- sueltas porque local_delivery y foraneo no comparten exactamente los
  -- mismos campos (foraneo agrega Estado, por ejemplo) y esto no necesita
  -- filtrarse/indexarse campo por campo, solo mostrarse en el detalle.
  shipping_address jsonb,
  shipping_cost numeric(10, 2) not null default 0,
  subtotal numeric(10, 2) not null,
  total numeric(10, 2) not null,
  status text not null default 'pagado' check (
    status in ('pendiente_pago', 'pagado', 'preparando', 'listo', 'enviado', 'entregado', 'cancelado')
  ),
  created_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_fulfillment_type_idx on public.orders (fulfillment_type);
create index if not exists orders_customer_email_idx on public.orders (customer_email);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Snapshot de cada producto comprado, tomado en el momento del pedido —
-- SIN referencia a products/product_variants a propósito: si el producto
-- se edita o se borra después, este renglón no debe cambiar ni romperse.
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_name text not null,
  variant_label text,
  sku text not null,
  unit_price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Sin política de insert pública en ninguna de las dos tablas: el único
-- camino para crear un pedido es public.create_order() (más abajo), que
-- inserta el pedido y sus renglones en una sola transacción y siempre fija
-- status = 'pagado' — nunca expone un parámetro para que el cliente elija
-- un status distinto, a diferencia de si hubiera una política de insert
-- directa sobre la tabla.
drop policy if exists "Los clientes ven sus propios pedidos" on public.orders;
create policy "Los clientes ven sus propios pedidos"
  on public.orders for select
  using (
    public.is_admin()
    or (auth.jwt() ->> 'email') = customer_email
  );

drop policy if exists "Los admins administran pedidos" on public.orders;
create policy "Los admins administran pedidos"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Los clientes ven los productos de sus propios pedidos" on public.order_items;
create policy "Los clientes ven los productos de sus propios pedidos"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (public.is_admin() or (auth.jwt() ->> 'email') = o.customer_email)
    )
  );

drop policy if exists "Los admins administran productos de pedidos" on public.order_items;
create policy "Los admins administran productos de pedidos"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- Crea un pedido completo (encabezado + renglones) en una sola
-- transacción — evita el estado a medias de "el pedido se creó pero sus
-- productos no" si algo falla a mitad de camino. security definer porque
-- no hay política de insert pública en ninguna de las dos tablas (ver
-- arriba): esta función es el único camino sancionado, y es la que decide
-- el order_number y fuerza status = 'pagado', nunca un valor que mande
-- quien llama.
-- p_items: arreglo jsonb de {product_name, variant_label, sku, unit_price,
-- quantity} — mismo shape que ya arma buildForaneoQuoteMessage/lastOrder.
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
begin
  if p_fulfillment_type not in ('pickup', 'local_delivery', 'foraneo') then
    raise exception 'fulfillment_type inválido: %', p_fulfillment_type;
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Un pedido necesita al menos un producto.';
  end if;

  -- Reintenta en el, en la práctica nunca alcanzado, caso de choque contra
  -- un order_number ya existente — mismo patrón que generate_referral_code
  -- (ver 20260910020000_profiles.sql).
  loop
    v_order_number := 'F57-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    exit when not exists (select 1 from public.orders where order_number = v_order_number);
  end loop;

  insert into public.orders (
    order_number, customer_email, customer_name, customer_phone,
    fulfillment_type, colonia, shipping_address, shipping_cost, subtotal, total, status
  ) values (
    v_order_number, p_customer_email, p_customer_name, p_customer_phone,
    p_fulfillment_type, p_colonia, p_shipping_address, p_shipping_cost, p_subtotal, p_total, 'pagado'
  )
  returning orders.id, orders.created_at into v_order_id, v_created_at;

  insert into public.order_items (order_id, product_name, variant_label, sku, unit_price, quantity)
  select
    v_order_id,
    item ->> 'product_name',
    item ->> 'variant_label',
    item ->> 'sku',
    (item ->> 'unit_price')::numeric,
    (item ->> 'quantity')::integer
  from jsonb_array_elements(p_items) as item;

  return query select v_order_id, v_order_number, v_created_at;
end;
$$;
