-- Accesos: desactivar cuentas de personal y cerrar sus sesiones.
--
-- Desactivar una cuenta (desde /admin/accesos) usa el "ban" de Supabase
-- Auth (banned_until): bloquea el inicio de sesión, la renovación del token
-- y getUser() de inmediato. Pero un access token ya emitido sigue siendo un
-- JWT válido hasta que expira (máximo 1 hora), y con él PostgREST seguía
-- respondiendo is_admin()/is_vendedor() = true. Estas dos funciones (las
-- mismas que usan el middleware, las Server Actions y todas las políticas
-- RLS del panel) ahora también exigen que la cuenta no esté desactivada,
-- así que el corte es inmediato en todas las capas.
--
-- Estrictamente aditivo: misma firma, mismo resultado para cualquier cuenta
-- activa; solo agrega la condición de no estar desactivada.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
      and not exists (
        select 1 from auth.users u
        where u.id = p.id and u.banned_until is not null and u.banned_until > now()
      )
  );
$$;

create or replace function public.is_vendedor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'vendedor'
      and not exists (
        select 1 from auth.users u
        where u.id = p.id and u.banned_until is not null and u.banned_until > now()
      )
  );
$$;

-- Cierra todas las sesiones de una cuenta (sus refresh tokens dejan de
-- servir y getUser() deja de reconocer el token actual). Solo la llama el
-- servidor con la service_role, desde las acciones de /admin/accesos, al
-- desactivar una cuenta o cambiarle la contraseña a otra persona.
create or replace function public.staff_cerrar_sesiones(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.sessions where user_id = p_user_id;
$$;

revoke all on function public.staff_cerrar_sesiones(uuid) from public, anon, authenticated;
grant execute on function public.staff_cerrar_sesiones(uuid) to service_role;
