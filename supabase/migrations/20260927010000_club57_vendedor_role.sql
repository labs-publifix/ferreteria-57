-- Club 57 — rol "vendedor": alta y atención de clientes desde mostrador,
-- con acceso restringido a SUS PROPIOS clientes (los que él mismo dio de
-- alta). Estrictamente aditivo: ningún ALTER quita nada, ninguna política
-- ni función existente se reemplaza con lógica distinta para admin — solo
-- se le agregan ramas nuevas a las funciones que ya validaban is_admin(),
-- dejando el camino de admin exactamente como estaba.

-- ---------------------------------------------------------------------
-- 1) 'vendedor' como valor válido de profiles.role, junto a los que ya
--    existen. prevent_role_escalation() (migración 20260910040000) ya
--    protege este tercer valor sin cambios: bloquea cualquier cambio de
--    rol hecho por un no-admin desde el cliente salvo que la fila YA fuera
--    admin, sin importar cuántos valores tenga el CHECK.
-- ---------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('customer', 'admin', 'vendedor'));

create or replace function public.is_vendedor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'vendedor'
  );
$$;

-- ---------------------------------------------------------------------
-- 2) club57_members.creado_por_vendedor_id: se llena solo cuando un
--    vendedor da de alta al cliente (ver createClub57Member en
--    app/.../lealtad/clientes/actions.ts) — queda null para autoregistro
--    online (handle_new_user, sin cambios) y para alta hecha por un admin
--    completo.
-- ---------------------------------------------------------------------
alter table public.club57_members
  add column if not exists creado_por_vendedor_id uuid references public.profiles (id) on delete set null;

create index if not exists club57_members_creado_por_vendedor_id_idx
  on public.club57_members (creado_por_vendedor_id);

-- ---------------------------------------------------------------------
-- 3) RLS: un vendedor lee (nunca escribe directo, todo pasa por Server
--    Actions/RPCs que ya validan is_admin() o, ahora, is_vendedor() +
--    dueño) solo lo que corresponde a sus propios clientes. Estas
--    políticas son ADICIONALES a las de admin/miembro que ya existían —
--    ninguna se reemplaza.
-- ---------------------------------------------------------------------
drop policy if exists "Los vendedores ven a sus propios clientes" on public.club57_members;
create policy "Los vendedores ven a sus propios clientes"
  on public.club57_members for select
  using (public.is_vendedor() and creado_por_vendedor_id = auth.uid());

drop policy if exists "Los vendedores ven el historial de sus clientes" on public.club57_points_ledger;
create policy "Los vendedores ven el historial de sus clientes"
  on public.club57_points_ledger for select
  using (
    public.is_vendedor() and exists (
      select 1 from public.club57_members m
      where m.id = club57_points_ledger.member_id and m.creado_por_vendedor_id = auth.uid()
    )
  );

-- Necesaria para que registerClub57ManualPurchase (RLS normal, sin
-- service_role) pueda insertar el movimiento de una compra en mostrador
-- cuando quien la registra es un vendedor.
drop policy if exists "Los vendedores registran movimientos de sus clientes" on public.club57_points_ledger;
create policy "Los vendedores registran movimientos de sus clientes"
  on public.club57_points_ledger for insert
  with check (
    public.is_vendedor() and exists (
      select 1 from public.club57_members m
      where m.id = club57_points_ledger.member_id and m.creado_por_vendedor_id = auth.uid()
    )
  );

drop policy if exists "Los vendedores ven canjes de sus clientes" on public.club57_redemptions;
create policy "Los vendedores ven canjes de sus clientes"
  on public.club57_redemptions for select
  using (
    public.is_vendedor() and exists (
      select 1 from public.club57_members m
      where m.id = club57_redemptions.member_id and m.creado_por_vendedor_id = auth.uid()
    )
  );

-- registerClub57ManualPurchase necesita leer monto_por_punto/
-- dias_espera_pendiente con el cliente normal (RLS) cuando quien llama es
-- vendedor — la política de admin ya existente sigue intacta, esta es
-- puramente de lectura y adicional.
drop policy if exists "Los vendedores leen la configuración de Club 57" on public.club57_config;
create policy "Los vendedores leen la configuración de Club 57"
  on public.club57_config for select
  using (public.is_vendedor());

-- club57_redemption_catalog: sin cambios — "Cualquiera lee el catálogo de
-- canje activo" (using (active or is_admin())) ya deja ver a un vendedor
-- (autenticado, no admin) los artículos activos con su stock, que es
-- exactamente "ver, no editar" pedido en este prompt.

-- ---------------------------------------------------------------------
-- 4) update_club57_redemption_status(): idéntica para admin (mismo orden
--    de validaciones, mismo mensaje "No autorizado." cuando ni admin ni
--    vendedor dueño). Un vendedor solo puede resolver canjes de clientes
--    con creado_por_vendedor_id = su propio id.
-- ---------------------------------------------------------------------
create or replace function public.update_club57_redemption_status(
  p_redemption_id uuid,
  p_new_estado text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption record;
  v_es_admin boolean := public.is_admin();
  v_es_vendedor boolean := public.is_vendedor();
begin
  if not v_es_admin and not v_es_vendedor then
    raise exception 'No autorizado.';
  end if;

  if p_new_estado not in ('entregado', 'cancelado') then
    raise exception 'Estatus inválido: %', p_new_estado;
  end if;

  select * into v_redemption
  from public.club57_redemptions
  where id = p_redemption_id
  for update;

  if not found then
    raise exception 'Canje no encontrado.';
  end if;

  if not v_es_admin then
    if not exists (
      select 1 from public.club57_members m
      where m.id = v_redemption.member_id and m.creado_por_vendedor_id = auth.uid()
    ) then
      raise exception 'No autorizado.';
    end if;
  end if;

  if v_redemption.estado <> 'pendiente' then
    raise exception 'Este canje ya fue resuelto — actualiza la página e intenta de nuevo.'
      using errcode = 'F57ST';
  end if;

  update public.club57_redemptions set estado = p_new_estado where id = p_redemption_id;

  if p_new_estado = 'cancelado' then
    insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, referencia)
    select
      v_redemption.member_id,
      v_redemption.puntos_usados,
      'reversion_cancelacion',
      'disponible',
      'Cancelación de canje: ' || c.nombre
    from public.club57_redemption_catalog c
    where c.id = v_redemption.item_id;

    update public.club57_redemption_catalog
    set stock = stock + 1
    where id = v_redemption.item_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 5) promote_due_club57_points_for_member(): mismo criterio — admin sin
--    cambios, vendedor solo sobre sus propios clientes. La usa
--    /admin/lealtad/clientes/[id] y, ahora, /admin/vendedor/clientes/[id].
-- ---------------------------------------------------------------------
create or replace function public.promote_due_club57_points_for_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if not (
      public.is_vendedor() and exists (
        select 1 from public.club57_members m
        where m.id = p_member_id and m.creado_por_vendedor_id = auth.uid()
      )
    ) then
      raise exception 'No autorizado.';
    end if;
  end if;

  update public.club57_points_ledger
  set estado = 'disponible'
  where member_id = p_member_id and estado = 'pendiente' and fecha_disponible <= current_date;
end;
$$;
