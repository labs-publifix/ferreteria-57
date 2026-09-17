-- Descuento de stock al confirmar un pedido (con protección real contra
-- sobreventa) + restauración de stock al cancelar un pedido desde el
-- admin, de forma idempotente ante clics repetidos.

-- order_items necesita saber de qué variante viene cada renglón para
-- poder restaurar su stock al cancelar — a propósito NO se usa para nada
-- de lo que ya se muestra (el snapshot sigue siendo product_name/
-- variant_label/sku/unit_price/quantity, inmune a que el catálogo
-- cambie). "on delete set null": si la variante se borra después, el
-- renglón del pedido no se rompe ni se borra, simplemente ya no hay a
-- quién restaurarle stock (ver update_order_status más abajo, que ya
-- contempla variant_id nulo).
alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants (id) on delete set null;

-- create_order(): igual que antes, pero ahora también recibe variant_id
-- por renglón y descuenta stock ANTES de crear el pedido. El UPDATE es
-- condicional (stock >= cantidad) y se revisa cuántas filas afectó: si
-- dos compras casi simultáneas agotan el mismo producto, la segunda
-- transacción queda bloqueada por el row lock de la primera hasta que
-- esta confirma o revierte, y al reintentar su condición ya no se cumple
-- contra el stock actualizado — nunca deja stock negativo. Si cualquier
-- renglón no tiene stock suficiente, se lanza una excepción que revierte
-- TODA la función (incluyendo los descuentos ya aplicados a renglones
-- anteriores en este mismo loop, porque toda la función corre en una sola
-- transacción) — no se crea ningún pedido.
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

    update public.product_variants
    set stock = stock - v_quantity
    where id = v_variant_id and stock >= v_quantity;

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

  return query select v_order_id, v_order_number, v_created_at;
end;
$$;

-- Único camino sancionado para que un admin cambie el estatus de un
-- pedido — reemplaza el UPDATE directo que hacía antes la Server Action.
-- security definer: no hay política de UPDATE pública sobre orders para
-- clientes, así que esta función es la que necesita saltarse RLS; por eso
-- valida is_admin() ella misma (nunca confía en que solo la llamen desde
-- un contexto ya autorizado, a diferencia de create_order que sí es
-- público a propósito).
--
-- p_expected_status blinda contra dos clics casi simultáneos en
-- "Cancelar" (o cualquier cambio de estatus): el SELECT ... FOR UPDATE
-- bloquea la fila del pedido, así que la segunda llamada concurrente
-- espera a que la primera termine y luego ve el estatus YA actualizado —
-- si ya no coincide con el que esperaba, se rechaza sin volver a tocar
-- nada (nunca restaura el stock dos veces).
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
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;

  select status into v_current_status from public.orders where id = p_order_id for update;

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
  end if;
end;
$$;
