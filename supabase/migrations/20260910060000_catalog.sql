-- Catálogo real: categorías, productos y sus variantes (presentaciones).
-- Reemplaza /lib/mock-data/products.ts y el arreglo estático de
-- /lib/navigation/categories.ts — el sitio público y el panel de admin
-- leen de aquí.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  -- Nombre del ícono de lucide-react (ej. "Wrench"), no el label en
  -- español: así un admin puede renombrar la categoría sin que el ícono
  -- se desvincule (el Home lo hacía antes justo así, indexado por label).
  icon text not null,
  -- Orden simple, no drag-and-drop: un número más chico va primero.
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  -- on delete restrict: refuerza a nivel de base de datos la regla de "no
  -- se puede borrar una categoría con productos" — la app ya valida esto
  -- antes de intentar el delete (mensaje claro), esto es el resguardo si
  -- algo la rodeara.
  category_id uuid not null references public.categories (id) on delete restrict,
  slug text not null unique,
  name text not null,
  brand text not null,
  short_description text not null default '',
  -- Arreglo de { label, value } — igual que TechnicalSpec en
  -- types/catalog.ts, sin tabla aparte porque no se consulta ni se filtra
  -- por spec individual en ningún lugar del sitio.
  technical_specs jsonb not null default '[]',
  -- URLs públicas de Supabase Storage, en el orden en que se muestran en
  -- la galería. Arreglo simple (no tabla aparte): no hay metadata por
  -- imagen (alt text, etc.) que justifique una fila propia.
  images text[] not null default '{}',
  -- Ficha técnica completa del fabricante (Truper u otra marca hermana),
  -- opcional — botón "Ver ficha técnica completa" en /producto/[slug].
  spec_sheet_url text,
  -- Nace inactivo por default: un producto a medio capturar no debe
  -- verse en la tienda hasta que el admin lo revise y lo active.
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products (category_id);

-- Precio, precio de comparación, stock y SKU viven en la variante, no en
-- el producto — un producto puede tener más de una presentación (medida,
-- capacidad, batería, etc.), cada una con su propio precio/stock. Todo
-- producto tiene al menos una variante, aunque solo tenga una
-- presentación ("Único") — el formulario del admin la integra en la
-- misma pantalla en vez de mandar a una pantalla aparte.
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  label text not null default 'Único',
  price numeric(10, 2) not null,
  compare_at_price numeric(10, 2),
  stock integer not null default 0,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

-- RLS: lectura pública de lo activo para cualquiera (incluido un
-- visitante sin sesión, rol 'anon'), lectura+escritura de todo
-- (activo/inactivo, alta/edición/baja) restringida a is_admin() — la
-- misma función que ya protege /admin (ver migración de roles).
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;

drop policy if exists "Cualquiera lee categorías activas" on public.categories;
create policy "Cualquiera lee categorías activas"
  on public.categories for select
  using (active = true or public.is_admin());

drop policy if exists "Los admins administran categorías" on public.categories;
create policy "Los admins administran categorías"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Cualquiera lee productos activos" on public.products;
create policy "Cualquiera lee productos activos"
  on public.products for select
  using (active = true or public.is_admin());

drop policy if exists "Los admins administran productos" on public.products;
create policy "Los admins administran productos"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- Las variantes no tienen su propio active: su visibilidad sigue a la del
-- producto dueño. Se consulta por join en el sitio público, pero la
-- política tiene que sostenerse por sí sola — alguien podría consultar
-- product_variants directo vía la API.
drop policy if exists "Cualquiera lee variantes de productos activos" on public.product_variants;
create policy "Cualquiera lee variantes de productos activos"
  on public.product_variants for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id
        and (p.active = true or public.is_admin())
    )
  );

drop policy if exists "Los admins administran variantes" on public.product_variants;
create policy "Los admins administran variantes"
  on public.product_variants for all
  using (public.is_admin())
  with check (public.is_admin());

-- Storage: bucket público para imágenes de producto. "público" a nivel de
-- bucket sirve las imágenes ya subidas por URL directa sin necesitar
-- sesión (así se ven en la tienda) — las políticas de abajo sobre
-- storage.objects son la capa que de verdad decide quién puede subir,
-- actualizar o borrar.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Sin "alter table storage.objects enable row level security": esa tabla
-- ya trae RLS activo por default en todo proyecto de Supabase, y en
-- algunos proyectos el rol que corre el SQL Editor no es "owner" de esa
-- tabla — intentar la línea de arriba puede fallar por permisos y, al
-- correr como parte de un solo script, revertir TODO lo anterior
-- (categorías y productos incluidos) con ese error.

drop policy if exists "Cualquiera lee imágenes de productos" on storage.objects;
create policy "Cualquiera lee imágenes de productos"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Los admins suben imágenes de productos" on storage.objects;
create policy "Los admins suben imágenes de productos"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Los admins actualizan imágenes de productos" on storage.objects;
create policy "Los admins actualizan imágenes de productos"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Los admins borran imágenes de productos" on storage.objects;
create policy "Los admins borran imágenes de productos"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
