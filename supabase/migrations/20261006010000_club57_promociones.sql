-- Club 57 — Promociones descargables (PDF con vigencia): Promo Truper y
-- Promociones de Temporada. Liquidaciones del Mes ya queda contemplado en
-- el enum y en fuente_excel_path, pero su flujo llega en una fase
-- posterior. Módulo nuevo y estrictamente aditivo: no modifica ninguna
-- tabla, función ni política existente.
--
-- Contenido protegido: el PDF vive en un bucket PRIVADO sin políticas, la
-- tabla base solo la lee/escribe un admin (RLS), y el miembro únicamente
-- ve (a) fechas y tipo a través de la vista club57_promociones_vigentes y
-- (b) el archivo a través de GET /api/club57/promociones/[id]/descargar,
-- que revalida sesión, membresía, estado y vigencia en CADA descarga.

-- La extensión vive en el esquema "extensions" (convención de Supabase).
-- El operador de igualdad para el enum dentro de la restricción de
-- exclusión se resuelve por la clase de operadores por defecto del tipo,
-- que no depende del search_path.
create extension if not exists btree_gist with schema extensions;

do $$
begin
  create type public.club57_promo_tipo as enum ('promo_truper', 'promo_temporada', 'liquidaciones');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.club57_promo_estado as enum ('borrador', 'publicada', 'archivada');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.club57_promociones (
  id uuid primary key default gen_random_uuid(),
  tipo public.club57_promo_tipo not null,
  -- Nombre interno: solo se ve en el panel admin, nunca en la vista que
  -- leen los miembros.
  titulo text not null check (char_length(btrim(titulo)) between 3 and 80),
  archivo_path text not null unique,
  archivo_nombre_original text not null check (char_length(archivo_nombre_original) between 1 and 255),
  archivo_bytes bigint not null check (archivo_bytes > 0),
  archivo_sha256 text not null check (archivo_sha256 ~ '^[0-9a-f]{64}$'),
  archivo_mime text not null default 'application/pdf' check (archivo_mime = 'application/pdf'),
  -- Fase de Liquidaciones: Excel de origen del que se generará el PDF.
  fuente_excel_path text,
  -- Fechas de CALENDARIO en America/Mexico_City, ambas inclusivas: la
  -- promoción es vigente desde las 00:00 del inicio hasta las 23:59:59
  -- del fin. Nulas solo mientras la fila es borrador (el asistente del
  -- admin registra el archivo antes de que se elijan las fechas).
  vigencia_inicio date,
  vigencia_fin date,
  estado public.club57_promo_estado not null default 'borrador',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  updated_at timestamptz not null default now(),

  constraint club57_promociones_vigencia_orden check (vigencia_fin >= vigencia_inicio),
  constraint club57_promociones_vigencia_requerida check (
    estado = 'borrador' or (vigencia_inicio is not null and vigencia_fin is not null)
  ),
  constraint club57_promociones_published_at_requerido check (estado = 'borrador' or published_at is not null),
  -- Regla central: en cada momento solo puede haber UNA promoción
  -- publicada vigente por tipo. Se permiten varias programadas a futuro
  -- siempre que sus rangos no se toquen. '[]' = ambos extremos inclusivos,
  -- así "1–15" y "15–31" sí chocan (comparten el día 15). Distintos tipos
  -- nunca chocan entre sí. Los Server Actions validan lo mismo antes de
  -- escribir para dar un mensaje amigable; esto es la garantía real ante
  -- dos guardados concurrentes.
  constraint club57_promociones_sin_traslape exclude using gist (
    tipo with =,
    daterange(vigencia_inicio, vigencia_fin, '[]') with &&
  ) where (estado = 'publicada')
);

create index if not exists club57_promociones_tipo_estado_idx
  on public.club57_promociones (tipo, estado, vigencia_inicio);

-- Inmutabilidad del archivo y transiciones de estado válidas:
--   borrador -> publicada -> archivada (archivada es terminal).
-- Un archivo publicado nunca se reemplaza: para cambiarlo se sube una
-- promoción nueva y la anterior se archiva. Las columnas del archivo no
-- cambian NUNCA, ni siquiera en borrador (cambiar de archivo en el
-- asistente elimina el borrador y crea otro).
create or replace function public.club57_promociones_guard_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.tipo is distinct from old.tipo
    or new.archivo_path is distinct from old.archivo_path
    or new.archivo_nombre_original is distinct from old.archivo_nombre_original
    or new.archivo_bytes is distinct from old.archivo_bytes
    or new.archivo_sha256 is distinct from old.archivo_sha256
    or new.archivo_mime is distinct from old.archivo_mime
    or new.fuente_excel_path is distinct from old.fuente_excel_path
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  then
    raise exception 'El archivo de una promoción es inmutable: sube una promoción nueva.'
      using errcode = 'F57IM';
  end if;

  if old.estado = 'archivada' then
    raise exception 'Una promoción archivada ya no se puede modificar.'
      using errcode = 'F57AR';
  end if;

  if (old.estado = 'publicada' and new.estado = 'borrador')
    or (old.estado = 'borrador' and new.estado = 'archivada')
  then
    raise exception 'Cambio de estado no permitido (% -> %).', old.estado, new.estado
      using errcode = 'F57TR';
  end if;

  if old.estado = 'borrador' and new.estado = 'publicada' then
    new.published_at := coalesce(new.published_at, now());
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists club57_promociones_guard_update on public.club57_promociones;
create trigger club57_promociones_guard_update
  before update on public.club57_promociones
  for each row execute function public.club57_promociones_guard_update();

-- Solo los borradores se eliminan; una promoción que alguna vez se publicó
-- se archiva (conserva su historial de descargas).
create or replace function public.club57_promociones_guard_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.estado <> 'borrador' then
    raise exception 'Solo se pueden eliminar borradores; archiva la promoción en su lugar.'
      using errcode = 'F57DL';
  end if;
  return old;
end;
$$;

drop trigger if exists club57_promociones_guard_delete on public.club57_promociones;
create trigger club57_promociones_guard_delete
  before delete on public.club57_promociones
  for each row execute function public.club57_promociones_guard_delete();

alter table public.club57_promociones enable row level security;

drop policy if exists "Los admins administran promociones de Club 57" on public.club57_promociones;
create policy "Los admins administran promociones de Club 57"
  on public.club57_promociones for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Descargas: bitácora append-only para métricas (descargas únicas por
-- promoción). La inserta SOLO el endpoint de descarga con la service role.
-- ---------------------------------------------------------------------
create table if not exists public.club57_promo_descargas (
  id bigint generated always as identity primary key,
  promocion_id uuid not null references public.club57_promociones (id) on delete restrict,
  member_id uuid not null references public.club57_members (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists club57_promo_descargas_promocion_member_idx
  on public.club57_promo_descargas (promocion_id, member_id);

-- Append-only: nunca se actualiza, y solo se borra como cascada de la
-- baja de la cuenta del miembro (en ese momento la fila padre ya no
-- existe, ver "on delete cascade" arriba) — un DELETE directo se rechaza.
create or replace function public.club57_promo_descargas_append_only()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'La bitácora de descargas es de solo inserción.' using errcode = 'F57AO';
  end if;
  if exists (select 1 from public.club57_members where id = old.member_id) then
    raise exception 'La bitácora de descargas es de solo inserción.' using errcode = 'F57AO';
  end if;
  return old;
end;
$$;

drop trigger if exists club57_promo_descargas_append_only on public.club57_promo_descargas;
create trigger club57_promo_descargas_append_only
  before update or delete on public.club57_promo_descargas
  for each row execute function public.club57_promo_descargas_append_only();

alter table public.club57_promo_descargas enable row level security;

drop policy if exists "Los admins ven descargas de promociones" on public.club57_promo_descargas;
create policy "Los admins ven descargas de promociones"
  on public.club57_promo_descargas for select
  using (public.is_admin());

-- Resumen para el panel admin. SECURITY INVOKER: corre con el RLS de quien
-- llama, así que un no-admin solo obtiene un resultado vacío.
create or replace function public.club57_promo_descargas_resumen()
returns table (promocion_id uuid, descargas_unicas bigint, descargas_totales bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select d.promocion_id, count(distinct d.member_id), count(*)
  from public.club57_promo_descargas d
  group by d.promocion_id;
$$;

revoke execute on function public.club57_promo_descargas_resumen() from public, anon;
grant execute on function public.club57_promo_descargas_resumen() to authenticated;

-- ---------------------------------------------------------------------
-- Vista para los miembros (mismo patrón que popup_banners_public): corre
-- con los privilegios de su dueño, así que puede leer la tabla base que
-- RLS le niega al miembro, y proyecta SOLO id, tipo y fechas — nunca
-- archivo_path ni el nombre interno.
--
-- Incluye las publicadas vigentes, las programadas a futuro (la tarjeta
-- del miembro muestra "Disponible a partir del …") y las que vencieron en
-- los últimos 7 días ("Promoción finalizada"). El estado visible se
-- calcula en el servidor de la app por fechas en America/Mexico_City.
-- ---------------------------------------------------------------------
create or replace view public.club57_promociones_vigentes as
select
  id,
  tipo,
  vigencia_inicio,
  vigencia_fin
from public.club57_promociones
where estado = 'publicada'
  and vigencia_fin >= public.today_in_queretaro() - 7;

-- Una vista simple sobre una sola tabla es auto-actualizable en Postgres y
-- correría con los privilegios del dueño: se revoca TODO (Supabase otorga
-- privilegios por defecto a anon/authenticated en objetos nuevos de
-- public) y se concede únicamente SELECT a usuarios con sesión.
revoke all on public.club57_promociones_vigentes from public, anon, authenticated;
grant select on public.club57_promociones_vigentes to authenticated;

-- ---------------------------------------------------------------------
-- Storage: bucket PRIVADO sin ninguna política en storage.objects — solo
-- la service role (código de servidor) lee y escribe. El navegador del
-- admin sube con una signed upload URL de un solo uso generada por un
-- Server Action que antes verifica is_admin(). El límite de tamaño y el
-- tipo MIME del bucket son una capa extra; la validación real (tamaño,
-- firma "%PDF-", SHA-256) la hace el Server Action de finalizar.
-- 26214400 bytes = 25 MB: debe coincidir con PROMO_MAX_BYTES en
-- lib/club57/promociones/config.ts.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('club57-promociones', 'club57-promociones', false, 26214400, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
