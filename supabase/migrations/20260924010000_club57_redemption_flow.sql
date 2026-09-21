-- Club 57 — flujo de solicitud de canje: el cliente pide canjear un
-- artículo del catálogo desde /cuenta. Se valida y descuenta su saldo AL
-- MOMENTO de pedirlo (mismo criterio que create_order descuenta stock al
-- confirmar, no al entregar) y el canje queda 'pendiente' hasta que un
-- vendedor lo entregue en persona desde /admin/lealtad/canjes. Puramente
-- aditivo: solo dos funciones nuevas + sus grants, ningún ALTER sobre lo
-- que ya existe.

-- request_club57_redemption(): SECURITY DEFINER porque club57_points_ledger
-- y club57_redemptions no tienen (a propósito) política de INSERT para el
-- propio miembro — esta función es la única puerta para que un cliente
-- registre un canje, así que valida todo ella misma. Bloquea la fila del
-- artículo con FOR UPDATE para que dos canjes casi simultáneos del último
-- artículo en stock nunca dejen stock negativo, mismo patrón que
-- create_order con product_variants (20260919010000_stock_and_cancel.sql).
create or replace function public.request_club57_redemption(p_item_id uuid)
returns public.club57_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid := auth.uid();
  v_item record;
  v_saldo integer;
  v_redemption public.club57_redemptions;
begin
  if v_member_id is null or not exists (select 1 from public.club57_members where id = v_member_id) then
    raise exception 'No autorizado.';
  end if;

  select * into v_item
  from public.club57_redemption_catalog
  where id = p_item_id and active
  for update;

  if not found then
    raise exception 'Este artículo ya no está disponible.';
  end if;

  if v_item.stock <= 0 then
    raise exception 'Este artículo ya no tiene stock disponible.'
      using errcode = 'F57NS';
  end if;

  select coalesce(sum(cantidad), 0) into v_saldo
  from public.club57_points_ledger
  where member_id = v_member_id and estado = 'disponible';

  if v_saldo < v_item.costo_puntos then
    raise exception 'No tienes puntos suficientes para canjear este artículo.'
      using errcode = 'F57PI';
  end if;

  update public.club57_redemption_catalog
  set stock = stock - 1
  where id = p_item_id;

  insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, referencia)
  values (v_member_id, -v_item.costo_puntos, 'canje', 'disponible', 'Canje: ' || v_item.nombre);

  insert into public.club57_redemptions (member_id, item_id, puntos_usados, estado)
  values (v_member_id, p_item_id, v_item.costo_puntos, 'pendiente')
  returning * into v_redemption;

  return v_redemption;
end;
$$;

grant execute on function public.request_club57_redemption(uuid) to authenticated;

-- update_club57_redemption_status(): único camino para que un admin marque
-- un canje como entregado o lo cancele — mismo patrón de
-- update_order_status (lock de fila + estado esperado implícito en el
-- "for update" + is_admin() adentro, porque no hay política de UPDATE
-- pública sobre club57_redemptions para vendedores). Cancelar reembolsa
-- los puntos (ledger tipo 'reversion_cancelacion', el mismo tipo que ya
-- usa el ledger para revertir una compra cancelada) y restaura el stock
-- del artículo — entregar no toca ni puntos ni stock, ya se descontaron
-- al solicitar el canje.
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
begin
  if not public.is_admin() then
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

grant execute on function public.update_club57_redemption_status(uuid, text) to authenticated;

-- "Mis canjes" en /cuenta necesita mostrar el nombre del artículo de cada
-- solicitud, incluso si ese artículo se desactiva después (nunca deja de
-- existir por el "on delete restrict" de club57_redemptions.item_id, pero
-- la política de lectura pública solo cubre artículos activos). Esta
-- política adicional deja que un miembro lea, puntualmente, el artículo
-- de un canje que YA le pertenece — nunca el catálogo inactivo completo.
drop policy if exists "Los miembros ven artículos que ya canjearon" on public.club57_redemption_catalog;
create policy "Los miembros ven artículos que ya canjearon"
  on public.club57_redemption_catalog for select
  using (
    exists (
      select 1 from public.club57_redemptions r
      where r.item_id = club57_redemption_catalog.id and r.member_id = auth.uid()
    )
  );
