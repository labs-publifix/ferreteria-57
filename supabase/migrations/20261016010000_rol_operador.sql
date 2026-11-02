-- Rol «operador» y asignación de vendedor a clientes de Club 57.
--
-- Operador: personal de confianza que opera la tienda (pedidos, productos,
-- categorías, reseñas, banners, blog y todo Club 57, incluida la corrección
-- de compras con permisos de admin) pero que NO administra el panel:
--   - Accesos (cuentas de personal y sus roles),
--   - Configuración (conexión de Mercado Pago),
--   - Configuración de Club 57 (reglas de puntos, canje y referidos).
--
-- Cómo: is_admin() ahora también es verdadero para el operador, así hereda
-- de una vez las ~80 políticas y funciones que ya validan is_admin() sin
-- reescribir ninguna. Lo que el operador NO debe tocar se cierra aparte con
-- is_full_admin() (solo admin): aquí, la escritura de club57_config; en la
-- app, Accesos, Configuración/Mercado Pago y Configuración de Club 57
-- (middleware, páginas y Server Actions).
--
-- Escalada de privilegios: el operador no puede cambiarse el rol a sí mismo
-- (prevent_role_escalation solo deja cambiar el rol de una fila que YA es
-- admin) ni el de nadie más (la única política de UPDATE en profiles es la
-- de la propia fila). Las cuentas y roles de personal solo se crean y
-- cambian desde Accesos, que exige is_full_admin().
--
-- Para los admin y vendedores existentes nada cambia: mismo resultado de
-- is_admin()/is_vendedor() para ellos.

-- ---------------------------------------------------------------------
-- 1) Rol nuevo y funciones de rol
-- ---------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('customer', 'admin', 'vendedor', 'operador'));

-- Admin completo u operador (y la cuenta no está desactivada).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'operador')
      and not exists (
        select 1 from auth.users u
        where u.id = p.id and u.banned_until is not null and u.banned_until > now()
      )
  );
$$;

-- Solo admin completo: lo que el operador no puede tocar.
create or replace function public.is_full_admin()
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

-- Rol de personal de quien llama ('admin', 'operador', 'vendedor') o null
-- si no es personal activo. Para dejar registro de quién hizo qué.
create or replace function public.current_staff_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.role from public.profiles p
  where p.id = auth.uid() and p.role in ('admin', 'operador', 'vendedor')
    and not exists (
      select 1 from auth.users u
      where u.id = p.id and u.banned_until is not null and u.banned_until > now()
    );
$$;

grant execute on function public.is_full_admin() to authenticated;
grant execute on function public.current_staff_role() to authenticated;

-- ---------------------------------------------------------------------
-- 2) Configuración de Club 57: el operador la lee (la necesita para
--    calcular puntos al registrar compras), solo el admin la cambia.
-- ---------------------------------------------------------------------
drop policy if exists "Los admins administran la configuración de Club 57" on public.club57_config;

drop policy if exists "El personal de administración lee la configuración de Club 57" on public.club57_config;
create policy "El personal de administración lee la configuración de Club 57"
  on public.club57_config for select
  using (public.is_admin());

drop policy if exists "Solo el admin cambia la configuración de Club 57" on public.club57_config;
create policy "Solo el admin cambia la configuración de Club 57"
  on public.club57_config for all
  using (public.is_full_admin())
  with check (public.is_full_admin());

-- ---------------------------------------------------------------------
-- 3) Bitácora de correcciones: registra al operador como tal.
-- ---------------------------------------------------------------------
alter table public.club57_correcciones
  drop constraint if exists club57_correcciones_actor_rol_check;
alter table public.club57_correcciones
  add constraint club57_correcciones_actor_rol_check check (actor_rol in ('admin', 'operador', 'vendedor'));

-- Idéntica a la de 20261015010000_club57_correcciones_compras.sql salvo el
-- actor_rol de la bitácora, que ahora sale de current_staff_role().
create or replace function public.club57_corregir_compra(
  p_compra_id uuid,
  p_accion text,
  p_motivo text,
  p_motivo_nota text default null,
  p_monto_nuevo numeric default null,
  p_producto_nombre text default null,
  p_producto_sku text default null,
  p_fuera_de_politica boolean default false,
  p_justificacion text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_es_admin boolean := public.is_admin();
  v_es_vendedor boolean := public.is_vendedor();
  v_compra public.club57_points_ledger;
  v_raiz public.club57_points_ledger;
  v_vendedor_id uuid;
  v_nota text := nullif(btrim(coalesce(p_motivo_nota, '')), '');
  v_justificacion text := nullif(btrim(coalesce(p_justificacion, '')), '');
  v_nombre text := nullif(btrim(coalesce(p_producto_nombre, '')), '');
  v_sku text := nullif(btrim(coalesce(p_producto_sku, '')), '');
  v_fecha_local date;
  v_dias integer;
  v_fuera boolean := false;
  v_monto_por_punto numeric;
  v_puntos_nuevos integer;
  v_anulacion_id uuid;
  v_reemplazo_id uuid;
  v_correccion_id uuid;
begin
  if not v_es_admin and not v_es_vendedor then
    raise exception 'No autorizado.';
  end if;

  if p_accion not in ('cancelar', 'corregir') then
    raise exception 'Acción inválida.';
  end if;

  if p_motivo is null or p_motivo not in ('no_era_lo_que_necesitaba', 'producto_danado', 'error_de_captura', 'otro') then
    raise exception 'Elige el motivo.';
  end if;

  if p_motivo = 'otro' and v_nota is null then
    raise exception 'Escribe el motivo en la nota.';
  end if;

  if v_nota is not null and length(v_nota) > 300 then
    raise exception 'La nota es muy larga (máximo 300 caracteres).';
  end if;

  select * into v_compra
  from public.club57_points_ledger
  where id = p_compra_id
  for update;

  if not found then
    raise exception 'Compra no encontrada.';
  end if;

  if v_compra.tipo <> 'compra_manual' then
    raise exception 'Solo se pueden cancelar o corregir compras registradas en tienda.';
  end if;

  -- Un movimiento a la vez por cliente (también frena dos correcciones
  -- simultáneas de dos personas distintas).
  select creado_por_vendedor_id into v_vendedor_id
  from public.club57_members
  where id = v_compra.member_id
  for update;

  if not v_es_admin and v_vendedor_id is distinct from auth.uid() then
    raise exception 'No autorizado.';
  end if;

  if exists (select 1 from public.club57_points_ledger where anula_a = v_compra.id) then
    raise exception 'Esta compra ya fue cancelada o corregida — actualiza la página.'
      using errcode = 'F57CC';
  end if;

  -- El plazo cuenta desde la compra original: si esta compra ya es una
  -- corrección de otra, se sigue la cadena hasta la primera.
  v_raiz := v_compra;
  while v_raiz.corrige_a is not null loop
    select * into v_raiz from public.club57_points_ledger where id = v_raiz.corrige_a;
  end loop;

  v_fecha_local := (v_raiz.created_at at time zone 'America/Mexico_City')::date;
  v_dias := public.today_in_queretaro() - v_fecha_local;

  if v_dias > 7 then
    if not v_es_admin then
      raise exception 'Pasaron más de 7 días naturales desde la compra (%). Pide a un administrador que la revise.',
        to_char(v_fecha_local, 'DD/MM/YYYY')
        using errcode = 'F57PZ';
    end if;
    if not coalesce(p_fuera_de_politica, false) then
      raise exception 'Esta compra tiene más de 7 días naturales (%). Confirma que es una excepción a la política.',
        to_char(v_fecha_local, 'DD/MM/YYYY')
        using errcode = 'F57FP';
    end if;
    if v_justificacion is null or length(v_justificacion) < 10 then
      raise exception 'Escribe la justificación de la excepción (mínimo 10 caracteres).'
        using errcode = 'F57JU';
    end if;
    if length(v_justificacion) > 500 then
      raise exception 'La justificación es muy larga (máximo 500 caracteres).';
    end if;
    v_fuera := true;
  end if;

  if p_accion = 'corregir' then
    if p_monto_nuevo is null or p_monto_nuevo <= 0 then
      raise exception 'El monto debe ser un número mayor a 0.';
    end if;
    if v_nombre is null then
      raise exception 'Escribe qué compró el cliente.';
    end if;
    if round(p_monto_nuevo, 2) = v_compra.monto
       and v_nombre = coalesce(v_compra.producto_nombre, '')
       and coalesce(v_sku, '') = coalesce(v_compra.producto_sku, '') then
      raise exception 'No hay cambios que guardar.';
    end if;

    select monto_por_punto into v_monto_por_punto from public.club57_config limit 1;
    v_puntos_nuevos := floor(round(p_monto_nuevo, 2) / v_monto_por_punto);
    if v_puntos_nuevos <= 0 then
      raise exception 'Con ese monto la compra ya no genera puntos (se necesitan al menos $% MXN por punto). Si el cliente devolvió todo, usa «Cancelar compra».',
        v_monto_por_punto;
    end if;
  end if;

  -- Compensatorio: mismos puntos en negativo y en el MISMO estado y fecha
  -- de la compra original — si todavía estaba pendiente, ambos se liberan
  -- juntos y el disponible nunca se mueve; si ya estaba disponible, se
  -- descuenta del saldo de inmediato (puede quedar negativo).
  insert into public.club57_points_ledger (
    member_id, cantidad, tipo, estado, fecha_disponible, referencia,
    producto_nombre, producto_sku, monto, anula_a, motivo, motivo_nota
  )
  values (
    v_compra.member_id,
    -v_compra.cantidad,
    'cancelacion_compra',
    v_compra.estado,
    v_compra.fecha_disponible,
    case when p_accion = 'cancelar' then 'Compra en tienda cancelada' else 'Compra en tienda corregida' end,
    v_compra.producto_nombre,
    v_compra.producto_sku,
    v_compra.monto,
    v_compra.id,
    p_motivo,
    v_nota
  )
  returning id into v_anulacion_id;

  if p_accion = 'corregir' then
    insert into public.club57_points_ledger (
      member_id, cantidad, tipo, estado, fecha_disponible, referencia,
      producto_nombre, producto_sku, monto, corrige_a
    )
    values (
      v_compra.member_id,
      v_puntos_nuevos,
      'compra_manual',
      v_compra.estado,
      v_compra.fecha_disponible,
      'Compra en tienda: $' || to_char(round(p_monto_nuevo, 2), 'FM999999999990.00') || ' MXN',
      v_nombre,
      v_sku,
      round(p_monto_nuevo, 2),
      v_compra.id
    )
    returning id into v_reemplazo_id;
  end if;

  insert into public.club57_correcciones (
    member_id, compra_id, accion, motivo, motivo_nota, fuera_de_politica, justificacion,
    anulacion_id, reemplazo_id, puntos_anulados, puntos_nuevos,
    monto_anterior, monto_nuevo, producto_anterior, producto_nuevo,
    fecha_compra, dias_transcurridos, actor_id, actor_rol
  )
  values (
    v_compra.member_id,
    v_compra.id,
    case when p_accion = 'cancelar' then 'cancelada' else 'corregida' end,
    p_motivo,
    v_nota,
    v_fuera,
    case when v_fuera then v_justificacion else null end,
    v_anulacion_id,
    v_reemplazo_id,
    v_compra.cantidad,
    v_puntos_nuevos,
    v_compra.monto,
    case when p_accion = 'corregir' then round(p_monto_nuevo, 2) else null end,
    v_compra.producto_nombre,
    case when p_accion = 'corregir' then v_nombre else null end,
    v_raiz.created_at,
    v_dias,
    auth.uid(),
    coalesce(public.current_staff_role(), 'vendedor')
  )
  returning id into v_correccion_id;

  return jsonb_build_object(
    'correccion_id', v_correccion_id,
    'puntos_anulados', v_compra.cantidad,
    'puntos_nuevos', v_puntos_nuevos,
    'fuera_de_politica', v_fuera
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Asignar o cambiar el vendedor de un cliente de Club 57.
--
-- club57_members.creado_por_vendedor_id pasa a significar «vendedor
-- asignado» (el nombre se conserva para no tocar el resto del código):
-- quien lo tenga ve al cliente, le registra compras y las corrige dentro
-- del plazo. Las compras ya registradas no cambian. Cada cambio queda en
-- club57_asignaciones_vendedor.
-- ---------------------------------------------------------------------
create table if not exists public.club57_asignaciones_vendedor (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.club57_members (id) on delete cascade,
  vendedor_anterior_id uuid references public.profiles (id) on delete set null,
  vendedor_nuevo_id uuid references public.profiles (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  actor_rol text not null check (actor_rol in ('admin', 'operador')),
  created_at timestamptz not null default now()
);

create index if not exists club57_asignaciones_vendedor_member_idx
  on public.club57_asignaciones_vendedor (member_id, created_at desc);

alter table public.club57_asignaciones_vendedor enable row level security;

drop policy if exists "Los admins leen las asignaciones de vendedor" on public.club57_asignaciones_vendedor;
create policy "Los admins leen las asignaciones de vendedor"
  on public.club57_asignaciones_vendedor for select
  using (public.is_admin());

create or replace function public.club57_asignar_vendedor(p_member_id uuid, p_vendedor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actual uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;

  select creado_por_vendedor_id into v_actual
  from public.club57_members
  where id = p_member_id
  for update;

  if not found then
    raise exception 'Cliente no encontrado.';
  end if;

  if p_vendedor_id is not null and not exists (
    select 1 from public.profiles p
    where p.id = p_vendedor_id and p.role = 'vendedor'
      and not exists (
        select 1 from auth.users u
        where u.id = p.id and u.banned_until is not null and u.banned_until > now()
      )
  ) then
    raise exception 'Ese vendedor no existe o su cuenta está desactivada.';
  end if;

  if v_actual is not distinct from p_vendedor_id then
    raise exception 'El cliente ya tiene ese vendedor.';
  end if;

  update public.club57_members
  set creado_por_vendedor_id = p_vendedor_id
  where id = p_member_id;

  insert into public.club57_asignaciones_vendedor (member_id, vendedor_anterior_id, vendedor_nuevo_id, actor_id, actor_rol)
  values (p_member_id, v_actual, p_vendedor_id, auth.uid(), public.current_staff_role());
end;
$$;

revoke all on function public.club57_asignar_vendedor(uuid, uuid) from public, anon;
grant execute on function public.club57_asignar_vendedor(uuid, uuid) to authenticated;
