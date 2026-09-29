-- Alta manual directa (#10b): se quita el paso obligatorio de búsqueda
-- previa en la UI — la validación de duplicados pasa a ocurrir SOLO al
-- guardar, en el servidor. Antes, findClub57MemberByContact() comparaba
-- email en minúsculas y teléfono TAL CUAL se escribió (sin normalizar) —
-- "+52 442 123 4567" y "4421234567" no se detectaban como el mismo
-- contacto. Estas funciones normalizan email (sin espacios, minúsculas) y
-- teléfono (solo dígitos, últimos 10) para que la comparación sea
-- consistente sin importar el formato con el que se escribió.
create or replace function public.f57_normalize_email(text)
returns text
language sql
immutable
parallel safe
as $$
  select lower(regexp_replace(coalesce($1, ''), '\s+', '', 'g'));
$$;

create or replace function public.f57_normalize_phone(text)
returns text
language sql
immutable
parallel safe
as $$
  select right(regexp_replace(coalesce($1, ''), '\D', '', 'g'), 10);
$$;

-- Índices funcionales — sin esto, find_club57_contact_duplicate() haría un
-- escaneo secuencial completo de club57_members en cada alta manual y en
-- cada onBlur del formulario.
create index if not exists club57_members_email_norm_idx
  on public.club57_members (public.f57_normalize_email(email));

create index if not exists club57_members_phone_norm_idx
  on public.club57_members (public.f57_normalize_phone(phone));

-- Un solo RPC reutilizado por el chequeo temprano (onBlur, un campo a la
-- vez) y por la validación real al guardar (createClub57Member, ambos
-- campos). SECURITY DEFINER + search_path fijo porque necesita ver TODOS
-- los clientes de Club 57 sin importar el vendedor dueño (mismo motivo que
-- ya documentaba findClub57MemberByContact: RLS por vendedor no debe
-- esconder un duplicado de otro vendedor). No se otorga EXECUTE a
-- anon/authenticated a propósito — expone full_name de otro cliente, solo
-- debe llamarse desde Server Actions vía el cliente admin (service_role),
-- nunca directo desde el navegador de un cliente.
--
-- p_email/p_phone vacíos desactivan esa mitad de la comparación (permite
-- chequear un solo campo a la vez desde el onBlur sin forzar el otro).
create or replace function public.find_club57_contact_duplicate(p_email text, p_phone text)
returns table (id uuid, full_name text, matched_field text)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.full_name, 'email'::text as matched_field
  from public.club57_members m
  where p_email <> '' and public.f57_normalize_email(m.email) = public.f57_normalize_email(p_email)

  union all

  select m.id, m.full_name, 'phone'::text as matched_field
  from public.club57_members m
  where p_phone <> '' and public.f57_normalize_phone(m.phone) = public.f57_normalize_phone(p_phone)

  limit 5;
$$;
