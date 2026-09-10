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
-- API de Supabase. Este trigger descarta el cambio de rol a menos que la
-- fila YA fuera de un admin — comparado contra OLD.role, el valor que de
-- verdad está guardado, nunca contra algo que el propio request pudiera
-- manipular.
--
-- El chequeo de current_user es igual de importante que el de OLD.role:
-- un trigger BEFORE UPDATE corre para CUALQUIER actualización a la tabla,
-- sin importar quién la haga — incluida la que se hace a mano desde el
-- SQL Editor de Supabase (que conecta como el rol 'postgres', no pasa por
-- PostgREST). Sin esta condición, el propio trigger revertiría el UPDATE
-- manual que se usa para nombrar al primer administrador. Las peticiones
-- normales de la app llegan como el rol 'authenticated' (o 'anon'); solo
-- esas quedan sujetas al bloqueo. 'service_role' también queda exento
-- porque ya se salta RLS de por sí.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('postgres', 'service_role') and OLD.role <> 'admin' then
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
-- el SQL Editor de Supabase (conecta como 'postgres', exento del trigger
-- de arriba) o cualquier llamada que use la service_role. Nunca desde la
-- aplicación.

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
