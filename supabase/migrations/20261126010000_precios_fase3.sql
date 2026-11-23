-- Precios · Fase 3: listas de precio para miembros de Club 57.
--
-- 1) club57_cambios_lista_precio: bitácora de cada asignación (quién, cuándo,
--    de qué lista a cuál). null = precio de tienda.
-- 2) club57_asignar_lista_precio(miembro, lista): admin y operador.
-- 3) precio_para(): un miembro con lista paga el MENOR entre su lista y el
--    precio de tienda — nunca más que el público.
-- 4) tengo_precio_club57() y mis_precios_club57(ids): el sitio pregunta,
--    para los productos en pantalla, el precio de quien tiene la sesión
--    abierta. Solo devuelven precios, nunca el número de lista.
-- 5) club57_precio_para_miembro(miembro, producto, código): el personal
--    pre-llena la compra en tienda con el precio del miembro.
--
-- No cambia datos al correrse: ningún miembro tiene lista todavía.
-- Idempotente: se puede correr más de una vez.

-- ---------------------------------------------------------------------
-- 1) Bitácora
-- ---------------------------------------------------------------------
create table if not exists public.club57_cambios_lista_precio (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.club57_members (id) on delete cascade,
  lista_anterior smallint check (lista_anterior is null or lista_anterior between 1 and 4),
  lista_nueva smallint check (lista_nueva is null or lista_nueva between 1 and 4),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_rol text not null check (actor_rol in ('admin', 'operador')),
  created_at timestamptz not null default now()
);

create index if not exists club57_cambios_lista_precio_member_idx
  on public.club57_cambios_lista_precio (member_id, created_at desc);

alter table public.club57_cambios_lista_precio enable row level security;

drop policy if exists "El personal lee los cambios de lista de precio" on public.club57_cambios_lista_precio;
create policy "El personal lee los cambios de lista de precio"
  on public.club57_cambios_lista_precio for select
  using (public.is_admin());

create index if not exists club57_members_lista_precio_idx
  on public.club57_members (lista_precio)
  where lista_precio is not null;

-- ---------------------------------------------------------------------
-- 2) Asignar o quitar la lista de un miembro
-- ---------------------------------------------------------------------
create or replace function public.club57_asignar_lista_precio(p_member_id uuid, p_lista smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actual smallint;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;
  if p_lista is not null and p_lista not between 1 and 4 then
    raise exception 'Lista inválida.';
  end if;

  select lista_precio into v_actual
  from public.club57_members
  where id = p_member_id
  for update;

  if not found then
    raise exception 'Cliente no encontrado.';
  end if;

  if v_actual is not distinct from p_lista then
    raise exception 'El cliente ya tiene esa lista.';
  end if;

  update public.club57_members set lista_precio = p_lista where id = p_member_id;

  insert into public.club57_cambios_lista_precio (member_id, lista_anterior, lista_nueva, actor_id, actor_rol)
  values (p_member_id, v_actual, p_lista, auth.uid(), public.current_staff_role());
end;
$$;

revoke all on function public.club57_asignar_lista_precio(uuid, smallint) from public, anon;
grant execute on function public.club57_asignar_lista_precio(uuid, smallint) to authenticated;

-- ---------------------------------------------------------------------
-- 3) Precio que le corresponde a una persona: el menor entre su lista y el
--    precio de tienda (si su lista fuera más alta, paga el de tienda).
-- ---------------------------------------------------------------------
create or replace function public.precio_para(p_variant_id uuid, p_user uuid)
returns numeric
language sql
security definer
set search_path = public
stable
as $$
  select case
    when m.lista_precio is not null and l.variant_id is not null
      then least(public.precio_de_lista(l, m.lista_precio), pv.price)
    else pv.price
  end
  from public.product_variants pv
  left join public.product_price_levels l on l.variant_id = pv.id
  left join public.club57_members m on p_user is not null and m.id = p_user
  where pv.id = p_variant_id;
$$;

revoke execute on function public.precio_para(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) Precios Club 57 de quien tiene la sesión abierta
-- ---------------------------------------------------------------------
create or replace function public.tengo_precio_club57()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.club57_members m
    where m.id = auth.uid() and m.lista_precio is not null
  );
$$;

revoke all on function public.tengo_precio_club57() from public, anon;
grant execute on function public.tengo_precio_club57() to authenticated;

-- Solo regresa las presentaciones activas donde el precio del miembro es
-- menor que el de tienda. Máximo 500 por consulta.
create or replace function public.mis_precios_club57(p_variant_ids uuid[])
returns table (variant_id uuid, precio numeric)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null or p_variant_ids is null then
    return;
  end if;
  if coalesce(array_length(p_variant_ids, 1), 0) > 500 then
    raise exception 'Demasiados productos en una sola consulta.';
  end if;

  return query
  select pv.id, public.precio_para(pv.id, auth.uid())
  from public.product_variants pv
  join public.products p on p.id = pv.product_id and p.active
  where pv.id = any (p_variant_ids)
    and public.precio_para(pv.id, auth.uid()) < pv.price;
end;
$$;

revoke all on function public.mis_precios_club57(uuid[]) from public, anon;
grant execute on function public.mis_precios_club57(uuid[]) to authenticated;

-- ---------------------------------------------------------------------
-- 5) Compra en tienda: precio del miembro para el producto elegido.
--    Admin y operador para cualquiera; el vendedor solo para sus clientes.
--    Busca la presentación por código (SKU); si no, la primera.
-- ---------------------------------------------------------------------
create or replace function public.club57_precio_para_miembro(p_member_id uuid, p_product_id uuid, p_sku text)
returns table (precio numeric, precio_tienda numeric)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_variant uuid;
begin
  if not (
    public.is_admin()
    or exists (
      select 1 from public.club57_members m
      where m.id = p_member_id and m.creado_por_vendedor_id = auth.uid() and public.is_vendedor()
    )
  ) then
    raise exception 'No autorizado.';
  end if;

  select pv.id into v_variant
  from public.product_variants pv
  where pv.product_id = p_product_id
  order by (p_sku is not null and pv.sku = p_sku) desc, pv.position, pv.created_at
  limit 1;

  if v_variant is null then
    return;
  end if;

  return query
  select public.precio_para(v_variant, p_member_id), pv.price
  from public.product_variants pv
  where pv.id = v_variant;
end;
$$;

revoke all on function public.club57_precio_para_miembro(uuid, uuid, text) from public, anon;
grant execute on function public.club57_precio_para_miembro(uuid, uuid, text) to authenticated;
