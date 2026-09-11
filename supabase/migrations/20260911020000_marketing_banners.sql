-- Top Banner (announcement bar) y Promo Banners (riel de tarjetas del
-- Home): ambos comparten la misma lógica de vigencia (fecha
-- inicio/fin opcional) — cuando hay fechas, mandan ellas solas sobre si
-- se ve o no; el toggle activo/inactivo solo decide cuando NO hay
-- fechas. Así un admin puede programar una campaña una sola vez (fechas)
-- sin tener que acordarse de también prender/apagar el toggle alrededor
-- de esas fechas.

-- Top Banner: configuración única (una sola fila) — el "id boolean
-- primary key default true" es el truco estándar de Postgres para
-- garantizar a nivel de base que nunca pueda existir más de una fila.
create table if not exists public.top_banner_config (
  id boolean primary key default true,
  message text not null default '',
  color_theme text not null default 'pizarra' check (color_theme in ('pizarra', 'naranja', 'negro')),
  href text,
  starts_at date,
  ends_at date,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint top_banner_config_singleton check (id)
);

-- Semilla con el texto real que hoy vive hardcodeado en Header.tsx, para
-- que el sitio público no cambie de nada hasta que un admin edite algo
-- desde /admin/top-banner.
insert into public.top_banner_config (id, message, color_theme, href, active)
values (
  true,
  'Envío gratis en compras mayores a $950 MXN — Atención a clientes: 442 778 2708',
  'pizarra',
  'tel:+524427782708',
  true
)
on conflict (id) do nothing;

alter table public.top_banner_config enable row level security;

-- Lectura pública sin restricción: no hay nada sensible en el texto de un
-- banner, y calcular "¿está vigente ahora?" es más simple hecho en la
-- app (mismo criterio que categories/products.active) que replicado dos
-- veces en una política de RLS con fechas.
drop policy if exists "Cualquiera lee la configuración del top banner" on public.top_banner_config;
create policy "Cualquiera lee la configuración del top banner"
  on public.top_banner_config for select
  using (true);

drop policy if exists "Los admins administran el top banner" on public.top_banner_config;
create policy "Los admins administran el top banner"
  on public.top_banner_config for all
  using (public.is_admin())
  with check (public.is_admin());

-- Promo Banners: varias tarjetas, sin distinción de datos entre
-- "evergreen" y "de campaña" — una tarjeta sin ends_at es simplemente
-- permanente. Los checks de longitud replican a nivel de base los
-- mismos máximos que el formulario del admin ya impide superar al
-- escribir (segunda capa independiente, mismo criterio que el resto del
-- proyecto).
create table if not exists public.promo_banners (
  id uuid primary key default gen_random_uuid(),
  eyebrow text check (char_length(eyebrow) <= 20),
  title text not null check (char_length(title) <= 35),
  subtitle text check (char_length(subtitle) <= 60),
  fineprint text check (char_length(fineprint) <= 40),
  href text not null,
  color_theme text not null check (color_theme in ('naranja', 'pizarra', 'negro', 'claro')),
  image_url text,
  position integer not null default 0,
  starts_at date,
  ends_at date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists promo_banners_position_idx on public.promo_banners (position);

alter table public.promo_banners enable row level security;

drop policy if exists "Cualquiera lee promo banners" on public.promo_banners;
create policy "Cualquiera lee promo banners"
  on public.promo_banners for select
  using (true);

drop policy if exists "Los admins administran promo banners" on public.promo_banners;
create policy "Los admins administran promo banners"
  on public.promo_banners for all
  using (public.is_admin())
  with check (public.is_admin());

-- Storage: bucket propio para imágenes de promo banners, mismo patrón que
-- product-images (público para lectura, solo admin para escritura) pero
-- separado del de productos — son activos de marketing, no fotografía de
-- catálogo, y conviene poder administrarlos/limpiarlos por separado.
insert into storage.buckets (id, name, public)
values ('promo-images', 'promo-images', true)
on conflict (id) do nothing;

drop policy if exists "Cualquiera lee imágenes de promo banners" on storage.objects;
create policy "Cualquiera lee imágenes de promo banners"
  on storage.objects for select
  using (bucket_id = 'promo-images');

drop policy if exists "Los admins suben imágenes de promo banners" on storage.objects;
create policy "Los admins suben imágenes de promo banners"
  on storage.objects for insert
  with check (bucket_id = 'promo-images' and public.is_admin());

drop policy if exists "Los admins actualizan imágenes de promo banners" on storage.objects;
create policy "Los admins actualizan imágenes de promo banners"
  on storage.objects for update
  using (bucket_id = 'promo-images' and public.is_admin());

drop policy if exists "Los admins borran imágenes de promo banners" on storage.objects;
create policy "Los admins borran imágenes de promo banners"
  on storage.objects for delete
  using (bucket_id = 'promo-images' and public.is_admin());
