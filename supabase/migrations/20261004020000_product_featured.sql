-- #11 Productos destacados desde el admin: antes el Home mostraba
-- simplemente los productos activos más recientes (ver comentario en
-- getFeaturedProducts, lib/catalog/queries.ts) — no existía ninguna noción
-- de "destacado" propia. featured_at (no solo un boolean) guarda CUÁNDO se
-- marcó, para poder ordenar el Home por "el más recientemente destacado
-- primero" en vez de un orden arbitrario entre varios destacados.
alter table public.products
  add column if not exists featured boolean not null default false,
  add column if not exists featured_at timestamptz;

-- Acelera "Solo destacados" en el admin y la consulta del Home — ambas
-- filtran por featured = true. Parcial (where featured) porque la
-- inmensa mayoría de filas nunca lo será; un índice completo desperdiciaría
-- espacio indexando también el false.
create index if not exists products_featured_idx
  on public.products (featured_at desc)
  where featured;
