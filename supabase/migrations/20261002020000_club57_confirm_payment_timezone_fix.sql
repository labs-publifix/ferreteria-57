-- confirm_order_payment() calculaba fecha_disponible con current_date (huso
-- del servidor, UTC en Supabase) en vez de public.today_in_queretaro() —
-- el mismo bug que 20260928010000_club57_timezone_fix.sql ya corrigió en
-- create_order()/promote_due_club57_points()/promote_due_club57_points_for_member(),
-- pero confirm_order_payment() se creó DOS DÍAS DESPUÉS (20260930020000,
-- al mover el otorgamiento de puntos de create_order() a la confirmación
-- de pago de Mercado Pago) y no heredó ese fix. Entre las 6pm y medianoche
-- hora de Querétaro corre el periodo de espera un día de más o de menos,
-- según la hora exacta del pago. Idéntica carácter por carácter a
-- 20260930020000, solo cambia current_date -> public.today_in_queretaro()
-- en el cálculo (línea de fecha_disponible del bloque de compra_online).
create or replace function public.confirm_order_payment(
  p_order_id uuid,
  p_mp_payment_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status text;
  v_customer_email text;
  v_subtotal numeric;
  v_member_id uuid;
  v_referred_by uuid;
  v_monto_por_punto numeric;
  v_dias_espera integer;
  v_puntos integer;
  v_is_first_purchase boolean;
  v_puntos_referidor integer;
  v_puntos_referido integer;
begin
  select status, customer_email, subtotal
    into v_current_status, v_customer_email, v_subtotal
  from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  -- Ya estaba pagado (reintento del webhook): no hacer nada, ni
  -- reescribir mp_payment_id ni volver a otorgar puntos.
  if v_current_status = 'pagado' then
    return;
  end if;

  if v_current_status <> 'pendiente_pago' then
    raise exception 'No se puede confirmar el pago de un pedido en estatus %.', v_current_status;
  end if;

  update public.orders
  set status = 'pagado', mp_payment_id = p_mp_payment_id
  where id = p_order_id;

  -- Club 57: mismo bloque que antes vivía dentro de create_order() (ver
  -- 20260925010000) — solo se movió el momento en que corre, la lógica en
  -- sí es idéntica carácter por carácter.
  begin
    select club57_members.id, club57_members.referred_by into v_member_id, v_referred_by
    from public.club57_members
    where lower(email) = lower(v_customer_email)
    limit 1;

    if v_member_id is not null then
      select monto_por_punto, dias_espera_pendiente into v_monto_por_punto, v_dias_espera
      from public.club57_config
      limit 1;

      v_puntos := floor(v_subtotal / v_monto_por_punto);

      select not exists (
        select 1 from public.club57_points_ledger
        where member_id = v_member_id and tipo = 'compra_online'
      ) into v_is_first_purchase;

      if v_puntos > 0 then
        insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, fecha_disponible, referencia)
        values (
          v_member_id, v_puntos, 'compra_online', 'pendiente',
          public.today_in_queretaro() + v_dias_espera, p_order_id::text
        );
      end if;

      if v_is_first_purchase and v_referred_by is not null then
        select puntos_referidor, puntos_referido into v_puntos_referidor, v_puntos_referido
        from public.club57_config
        limit 1;

        insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, referencia)
        values (v_referred_by, v_puntos_referidor, 'referido_bono', 'disponible', 'Bono por referir — primera compra de tu referido');

        insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, referencia)
        values (v_member_id, v_puntos_referido, 'referido_bono', 'disponible', 'Bono de bienvenida por referido');
      end if;
    end if;
  exception when others then
    raise warning 'Club 57: no se pudieron aplicar puntos al pedido %: %', p_order_id, sqlerrm;
  end;
end;
$$;
