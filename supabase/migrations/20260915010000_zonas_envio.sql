-- Costo de envío local por colonia (Querétaro), para el checkout de 3
-- modalidades (retiro / envío local / envío foráneo). Los datos reales
-- (230+ colonias) se cargan aparte con scripts/seed-zonas-envio.mjs desde
-- supabase/seed/zonas-envio.csv — esta migración solo crea la tabla vacía.

create table if not exists public.zonas_envio (
  colonia text primary key,
  municipio text,
  zona integer,
  costo_envio_mxn numeric(10, 2) not null,
  confianza text
);

-- Tres filas de esta tabla son constantes de negocio, no colonias reales
-- (ver lib/checkout/constants.ts, que las excluye del combobox):
--   __PICKUP_TIENDA__  costo 0, solo de referencia, nunca se usa para envío.
--   __NO_LISTADA__     costo 169, cuando el cliente no encuentra su colonia.
--   __FORANEO__        costo 250, fijo para el flujo 3 (no depende de colonia).
-- Viven en la misma tabla (no en una tabla de "casos especiales" aparte)
-- porque el seed las trae ya así desde el CSV y el resto del negocio las
-- trata como "costos de envío conocidos", igual que cualquier colonia.

alter table public.zonas_envio enable row level security;

-- Lectura pública sin restricción: el checkout necesita consultar el costo
-- de envío ANTES de que el cliente inicie sesión (no hay flujo de login
-- obligatorio para comprar) — mismo criterio que categories/products.
drop policy if exists "Cualquiera lee zonas de envío" on public.zonas_envio;
create policy "Cualquiera lee zonas de envío"
  on public.zonas_envio for select
  using (true);

drop policy if exists "Los admins administran zonas de envío" on public.zonas_envio;
create policy "Los admins administran zonas de envío"
  on public.zonas_envio for all
  using (public.is_admin())
  with check (public.is_admin());
