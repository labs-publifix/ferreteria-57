-- Blog — Fase 4: registro de descargas de las guías PDF de Club 57.
-- Aditiva: solo crea esta tabla. Las guías no se guardan en ningún lado: el
-- PDF se genera al descargar (lib/blog/guide-pdf.ts); aquí queda una fila
-- por descarga exitosa, para:
--   * el límite por usuario (20 por hora, en /api/blog/guias/[slug]),
--   * la marca «Nueva» / «Descargada» de «Mis guías» en /cuenta,
--   * el conteo de descargas por tema en /admin/blog.
-- topic_id y slug son texto sin llave foránea: el contenido vive en el repo
-- (content/blog), no en la base.

create table if not exists public.blog_guide_downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null check (topic_id ~ '^B[0-9]{2,3}$'),
  slug text not null,
  downloaded_at timestamptz not null default now()
);

create index if not exists blog_guide_downloads_user_idx on public.blog_guide_downloads (user_id, downloaded_at desc);
create index if not exists blog_guide_downloads_topic_idx on public.blog_guide_downloads (topic_id);

-- Cada usuario inserta y lee solo las suyas; el admin lee todas. Nadie
-- edita ni borra (no hay políticas de update/delete).
alter table public.blog_guide_downloads enable row level security;

drop policy if exists "Cada usuario registra sus descargas de guías" on public.blog_guide_downloads;
create policy "Cada usuario registra sus descargas de guías"
  on public.blog_guide_downloads for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Cada usuario ve sus descargas de guías" on public.blog_guide_downloads;
create policy "Cada usuario ve sus descargas de guías"
  on public.blog_guide_downloads for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Los admins ven todas las descargas de guías" on public.blog_guide_downloads;
create policy "Los admins ven todas las descargas de guías"
  on public.blog_guide_downloads for select
  using (public.is_admin());

-- Conteo por tema para /admin/blog. security_invoker: corre con el RLS de
-- quien consulta (el admin ve todas; un usuario, solo las suyas).
create or replace view public.blog_guide_download_counts
with (security_invoker = true) as
  select topic_id, count(*)::integer as descargas
  from public.blog_guide_downloads
  group by topic_id;
