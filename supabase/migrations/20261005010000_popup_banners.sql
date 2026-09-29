-- Pop-Up Banner: tarjeta promocional discreta (esquina inferior izquierda,
-- NO un modal) que el equipo de Club 57 programa desde /admin/pop-up-banner
-- cuando lanzan una promoción. Módulo nuevo, sin relación con
-- top_banner_config/promo_banners (20260911020000_marketing_banners.sql) —
-- mismo espíritu (contenido de marketing con vigencia por fechas) pero con
-- requisitos de privacidad más estrictos (ver política de lectura pública
-- más abajo) y granularidad de MINUTO en la vigencia (timestamptz, no
-- date) porque este banner puede programarse a pocos minutos de
-- diferencia, no solo por día.
create table if not exists public.popup_banners (
  id uuid primary key default gen_random_uuid(),
  -- Solo para identificarlo en el listado del admin — nunca se expone al
  -- público (ver popup_banners_public más abajo).
  nombre text not null check (char_length(nombre) <= 60),
  titulo text not null check (char_length(titulo) <= 35),
  texto text not null check (char_length(texto) <= 100),
  cta_label text check (char_length(cta_label) <= 20),
  cta_url text,
  tipo_fondo text not null default 'solido' check (tipo_fondo in ('solido', 'imagen')),
  color_fondo text not null default '#1A1A1A',
  color_texto text not null default '#FFFFFF',
  color_boton text not null default '#FF6A00',
  color_texto_boton text not null default '#1A1A1A',
  imagen_url text,
  texto_alternativo text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  activo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint popup_banners_fechas_orden check (ends_at > starts_at),
  -- Texto alternativo obligatorio SOLO cuando hay imagen — un banner de
  -- fondo sólido no tiene nada que describir.
  constraint popup_banners_alt_si_imagen check (imagen_url is null or texto_alternativo is not null)
);

create index if not exists popup_banners_vigencia_idx on public.popup_banners (starts_at, ends_at) where activo;

alter table public.popup_banners enable row level security;

-- A diferencia de top_banner_config/promo_banners (RLS "using (true)",
-- visibilidad calculada solo en la app — ver el comentario en
-- 20260911020000_marketing_banners.sql líneas 39-42), aquí el cliente pidió
-- explícitamente que un anónimo NO pueda leer borradores/banners fuera de
-- su ventana. RLS es a nivel de FILA, no de columna, así que "solo los
-- campos necesarios" no se puede lograr con una policy sola: la tabla base
-- se cierra por completo a lectura pública (solo admin), y
-- popup_banners_public (vista, definida abajo) es el único camino de
-- lectura para el sitio — ahí sí se filtra la ventana de vigencia Y se
-- proyectan solo las columnas que el widget necesita (nunca "nombre").
drop policy if exists "Solo admins leen popup banners" on public.popup_banners;
create policy "Solo admins leen popup banners"
  on public.popup_banners for select
  using (public.is_admin());

drop policy if exists "Los admins administran popup banners" on public.popup_banners;
create policy "Los admins administran popup banners"
  on public.popup_banners for all
  using (public.is_admin())
  with check (public.is_admin());

-- Vista pública: una vista normal en Postgres corre con los privilegios de
-- su DUEÑO (quien la crea aquí, el rol de la migración) para el chequeo de
-- RLS de la tabla subyacente — por eso puede devolver filas de una tabla
-- que le niega SELECT directo a anon/authenticated, siempre que su propio
-- WHERE ya filtre lo que es seguro exponer. "order by ... limit 1" es una
-- segunda capa de la regla "solo un banner vigente a la vez": la
-- verificación real ocurre al guardar (ver createPopupBanner/
-- updatePopupBanner, que rechazan traslapes — validación a nivel
-- aplicación, no aquí; ver el comentario ahí sobre por qué), pero esta
-- vista garantiza que aunque alguna vez existieran dos filas vigentes al
-- mismo tiempo (p. ej. por una carrera entre dos guardados simultáneos),
-- el sitio público nunca muestre más de uno.
create or replace view public.popup_banners_public as
select
  id,
  titulo,
  texto,
  cta_label,
  cta_url,
  tipo_fondo,
  color_fondo,
  color_texto,
  color_boton,
  color_texto_boton,
  imagen_url,
  texto_alternativo,
  updated_at
from public.popup_banners
where activo and now() between starts_at and ends_at
order by updated_at desc
limit 1;

grant select on public.popup_banners_public to anon, authenticated;

-- Storage: bucket propio, mismo patrón de 4 políticas que promo-images
-- (20260911020000_marketing_banners.sql líneas 91-117) — separado por
-- convención del proyecto (un bucket por tipo de activo de marketing, no
-- compartido).
insert into storage.buckets (id, name, public)
values ('popup-images', 'popup-images', true)
on conflict (id) do nothing;

drop policy if exists "Cualquiera lee imágenes de popup banners" on storage.objects;
create policy "Cualquiera lee imágenes de popup banners"
  on storage.objects for select
  using (bucket_id = 'popup-images');

drop policy if exists "Los admins suben imágenes de popup banners" on storage.objects;
create policy "Los admins suben imágenes de popup banners"
  on storage.objects for insert
  with check (bucket_id = 'popup-images' and public.is_admin());

drop policy if exists "Los admins actualizan imágenes de popup banners" on storage.objects;
create policy "Los admins actualizan imágenes de popup banners"
  on storage.objects for update
  using (bucket_id = 'popup-images' and public.is_admin());

drop policy if exists "Los admins borran imágenes de popup banners" on storage.objects;
create policy "Los admins borran imágenes de popup banners"
  on storage.objects for delete
  using (bucket_id = 'popup-images' and public.is_admin());
