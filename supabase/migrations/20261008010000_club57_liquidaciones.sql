-- Club 57 — Liquidaciones del Mes. Mismo flujo que Promo Truper /
-- Temporada, pero el equipo sube un EXCEL (fuente de verdad) y la
-- plataforma genera el PDF de marca que descargan los miembros.
-- Complementa 20261006010000 y 20261007010000.
--
--   * fuente_excel_path / fuente_excel_nombre / fuente_productos: el Excel
--     original y cuántos productos trae. Inmutables, como cualquier archivo.
--   * El PDF de una liquidación SÍ se puede regenerar (borrador o
--     publicada): lleva la vigencia impresa, así que al editar las fechas
--     se vuelve a generar desde el mismo Excel.

alter table public.club57_promociones
  add column if not exists fuente_excel_nombre text,
  add column if not exists fuente_productos integer check (fuente_productos is null or fuente_productos > 0);

alter table public.club57_promociones
  drop constraint if exists club57_promociones_liquidacion_requiere_excel;
alter table public.club57_promociones
  add constraint club57_promociones_liquidacion_requiere_excel
  check (tipo <> 'liquidaciones' or (fuente_excel_path is not null and fuente_excel_nombre is not null));

create or replace function public.club57_promociones_guard_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  pdf_cambia boolean := new.archivo_path is distinct from old.archivo_path
    or new.archivo_nombre_original is distinct from old.archivo_nombre_original
    or new.archivo_bytes is distinct from old.archivo_bytes
    or new.archivo_sha256 is distinct from old.archivo_sha256;
begin
  if new.tipo is distinct from old.tipo
    or new.archivo_mime is distinct from old.archivo_mime
    or new.fuente_excel_path is distinct from old.fuente_excel_path
    or new.fuente_excel_nombre is distinct from old.fuente_excel_nombre
    or new.fuente_productos is distinct from old.fuente_productos
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
    -- Solo el PDF GENERADO de una liquidación (no archivada) se regenera.
    or (pdf_cambia and (old.tipo <> 'liquidaciones' or old.estado = 'archivada'))
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

-- El bucket privado ahora también guarda el Excel de origen (.xlsx). Los
-- miembros nunca lo ven: el endpoint de descarga solo entrega archivo_path.
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]
where id = 'club57-promociones';
