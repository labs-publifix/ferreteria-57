-- Buscador global en vivo: extensiones + funciones de normalización +
-- índices trigram + RPC search_products(). Todo idempotente (create or
-- replace / if not exists) para poder volver a correr esta migración sin
-- duplicar nada.

create extension if not exists unaccent;
create extension if not exists pg_trgm;

-- unaccent() de la extensión es STABLE, no IMMUTABLE (depende de la
-- configuración de diccionario) — Postgres no deja usar una función
-- STABLE dentro de un índice de expresión. Este wrapper se declara
-- IMMUTABLE, que es seguro aquí porque el resultado nunca depende de
-- configuración de sesión (siempre el mismo diccionario por default).
-- Usa la forma de un solo argumento (diccionario 'unaccent' implícito)
-- en vez de unaccent('unaccent', texto): esa segunda forma requiere que
-- Postgres resuelva el literal 'unaccent' contra el tipo regdictionary,
-- lo cual falla con "function unaccent(unknown, text) does not exist"
-- si el search_path de la función no ve el esquema donde vive la
-- extensión. Supabase instala unaccent/pg_trgm en el esquema
-- `extensions` (no en `public`) — de ahí el search_path explícito que
-- cubre ambos esquemas, sin depender de dónde haya quedado instalada la
-- extensión en cada proyecto.
create or replace function public.f57_unaccent(text)
returns text
language sql
immutable
parallel safe
set search_path = public, extensions
as $$
  select unaccent(coalesce($1, ''));
$$;

-- Minúsculas + sin acentos — la normalización base para comparar nombre,
-- marca y categoría sin que "Martillo" y "martillo", o "Bisagra" y
-- "Bisagra" (con/sin tilde), cuenten como distintos.
create or replace function public.f57_search_normalize(text)
returns text
language sql
immutable
parallel safe
as $$
  select lower(public.f57_unaccent($1));
$$;

-- Para clave/SKU: además de f57_search_normalize, quita espacios, guiones
-- y puntos — así "CLA-100", "cla100" y "cla 100" normalizan al mismo
-- valor. \s escapado como \\s dentro del literal de PL/SQL.
create or replace function public.f57_code_normalize(text)
returns text
language sql
immutable
parallel safe
as $$
  select regexp_replace(public.f57_search_normalize($1), '[-.\s]', '', 'g');
$$;

-- Índices trigram (GIN) — aceleran tanto ILIKE '%...%' como la función
-- similarity() usada para ordenar resultados por relevancia. Los de
-- products.clave/product_variants.sku usan f57_code_normalize (código);
-- el resto usa f57_search_normalize (texto libre).
create index if not exists products_name_trgm_idx
  on public.products using gin (public.f57_search_normalize(name) gin_trgm_ops);

create index if not exists products_brand_trgm_idx
  on public.products using gin (public.f57_search_normalize(brand) gin_trgm_ops);

create index if not exists products_clave_code_trgm_idx
  on public.products using gin (public.f57_code_normalize(clave) gin_trgm_ops)
  where clave is not null;

create index if not exists product_variants_sku_code_trgm_idx
  on public.product_variants using gin (public.f57_code_normalize(sku) gin_trgm_ops);

create index if not exists categories_name_trgm_idx
  on public.categories using gin (public.f57_search_normalize(name) gin_trgm_ops);

-- search_products(): un solo RPC para el desplegable en vivo del Header Y
-- para /buscar (reemplaza el ilike manual de lib/catalog/queries.ts,
-- searchProducts() pasa a llamar esto). SECURITY INVOKER (default) porque
-- solo lee lo que ya es público vía RLS (productos activos) — no necesita
-- saltarse ninguna política.
--
-- Ranking en 3 niveles (prioridad ascendente = más relevante primero):
--   1: coincidencia EXACTA de clave o de sku de alguna variante
--   2: coincidencia por PREFIJO de clave o sku
--   3: coincidencia de texto libre en nombre/marca/categoría, ordenada
--      dentro del nivel por similarity() trigram
-- Los niveles 1-2 solo aplican si el término (sin espacios/guiones/puntos)
-- no quedó vacío; el nivel 3 solo aplica si el término normalizado tiene
-- al menos 2 caracteres — así "1" busca códigos pero no dispara un
-- escaneo de texto libre de una letra sobre todo el catálogo.
create or replace function public.search_products(p_query text, p_limit integer default 8)
returns table (
  id uuid,
  slug text,
  name text,
  brand text,
  clave text,
  sku text,
  price numeric,
  compare_at_price numeric,
  image_url text,
  category_name text,
  in_stock boolean
)
language sql
stable
as $$
  with q as (
    select
      public.f57_search_normalize(p_query) as text_q,
      public.f57_code_normalize(p_query) as code_q
  ),
  candidates as (
    select p.id, 1 as priority, 1.0::real as sim
    from public.products p, q
    where p.active
      and q.code_q <> ''
      and public.f57_code_normalize(p.clave) = q.code_q

    union all

    select p.id, 1, 1.0
    from public.products p
    join public.product_variants v on v.product_id = p.id, q
    where p.active
      and q.code_q <> ''
      and public.f57_code_normalize(v.sku) = q.code_q

    union all

    select p.id, 2, 0.9
    from public.products p, q
    where p.active
      and q.code_q <> ''
      and public.f57_code_normalize(p.clave) like q.code_q || '%'

    union all

    select p.id, 2, 0.9
    from public.products p
    join public.product_variants v on v.product_id = p.id, q
    where p.active
      and q.code_q <> ''
      and public.f57_code_normalize(v.sku) like q.code_q || '%'

    union all

    select
      p.id, 3,
      greatest(
        similarity(public.f57_search_normalize(p.name), q.text_q),
        similarity(public.f57_search_normalize(p.brand), q.text_q),
        similarity(public.f57_search_normalize(c.name), q.text_q)
      )
    from public.products p
    join public.categories c on c.id = p.category_id, q
    where p.active
      and char_length(q.text_q) >= 2
      and (
        public.f57_search_normalize(p.name) like '%' || q.text_q || '%'
        or public.f57_search_normalize(p.brand) like '%' || q.text_q || '%'
        or public.f57_search_normalize(c.name) like '%' || q.text_q || '%'
      )
  ),
  ranked as (
    select id, min(priority) as best_priority, max(sim) as best_sim
    from candidates
    group by id
  )
  select
    p.id, p.slug, p.name, p.brand, p.clave,
    v.sku, v.price, v.compare_at_price,
    (case when array_length(p.images, 1) > 0 then p.images[1] else null end) as image_url,
    c.name as category_name,
    (v.stock > 0) as in_stock
  from ranked r
  join public.products p on p.id = r.id
  join public.categories c on c.id = p.category_id
  left join lateral (
    select sku, price, compare_at_price, stock
    from public.product_variants pv
    where pv.product_id = p.id
    order by pv.position asc
    limit 1
  ) v on true
  order by r.best_priority asc, r.best_sim desc, p.name asc
  limit least(greatest(p_limit, 1), 50);
$$;

grant execute on function public.search_products(text, integer) to anon, authenticated;
