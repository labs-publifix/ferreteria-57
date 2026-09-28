-- update_order_status() confiaba en que quien la llama (el Server Action
-- de /admin/pedidos, que sí valida con isValidStatusTransition() antes de
-- invocar el RPC) ya hubiera comprobado que la transición es válida — el
-- propio RPC, siendo SECURITY DEFINER y "el único camino sancionado" según
-- su comentario original, no lo exigía él mismo. Un admin autenticado que
-- invocara el RPC directo (saltándose el Server Action, p. ej. desde la
-- consola del navegador) podía reabrir un pedido ya 'entregado' o
-- 'cancelado', o saltarse pasos de la secuencia. Detectado al agregar el
-- estatus "entregado" al selector y verificar la regla "no se puede
-- cancelar/mover un pedido ya entregado" — la más segura es que sea
-- imposible a nivel base de datos, no solo que la UI no lo ofrezca.
--
-- Este create or replace agrega la validación de transición (espejo
-- exacto de getAvailableNextStatuses() en lib/orders/status.ts, que
-- ahora también permite saltar directo a "entregado" desde cualquier
-- estatus no terminal, p. ej. retiro inmediato en mostrador) al
-- principio de la función; el resto (reversión de stock y puntos al
-- cancelar) queda carácter por carácter igual que en 20260925010000.
create or replace function public.update_order_status(
  p_order_id uuid,
  p_expected_status text,
  p_new_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status text;
  v_fulfillment_type text;
  v_order_number text;
  v_original_movement record;
  v_sequence text[];
  v_current_idx int;
  v_expected_next text;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;

  select status, fulfillment_type, order_number
    into v_current_status, v_fulfillment_type, v_order_number
  from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  if v_current_status is distinct from p_expected_status then
    raise exception 'Este pedido ya cambió de estatus — actualiza la página e intenta de nuevo.'
      using errcode = 'F57ST';
  end if;

  -- Terminal de verdad: ni cancelado ni entregado admiten NINGÚN cambio
  -- más, ni siquiera otro "cancelado" — es la regla más segura para
  -- "no se puede cancelar un pedido ya entregado".
  if v_current_status in ('entregado', 'cancelado') then
    raise exception 'Este pedido ya está en un estatus final y no admite más cambios.'
      using errcode = 'F57ST';
  end if;

  -- pickup nunca pasa por "enviado" (ver SEQUENCE_BY_FULFILLMENT en
  -- lib/orders/status.ts); local_delivery y foráneo sí.
  v_sequence := case v_fulfillment_type
    when 'pickup' then array['pendiente_pago', 'pagado', 'preparando', 'listo', 'entregado']
    else array['pendiente_pago', 'pagado', 'preparando', 'listo', 'enviado', 'entregado']
  end;

  v_current_idx := array_position(v_sequence, v_current_status);
  v_expected_next := case
    when v_current_idx is not null and v_current_idx < array_length(v_sequence, 1)
      then v_sequence[v_current_idx + 1]
    else null
  end;

  -- Avances válidos: el siguiente exacto de la secuencia, "entregado"
  -- como atajo disponible desde cualquier estatus no terminal (retiro
  -- inmediato en mostrador, p. ej.), o "cancelado" — mismo criterio que
  -- getAvailableNextStatuses() en lib/orders/status.ts. Ningún otro salto
  -- (p. ej. pagado -> listo) se permite.
  if p_new_status is distinct from v_expected_next
     and p_new_status is distinct from 'entregado'
     and p_new_status is distinct from 'cancelado' then
    raise exception 'Transición de estatus inválida: % -> %.', v_current_status, p_new_status
      using errcode = 'F57ST';
  end if;

  update public.orders set status = p_new_status where id = p_order_id;

  -- Restaura stock solo al ENTRAR a cancelado (nunca si ya estaba
  -- cancelado, lo cual ya es imposible llegar aquí de todas formas porque
  -- getAvailableNextStatuses() nunca ofrece "cancelado" como opción desde
  -- un pedido ya cancelado — este chequeo es solo la segunda capa).
  -- variant_id nulo (variante borrada después de la compra) se ignora
  -- solo: el UPDATE no encuentra a quién sumarle el stock y no hace nada.
  if p_new_status = 'cancelado' and v_current_status is distinct from 'cancelado' then
    update public.product_variants pv
    set stock = pv.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.variant_id = pv.id;

    -- Club 57: si este pedido había generado puntos (compra_online con
    -- referencia = este order_id), se revierte con una entrada NUEVA y
    -- negativa por la misma cantidad exacta — el movimiento original
    -- nunca se edita (ver el comentario de "append-only" en
    -- club57_points_ledger, migración 20260921010000). El reembolso queda
    -- en el mismo estado en el que esté el original AHORA MISMO (si ya
    -- pasó a 'disponible' y el cliente ya lo gastó, esto puede dejarlo en
    -- negativo — caso de negocio explícitamente fuera de alcance aquí).
    begin
      select * into v_original_movement
      from public.club57_points_ledger
      where tipo = 'compra_online' and referencia = p_order_id::text
      limit 1;

      if found then
        insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, referencia)
        values (
          v_original_movement.member_id,
          -v_original_movement.cantidad,
          'reversion_cancelacion',
          v_original_movement.estado,
          'Cancelación pedido ' || v_order_number
        );
      end if;
    exception when others then
      raise warning 'Club 57: no se pudo revertir puntos del pedido %: %', p_order_id, sqlerrm;
    end;
  end if;
end;
$$;
