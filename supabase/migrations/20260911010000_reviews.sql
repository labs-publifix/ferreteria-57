-- Reseñas de producto, con cola de aprobación: nadie ve una reseña nueva
-- en el sitio público hasta que un admin la apruebe desde /admin/resenas.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists reviews_product_id_idx on public.reviews (product_id);
create index if not exists reviews_status_idx on public.reviews (status);

alter table public.reviews enable row level security;

-- Cualquiera (sin sesión) puede escribir una reseña, pero nunca elegir su
-- propio status: el "with check" bloquea a nivel de base cualquier intento
-- de insertar con status distinto de 'pending', sin importar qué mande el
-- cliente — la Server Action tampoco lee un status del formulario, pero
-- esta es la segunda capa independiente (mismo criterio de "nunca un solo
-- punto de verificación" del resto del proyecto).
drop policy if exists "Cualquiera escribe una reseña pendiente" on public.reviews;
create policy "Cualquiera escribe una reseña pendiente"
  on public.reviews for insert
  with check (status = 'pending');

drop policy if exists "Cualquiera lee reseñas aprobadas" on public.reviews;
create policy "Cualquiera lee reseñas aprobadas"
  on public.reviews for select
  using (status = 'approved' or public.is_admin());

drop policy if exists "Los admins administran reseñas" on public.reviews;
create policy "Los admins administran reseñas"
  on public.reviews for all
  using (public.is_admin())
  with check (public.is_admin());
