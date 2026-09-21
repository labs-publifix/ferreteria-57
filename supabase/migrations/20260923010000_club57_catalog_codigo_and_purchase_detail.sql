-- Club 57 — ajustes tras revisión del preview:
-- 1) El importador del catálogo de canje leía "Codigo" (el numérico de
--    Truper, ej. 68069) del Excel pero nunca lo guardaba — solo persistía
--    "Clave". Se usa para localizar la imagen en el catálogo de Truper, así
--    que hace falta tanto la columna como el backfill de los 57 artículos
--    que ya se importaron con este hueco.
-- 2) "Registrar compra en tienda" solo pedía un monto — se agregan
--    producto y código (SKU) para que el registro capture lo mismo que un
--    pedido real (product_name/sku en order_items), sin construir un
--    carrito multi-línea que nadie pidió.

alter table public.club57_redemption_catalog
  add column if not exists codigo text;

alter table public.club57_points_ledger
  add column if not exists producto_nombre text,
  add column if not exists producto_sku text;

-- Backfill: mapeo Clave -> Código tomado directo del Excel real que ya se
-- importó (Codigos_Promocionales_.xlsx, 57 filas) — solo toca los
-- artículos de Club 57 cuyo `clave` coincide, nunca products/order_items.
-- Seguro de correr más de una vez: siempre deja el mismo valor.
update public.club57_redemption_catalog as c
set codigo = v.codigo
from (values
  ('CHAM-NC-M', '68069'), ('CHAM-NC-G', '68070'), ('CHAM-NC-XG', '68071'),
  ('CHAM-ND-CH', '68072'), ('CHAM-ND-M', '68073'), ('CHAM-ND-G', '68074'),
  ('CHAM-GC-CH', '66000'), ('CHAM-GC-M', '66001'), ('CHAM-GC-G', '66002'), ('CHAM-GC-XG', '66003'),
  ('CHAM-GD-CH', '66004'), ('CHAM-GD-M', '66005'), ('CHAM-GD-G', '66006'),
  ('CHA-GC-C', '69996'), ('CHA-GC-M', '69997'), ('CHA-GC-G', '69998'), ('CHA-GC-XG', '65009'),
  ('CHA-GD-C', '69993'), ('CHA-GD-M', '69994'), ('CHA-GD-G', '69995'),
  ('BAG-55', '61095'), ('BAG-66', '68036'), ('BAG-75', '61097'), ('BAG-90', '61018'),
  ('MARO-20', '62140'), ('MAL-TOP', '60179'), ('SAV-60', '68037'),
  ('MOLTA-N2', '68038'), ('MOLTA-N', '67022'), ('BOLTA-N', '67021'),
  ('HIEL-45X', '68002'), ('HIEL-30X', '68012'), ('HIEL-46', '62129'), ('HIEL-9', '62121'), ('HIEL-5', '68001'),
  ('TERMO-18', '62125'), ('TERMO-04', '62100'), ('TERMO-07A', '62126'),
  ('CILI-25', '65030'), ('LUNCH-3', '66076'), ('SILLA-30', '61025'),
  ('PARAG-95', '66074'), ('PARAG-130', '65012'), ('PSOL-135', '62080'), ('TOL-3', '66075'),
  ('BRJ-40', '61138'), ('BRJ-54', '60141'), ('DOM-TR', '60136'),
  ('CALC-12B', '60480'), ('CALC-15E', '60481'), ('CALC-19E', '60482'),
  ('CPG-42', '68013'), ('MPAD-10', '62015'),
  ('BANCO', '51574'), ('VITRO-G', '55950'), ('CANGA-100', '43369'), ('PLUMA', '60065')
) as v(clave, codigo)
where c.clave = v.clave;
