-- Club 57 — Promociones: eliminar promociones ARCHIVADAS para liberar
-- espacio en Storage. Complementa 20261006010000_club57_promociones.sql.
--
-- Reglas:
--   * Archivada SIN descargas -> se borra la fila completa (y el PDF).
--   * Archivada CON descargas -> se borra solo el PDF; la fila se conserva
--     con archivo_eliminado_at como historial (fechas y descargas únicas).
--   * Vigentes/programadas nunca se eliminan directo: primero se archivan.

alter table public.club57_promociones
  add column if not exists archivo_eliminado_at timestamptz;

alter table public.club57_promociones
  drop constraint if exists club57_promociones_archivo_eliminado_solo_archivada;
alter table public.club57_promociones
  add constraint club57_promociones_archivo_eliminado_solo_archivada
  check (archivo_eliminado_at is null or estado = 'archivada');

-- Igual que antes, más una única excepción para archivadas: marcar el PDF
-- como eliminado (archivo_eliminado_at de null a una fecha), sin tocar
-- nada más. Nunca se puede desmarcar.
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
    if old.archivo_eliminado_at is null
      and new.archivo_eliminado_at is not null
      and new.estado = old.estado
      and new.titulo is not distinct from old.titulo
      and new.vigencia_inicio is not distinct from old.vigencia_inicio
      and new.vigencia_fin is not distinct from old.vigencia_fin
      and new.published_at is not distinct from old.published_at
    then
      new.updated_at := now();
      return new;
    end if;
    raise exception 'Una promoción archivada ya no se puede modificar.'
      using errcode = 'F57AR';
  end if;

  if new.archivo_eliminado_at is not null then
    raise exception 'Solo se puede eliminar el PDF de una promoción archivada.'
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

-- Ahora también se borran archivadas. Una archivada con descargas no
-- llega a borrarse: la llave foránea de club57_promo_descargas
-- ("on delete restrict") lo impide y su historial se conserva.
create or replace function public.club57_promociones_guard_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.estado = 'publicada' then
    raise exception 'Archiva la promoción antes de eliminarla.'
      using errcode = 'F57DL';
  end if;
  return old;
end;
$$;
