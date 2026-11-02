-- Club 57 — Directorio de socios comerciales.
--
-- Comercios de Querétaro que se muestran en dos niveles:
--   - Público (/directorio y el home): solo id, nombre comercial, slug,
--     giro, logo, municipio y colonia, a través de la vista
--     club57_partners_publicos. Nunca teléfono, correo, dirección ni
--     contacto: esos campos no existen en la vista, así que no pueden
--     llegar al navegador de un visitante aunque alguien arme la consulta a
--     mano contra la API.
--   - Miembros activos de Club 57 (/cuenta › Socios Comerciales): datos de
--     contacto completos con club57_directorio_miembros(), que valida la
--     membresía en la base. Los datos de contacto de un socio solo se
--     comparten si el socio dio su autorización (consentimiento_datos,
--     LFPDPPP); sin ella el miembro ve el socio sin sus datos de contacto.
--   - Admin y operador: lectura y escritura de la tabla completa (incluidas
--     las notas internas, que nunca salen del panel). El borrado físico
--     solo lo hace el admin; el flujo normal es desactivar o enviar a
--     «Eliminados» (soft delete con eliminado_at).
--
-- Un socio solo se publica (vista y función de miembros) si está activo,
-- no está eliminado y tiene un giro activo asignado: los que llegan con
-- giro «Por definir» quedan en el admin como pendientes de completar.
--
-- Miembro activo = misma definición que ya usa el programa: una fila en
-- club57_members para el usuario de la sesión (la crea el alta), con la
-- cuenta sin desactivar (auth.users.banned_until, ver
-- 20261013010000_staff_desactivacion.sql).
--
-- Idempotente: se puede correr más de una vez.

-- ---------------------------------------------------------------------
-- 1) ¿La sesión es de un miembro activo de Club 57?
-- ---------------------------------------------------------------------
create or replace function public.is_active_club57_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.club57_members m
    where m.id = auth.uid()
      and not exists (
        select 1 from auth.users u
        where u.id = m.id and u.banned_until is not null and u.banned_until > now()
      )
  );
$$;

grant execute on function public.is_active_club57_member() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Catálogo de giros (administrable)
-- ---------------------------------------------------------------------
create table if not exists public.club57_partner_giros (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(btrim(nombre)) between 2 and 80),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists club57_partner_giros_nombre_key
  on public.club57_partner_giros (lower(btrim(nombre)));

alter table public.club57_partner_giros enable row level security;

drop policy if exists "Los admins administran los giros del directorio" on public.club57_partner_giros;
create policy "Los admins administran los giros del directorio"
  on public.club57_partner_giros for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 3) Socios comerciales
-- ---------------------------------------------------------------------
create table if not exists public.club57_partners (
  id uuid primary key default gen_random_uuid(),
  nombre_comercial text not null check (length(btrim(nombre_comercial)) between 2 and 120),
  slug text not null,
  giro_id uuid references public.club57_partner_giros (id) on delete set null,
  contacto text,
  telefono text check (telefono is null or telefono ~ '^[0-9]{10}$'),
  correo text check (correo is null or (correo = lower(correo) and correo ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  correo_2 text check (correo_2 is null or (correo_2 = lower(correo_2) and correo_2 ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  calle text,
  num_ext text,
  num_int text,
  colonia text,
  cp text check (cp is null or cp ~ '^[0-9]{5}$'),
  municipio text,
  estado text not null default 'Querétaro',
  -- URL pública del logo en Storage (club57-socios-logos) y su ruta, para
  -- poder borrarlo al reemplazarlo o quitarlo. Sin logo: avatar de
  -- iniciales generado en la app.
  logo_url text,
  logo_path text,
  activo boolean not null default true,
  -- Soft delete: «Eliminar» en el admin solo llena esta fecha.
  eliminado_at timestamptz,
  -- Nunca se muestra fuera del panel de administración.
  notas_internas text,
  origen text not null default 'manual' check (origen in ('manual', 'carga_masiva')),
  clave_origen text,
  -- Autorización del socio para compartir sus datos de contacto con los
  -- miembros de Club 57 (LFPDPPP) y la fecha en que se registró.
  consentimiento_datos boolean not null default false,
  consentimiento_fecha timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club57_partners_consentimiento_check check (consentimiento_datos = (consentimiento_fecha is not null))
);

create unique index if not exists club57_partners_slug_key on public.club57_partners (slug);
create unique index if not exists club57_partners_clave_origen_key
  on public.club57_partners (clave_origen) where clave_origen is not null;
create index if not exists club57_partners_nombre_idx on public.club57_partners (lower(nombre_comercial));
create index if not exists club57_partners_giro_idx on public.club57_partners (giro_id);
create index if not exists club57_partners_publicado_idx on public.club57_partners (activo, eliminado_at);
create index if not exists club57_partners_telefono_idx on public.club57_partners (telefono) where telefono is not null;
create index if not exists club57_partners_correo_idx on public.club57_partners (correo) where correo is not null;

-- updated_at al día en cada cambio (giros y socios).
create or replace function public.club57_directorio_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists club57_partners_touch_updated_at on public.club57_partners;
create trigger club57_partners_touch_updated_at
  before update on public.club57_partners
  for each row execute function public.club57_directorio_touch_updated_at();

drop trigger if exists club57_partner_giros_touch_updated_at on public.club57_partner_giros;
create trigger club57_partner_giros_touch_updated_at
  before update on public.club57_partner_giros
  for each row execute function public.club57_directorio_touch_updated_at();

alter table public.club57_partners enable row level security;

-- Sin políticas para anon ni para miembros: la tabla completa solo la lee
-- y escribe el personal de administración. El público lee la vista y los
-- miembros la función de abajo.
drop policy if exists "Los admins leen los socios comerciales" on public.club57_partners;
create policy "Los admins leen los socios comerciales"
  on public.club57_partners for select
  using (public.is_admin());

drop policy if exists "Los admins registran socios comerciales" on public.club57_partners;
create policy "Los admins registran socios comerciales"
  on public.club57_partners for insert
  with check (public.is_admin());

drop policy if exists "Los admins actualizan socios comerciales" on public.club57_partners;
create policy "Los admins actualizan socios comerciales"
  on public.club57_partners for update
  using (public.is_admin())
  with check (public.is_admin());

-- Borrado físico: solo el admin completo (el flujo normal es soft delete).
drop policy if exists "Solo el admin borra socios comerciales" on public.club57_partners;
create policy "Solo el admin borra socios comerciales"
  on public.club57_partners for delete
  using (public.is_full_admin());

-- ---------------------------------------------------------------------
-- 4) Vista pública: SOLO campos no sensibles de socios publicados.
--    Corre con los permisos de su dueño (como cualquier vista), así que
--    lee la tabla sin abrirle RLS a nadie; security_barrier evita que un
--    filtro del que consulta se evalúe antes que el de la vista.
-- ---------------------------------------------------------------------
create or replace view public.club57_partners_publicos
with (security_barrier = true)
as
select
  p.id,
  p.nombre_comercial,
  p.slug,
  g.id as giro_id,
  g.nombre as giro,
  p.logo_url,
  p.municipio,
  p.colonia
from public.club57_partners p
join public.club57_partner_giros g on g.id = p.giro_id and g.activo
where p.activo and p.eliminado_at is null;

revoke all on public.club57_partners_publicos from public;
grant select on public.club57_partners_publicos to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5) Directorio completo para miembros activos.
--    Los datos de contacto solo viajan si el socio dio su autorización.
-- ---------------------------------------------------------------------
create or replace function public.club57_directorio_miembros()
returns table (
  id uuid,
  nombre_comercial text,
  slug text,
  giro_id uuid,
  giro text,
  logo_url text,
  datos_autorizados boolean,
  contacto text,
  telefono text,
  correo text,
  correo_2 text,
  calle text,
  num_ext text,
  num_int text,
  colonia text,
  cp text,
  municipio text,
  estado text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_active_club57_member() then
    raise exception 'Exclusivo para miembros de Club 57.' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.nombre_comercial,
    p.slug,
    g.id,
    g.nombre,
    p.logo_url,
    p.consentimiento_datos,
    case when p.consentimiento_datos then p.contacto end,
    case when p.consentimiento_datos then p.telefono end,
    case when p.consentimiento_datos then p.correo end,
    case when p.consentimiento_datos then p.correo_2 end,
    case when p.consentimiento_datos then p.calle end,
    case when p.consentimiento_datos then p.num_ext end,
    case when p.consentimiento_datos then p.num_int end,
    p.colonia,
    case when p.consentimiento_datos then p.cp end,
    p.municipio,
    p.estado
  from public.club57_partners p
  join public.club57_partner_giros g on g.id = p.giro_id and g.activo
  where p.activo and p.eliminado_at is null
  order by p.nombre_comercial;
end;
$$;

revoke all on function public.club57_directorio_miembros() from public, anon;
grant execute on function public.club57_directorio_miembros() to authenticated;

-- ---------------------------------------------------------------------
-- 6) Storage: logos de socios (lectura pública, escritura solo admin).
--    2 MB y solo PNG, JPG, WebP o SVG; debe coincidir con
--    lib/club57/socios/logo.ts. La validación real (firma del archivo y
--    SVG sin scripts) la hace la Server Action antes de subir.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'club57-socios-logos',
  'club57-socios-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Cualquiera lee logos de socios comerciales" on storage.objects;
create policy "Cualquiera lee logos de socios comerciales"
  on storage.objects for select
  using (bucket_id = 'club57-socios-logos');

drop policy if exists "Los admins suben logos de socios comerciales" on storage.objects;
create policy "Los admins suben logos de socios comerciales"
  on storage.objects for insert
  with check (bucket_id = 'club57-socios-logos' and public.is_admin());

drop policy if exists "Los admins actualizan logos de socios comerciales" on storage.objects;
create policy "Los admins actualizan logos de socios comerciales"
  on storage.objects for update
  using (bucket_id = 'club57-socios-logos' and public.is_admin());

drop policy if exists "Los admins borran logos de socios comerciales" on storage.objects;
create policy "Los admins borran logos de socios comerciales"
  on storage.objects for delete
  using (bucket_id = 'club57-socios-logos' and public.is_admin());
