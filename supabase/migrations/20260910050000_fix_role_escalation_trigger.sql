-- Corrige un bug real de la migración anterior (20260910040000): el
-- trigger prevent_role_escalation no distinguía QUIÉN hacía el UPDATE,
-- así que también revertía el UPDATE manual hecho a mano desde el SQL
-- Editor para nombrar al primer administrador (el propio bloqueo contra
-- auto-escalación se estaba aplicando a sí mismo). Ver el comentario
-- actualizado en 20260910040000_admin_roles.sql para el detalle completo.
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
