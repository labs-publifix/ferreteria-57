-- delete_orders(): permite al admin borrar desde /admin/pedidos los
-- pedidos de prueba que nunca se pagaron (carritos/checkouts abandonados
-- antes de completar el pago en Mercado Pago) o que ya se cancelaron —
-- nunca uno con estatus 'pagado' en adelante, para que este atajo jamás
-- pueda borrar una venta real ni su historial.
--
-- 'pendiente_pago' es el único caso que necesita algo más que un DELETE:
-- create_order() ya decrementó el stock al crear el pedido (antes de
-- saber si se iba a pagar, ver 20260930020000), y ese stock solo se
-- devuelve hoy vía confirm_order_payment()/mark_order_payment_failed()
-- (el webhook de Mercado Pago) o al cancelar a mano desde
-- update_order_status(). Un pedido abandonado que nunca llegó a ninguno
-- de esos dos caminos se queda con el stock reservado para siempre si
-- solo se borra la fila — por eso aquí se restaura primero, mismo patrón
-- que mark_order_payment_failed(). 'cancelado' ya pasó por ese mismo
-- restauro cuando se canceló, así que no se repite (evita duplicar
-- stock).
create or replace function public.delete_orders(p_order_ids uuid[])
returns table (deleted_count integer, skipped_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_deleted integer := 0;
  v_skipped integer := 0;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;

  for v_order in
    select id, status from public.orders where id = any(p_order_ids) for update
  loop
    if v_order.status not in ('pendiente_pago', 'cancelado') then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    if v_order.status = 'pendiente_pago' then
      update public.product_variants pv
      set stock = pv.stock + oi.quantity
      from public.order_items oi
      where oi.order_id = v_order.id
        and oi.variant_id = pv.id;
    end if;

    -- order_items tiene "on delete cascade" desde orders (ver
    -- 20260917010000) — se borran solos con este DELETE.
    delete from public.orders where id = v_order.id;
    v_deleted := v_deleted + 1;
  end loop;

  return query select v_deleted, v_skipped;
end;
$$;
