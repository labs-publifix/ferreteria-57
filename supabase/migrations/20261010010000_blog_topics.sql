-- Blog — Fase 1: backlog editorial de temas, solo para el panel de admin
-- (/admin/blog, vista de lectura). Los datos se cargan aparte con
-- scripts/seed-blog-backlog.mjs desde supabase/seed/blog-backlog.csv —
-- esta migración solo crea la tabla vacía. Aditiva: no toca nada existente.
--
--   * No hay columna de estado publicado/programado: se DERIVA en
--     lib/blog/topic-status.ts a partir del registro de artículos (Fase 3).
--     Lo único que se guarda es el descarte manual (borrado lógico).
--   * fecha_programada es `date` (día de calendario, sin hora ni zona
--     horaria): se muestra tal cual, sin convertir.
--   * `lote` permite cargar un segundo backlog (lote 2) con el mismo seed
--     sin tocar las filas del lote 1 (el upsert es por id).

create table if not exists public.blog_topics (
  id text primary key,
  orden integer not null,
  lote integer not null default 1,
  etapa text,
  fecha_programada date,
  dia_semana text,
  cluster text,
  rol text,
  tipo text,
  titulo text,
  slug text unique,
  keyword text,
  audiencia text,
  guia_titulo text,
  origen text check (origen in ('cliente', 'propuesto')),
  descartado boolean not null default false,
  descartado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_topics_descarte_consistente
    check ((descartado and descartado_at is not null) or (not descartado and descartado_at is null))
);

create index if not exists blog_topics_fecha_idx on public.blog_topics (fecha_programada nulls last, orden);

-- El proyecto no tiene un trigger genérico de updated_at (cada tabla lo
-- maneja por su cuenta), así que esta tabla trae el suyo.
create or replace function public.blog_topics_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists blog_topics_set_updated_at on public.blog_topics;
create trigger blog_topics_set_updated_at
  before update on public.blog_topics
  for each row execute function public.blog_topics_set_updated_at();

-- Solo admin (mismo helper que el resto de tablas del panel). anon y
-- clientes no ven nada: el backlog es información interna.
alter table public.blog_topics enable row level security;

drop policy if exists "Los admins administran el backlog del blog" on public.blog_topics;
create policy "Los admins administran el backlog del blog"
  on public.blog_topics for all
  using (public.is_admin())
  with check (public.is_admin());
