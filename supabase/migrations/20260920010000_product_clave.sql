-- "Clave": código corto alfanumérico interno del cliente (ej. "MSK-1-1/2"),
-- distinto del Código/SKU que ya vive en product_variants. A nivel
-- PRODUCTO (no varía por presentación) — por eso vive en products, no en
-- product_variants.
alter table public.products
  add column if not exists clave text;
