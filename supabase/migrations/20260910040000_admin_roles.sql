-- Rol de cada usuario: 'customer' (default) o 'admin'. El panel de
-- administración (/admin) se protege verificando este campo, nunca solo
-- ocultando enlaces en la interfaz.
alter table public.profiles
  add column if not exists role text not null default 'customer';

alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('customer', 'admin'));

-- CRÍTICO — blindaje contra auto-escalación de privilegios: la política
-- "Los usuarios editan su propio perfil" (ver migración anterior) permite
-- que cada quien actualice su propia fila para, por ejemplo, cambiar su
-- nombre. Sin esto, ese mismo permiso dejaría que cualquier cliente se
-- pusiera role = 'admin' desde el navegador con una llamada directa a la
-- API de Supabase. Este trigger corre ANTES de aplicar cualquier UPDATE
-- normal (el que hace la app con la anon key, sujeto a RLS) y descarta el
-- cambio de rol a menos que la fila YA fuera de un admin — comparado
-- contra OLD.role, el valor que de verdad está guardado, nunca contra
-- algo que el propio request pudiera manipular.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if OLD.role <> 'admin' then
    NEW.role := OLD.role;
  end if;
  return NEW;
end;
$$;

drop trigger if exists prevent_role_escalation_trigger on public.profiles;
create trigger prevent_role_escalation_trigger
  before update on public.profiles
  for each row execute procedure public.prevent_role_escalation();

-- Único camino para volver a alguien administrador: un UPDATE manual desde
-- el SQL Editor de Supabase (corre con la service_role, que se salta RLS
-- Y este trigger no la restringe — solo actúa sobre updates que sí pasan
-- por las políticas normales). Nunca desde la aplicación.

-- Función reutilizable para las políticas de RLS de las tablas que se
-- construyan en los siguientes prompts (categorías, productos, pedidos,
-- etc.): "¿el usuario autenticado actual es admin?". security definer +
-- search_path fijo por el mismo motivo que handle_new_user() — necesita
-- leer profiles sin depender de qué políticas de RLS tenga esa tabla en
-- ese momento, y sin quedar expuesta a que alguien manipule search_path.
-- stable (no volatile): no modifica datos, permite que el planner la trate
-- como una sola evaluación por sentencia en vez de por fila.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
