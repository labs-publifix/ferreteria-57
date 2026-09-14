-- Soporte para el dashboard de /admin (Inicio): fecha real de activación de
-- un producto y permiso de admin para leer la tabla completa de perfiles.

-- No se reutiliza updated_at para "activado en los últimos N días": esa
-- columna se toca en CUALQUIER edición (cambiar una descripción, por
-- ejemplo), no solo al activar, así que hubiera inflado la métrica con
-- productos simplemente editados. activated_at solo se escribe (desde la
-- app, ver lib/catalog/productWrite.ts y productos/actions.ts) cuando un
-- producto pasa de inactivo a activo — null mientras nunca se haya
-- activado.
alter table public.products add column if not exists activated_at timestamptz;

-- profiles solo tenía "cada quien lee su propia fila" (ver
-- 20260910020000_profiles.sql) — sin esto, un admin no puede ni siquiera
-- contar cuántos clientes hay registrados, porque RLS se aplica también a
-- consultas que corren con la sesión del admin logueado.
drop policy if exists "Los admins leen todos los perfiles" on public.profiles;
create policy "Los admins leen todos los perfiles"
  on public.profiles for select
  using (public.is_admin());
