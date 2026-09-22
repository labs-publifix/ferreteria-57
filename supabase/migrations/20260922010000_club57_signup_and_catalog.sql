-- Club 57 — segundo prompt: conecta el autoregistro de /cuenta con Club 57
-- (todo cliente con cuenta ES miembro, sin paso aparte de "inscribirse"),
-- backfill de cuentas ya existentes, y columnas nuevas para el catálogo de
-- canje. Único cambio sobre algo preexistente: handle_new_user() —
-- estrictamente aditivo, ver el comentario junto a esa función más abajo.

-- club57_members.phone es NOT NULL desde el primer prompt (ahí solo se
-- llena por alta manual, que sí pide teléfono) — pero /cuenta NO pide
-- teléfono al registrarse, así que el autoregistro no tiene ese dato
-- todavía. Se relaja a nullable (tabla propia de Club 57, no una tabla
-- preexistente del resto del sitio) — se puede completar después.
alter table public.club57_members
  alter column phone drop not null;

-- 'backfill' se agrega al lado de 'vendedor'/'autoregistro' — distingue
-- una cuenta que ya existía antes de este prompt (ver Parte 4) de un
-- autoregistro nuevo, sin reescribir el significado de 'autoregistro'.
alter table public.club57_members
  drop constraint if exists club57_members_origen_alta_check;
alter table public.club57_members
  add constraint club57_members_origen_alta_check
  check (origen_alta in ('vendedor', 'autoregistro', 'backfill'));

-- Columnas del catálogo de canje que el primer prompt dejó solo con lo
-- "obvio" (nombre/descripcion/costo_puntos/stock/active) — clave (código
-- interno del artículo, nunca mostrado al cliente) e image_url (mismo
-- patrón que products.images: sin foto real todavía, se muestra un
-- placeholder y el artículo no se activa solo).
alter table public.club57_redemption_catalog
  add column if not exists clave text,
  add column if not exists image_url text;

-- Storage: bucket propio para imágenes del catálogo de canje, mismo
-- patrón que promo-images (público para lectura, solo admin para
-- escritura) — separado de products/promo porque son activos de un
-- catálogo distinto.
insert into storage.buckets (id, name, public)
values ('club57-catalog-images', 'club57-catalog-images', true)
on conflict (id) do nothing;

drop policy if exists "Cualquiera lee imágenes del catálogo de canje" on storage.objects;
create policy "Cualquiera lee imágenes del catálogo de canje"
  on storage.objects for select
  using (bucket_id = 'club57-catalog-images');

drop policy if exists "Los admins suben imágenes del catálogo de canje" on storage.objects;
create policy "Los admins suben imágenes del catálogo de canje"
  on storage.objects for insert
  with check (bucket_id = 'club57-catalog-images' and public.is_admin());

drop policy if exists "Los admins actualizan imágenes del catálogo de canje" on storage.objects;
create policy "Los admins actualizan imágenes del catálogo de canje"
  on storage.objects for update
  using (bucket_id = 'club57-catalog-images' and public.is_admin());

drop policy if exists "Los admins borran imágenes del catálogo de canje" on storage.objects;
create policy "Los admins borran imágenes del catálogo de canje"
  on storage.objects for delete
  using (bucket_id = 'club57-catalog-images' and public.is_admin());

-- handle_new_user(): el INSERT a profiles de abajo es carácter por
-- carácter el mismo que ya corría (mismas columnas, mismos valores, la
-- misma llamada a generate_referral_code()) — la única diferencia es
-- "returning referral_code into v_referral_code" al final, que SOLO
-- captura el valor ya generado en una variable, no cambia qué se inserta
-- ni cómo. Todo lo que sigue (el INSERT a club57_members) es código
-- nuevo, agregado después de que profiles ya quedó exactamente como
-- siempre. Si por lo que sea esa segunda inserción fallara, toda la
-- función aborta (misma transacción) y ni siquiera se crearía el usuario
-- de Auth — a propósito: un miembro de Club 57 sin cuenta real, o una
-- cuenta real sin su membresía, son ambos estados inconsistentes que no
-- deben poder quedar guardados a medias.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_referral_code text;
begin
  insert into public.profiles (id, full_name, referral_code)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    public.generate_referral_code()
  )
  returning referral_code into v_referral_code;

  -- PRINCIPIO RECTOR de este prompt: toda cuenta es automáticamente
  -- miembro de Club 57, sin paso de inscripción aparte. phone queda null
  -- (el formulario de /cuenta no lo pide); el código de referido es
  -- EXACTAMENTE el mismo que se acaba de generar para profiles, nunca uno
  -- nuevo. coalesce cubre el caso (hoy no forzado por el formulario, pero
  -- sí posible llamando signUp directo) de que full_name venga vacío —
  -- club57_members.full_name es not null y esta inserción no debe poder
  -- tumbar el registro completo por un dato opcional en blanco.
  insert into public.club57_members (id, full_name, email, phone, referral_code, origen_alta)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email),
    new.email,
    null,
    v_referral_code,
    'autoregistro'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Parte 4 — backfill: cualquier cuenta que ya existía en profiles antes de
-- este prompt (y por lo tanto nunca pasó por el handle_new_user() de
-- arriba) todavía no tiene fila en club57_members. Se corre una sola vez
-- aquí mismo; el "where not exists" (más el on conflict, cinturón y
-- tirantes) hace que volver a correr esta migración completa no duplique
-- nada — una cuenta ya migrada simplemente no vuelve a coincidir.
insert into public.club57_members (id, full_name, email, phone, referral_code, origen_alta)
select
  p.id,
  coalesce(nullif(trim(p.full_name), ''), u.email, 'Cliente Club 57'),
  u.email,
  null,
  p.referral_code,
  'backfill'
from public.profiles p
join auth.users u on u.id = p.id
where not exists (
  select 1 from public.club57_members m where m.id = p.id
)
on conflict (id) do nothing;
