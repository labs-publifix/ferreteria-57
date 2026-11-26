-- Club 57 Empresarial · puntos a favor de la empresa.
--
-- Las compras con «Cargo a mi empresa» generan puntos Club 57 para la
-- EMPRESA, no para el colaborador (las compras que el colaborador paga con
-- tarjeta siguen sumando a su propia cuenta, como cualquier miembro):
--   - al autorizarse el pedido, sus puntos entran «pendientes» al saldo de
--     la empresa;
--   - al registrarse el pago del corte, quedan «disponibles»;
--   - si el pedido se cancela, se revierten.
-- La empresa solo usa sus puntos para canjear artículos del catálogo de
-- canje de Club 57 (nunca como saldo a favor) y no puede cederlos a sus
-- colaboradores: no existe ninguna función que los traspase.
--
-- Los pedidos con cargo a empresa que ya habían generado puntos al
-- colaborador se traspasan a la empresa (y se compensan en la cuenta del
-- colaborador).
--
-- Idempotente: se puede correr más de una vez.

-- ---------------------------------------------------------------------
-- 1) Saldo de puntos de la empresa (solo inserciones vía funciones)
-- ---------------------------------------------------------------------
create table if not exists public.club57_empresa_puntos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.club57_empresas (id) on delete cascade,
  cantidad integer not null check (cantidad <> 0),
  tipo text not null check (tipo in ('compra_empresa', 'reversion_cancelacion', 'canje', 'reversion_canje')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'disponible')),
  order_id uuid references public.orders (id) on delete set null,
  canje_id uuid,
  referencia text,
  fecha_disponible date,
  created_at timestamptz not null default now()
);

create index if not exists club57_empresa_puntos_empresa_idx on public.club57_empresa_puntos (empresa_id);
create index if not exists club57_empresa_puntos_order_idx on public.club57_empresa_puntos (order_id);
create unique index if not exists club57_empresa_puntos_compra_unica
  on public.club57_empresa_puntos (order_id) where tipo = 'compra_empresa';
create unique index if not exists club57_empresa_puntos_reversion_unica
  on public.club57_empresa_puntos (order_id) where tipo = 'reversion_cancelacion';

alter table public.club57_empresa_puntos enable row level security;

drop policy if exists "El responsable ve los puntos de su empresa" on public.club57_empresa_puntos;
create policy "El responsable ve los puntos de su empresa"
  on public.club57_empresa_puntos for select
  using (
    exists (
      select 1 from public.club57_empresas e
      where e.id = empresa_id and e.responsable_user_id is not null and e.responsable_user_id = auth.uid()
    )
  );

drop policy if exists "Los admins ven los puntos de las empresas" on public.club57_empresa_puntos;
create policy "Los admins ven los puntos de las empresas"
  on public.club57_empresa_puntos for select
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 2) Canjes de la empresa (catálogo de canje de Club 57)
-- ---------------------------------------------------------------------
create table if not exists public.club57_empresa_canjes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.club57_empresas (id) on delete cascade,
  item_id uuid not null references public.club57_redemption_catalog (id) on delete restrict,
  puntos_usados integer not null check (puntos_usados > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'entregado', 'cancelado')),
  solicitado_por uuid,
  resuelto_por uuid,
  resuelto_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists club57_empresa_canjes_empresa_idx on public.club57_empresa_canjes (empresa_id);

alter table public.club57_empresa_canjes enable row level security;

drop policy if exists "El responsable ve los canjes de su empresa" on public.club57_empresa_canjes;
create policy "El responsable ve los canjes de su empresa"
  on public.club57_empresa_canjes for select
  using (
    exists (
      select 1 from public.club57_empresas e
      where e.id = empresa_id and e.responsable_user_id is not null and e.responsable_user_id = auth.uid()
    )
  );

drop policy if exists "Los admins ven los canjes de las empresas" on public.club57_empresa_canjes;
create policy "Los admins ven los canjes de las empresas"
  on public.club57_empresa_canjes for select
  using (public.is_admin());

-- Saldo de una empresa (responsable de esa empresa o admin).
create or replace function public.club57_empresa_puntos_saldo(p_empresa_id uuid)
returns table (disponible integer, pendiente integer)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() and p_empresa_id is distinct from public.club57_mi_empresa_responsable() then
    raise exception 'No autorizado.';
  end if;
  return query
  select
    coalesce(sum(cantidad) filter (where estado = 'disponible'), 0)::integer,
    coalesce(sum(cantidad) filter (where estado = 'pendiente'), 0)::integer
  from public.club57_empresa_puntos
  where empresa_id = p_empresa_id;
end;
$$;

revoke all on function public.club57_empresa_puntos_saldo(uuid) from public, anon;
grant execute on function public.club57_empresa_puntos_saldo(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3) Autorizar → puntos pendientes de la empresa; cancelar → reversión
-- ---------------------------------------------------------------------
create or replace function public.club57_pedido_empresa_puntos_y_ajustes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_monto numeric;
  v_puntos integer;
  v_ciclo public.club57_ciclos;
  v_mov public.club57_empresa_puntos;
begin
  if new.metodo_pago <> 'empresa' then
    return new;
  end if;

  -- Puntos Club 57 de la empresa en «pendiente» (se liberan cuando paga el corte).
  if old.status = 'pendiente_autorizacion' and new.status = 'pagado' and new.empresa_id is not null then
    begin
      select monto_por_punto into v_monto from public.club57_config limit 1;
      v_puntos := floor(new.subtotal / nullif(v_monto, 0));
      if coalesce(v_puntos, 0) > 0
         and not exists (select 1 from public.club57_empresa_puntos where tipo = 'compra_empresa' and order_id = new.id) then
        insert into public.club57_empresa_puntos (empresa_id, cantidad, tipo, estado, order_id, referencia)
        values (new.empresa_id, v_puntos, 'compra_empresa', 'pendiente', new.id, 'Pedido ' || new.order_number);
      end if;
    exception when others then
      raise warning 'Club 57: no se pudieron generar puntos de empresa del pedido %: %', new.id, sqlerrm;
    end;
  end if;

  if new.status = 'cancelado' and old.status is distinct from 'cancelado' then
    -- Se revierten los puntos de la empresa (pendientes o ya disponibles).
    begin
      select * into v_mov from public.club57_empresa_puntos
      where tipo = 'compra_empresa' and order_id = new.id
      limit 1;
      if found and not exists (
        select 1 from public.club57_empresa_puntos where tipo = 'reversion_cancelacion' and order_id = new.id
      ) then
        insert into public.club57_empresa_puntos (empresa_id, cantidad, tipo, estado, order_id, referencia)
        values (v_mov.empresa_id, -v_mov.cantidad, 'reversion_cancelacion', v_mov.estado, new.id,
                'Cancelación pedido ' || new.order_number);
      end if;
    exception when others then
      raise warning 'Club 57: no se pudieron revertir puntos de empresa del pedido %: %', new.id, sqlerrm;
    end;

    -- Cancelado después de facturarse: saldo a favor en el ciclo abierto.
    if new.ciclo_id is not null then
      select * into v_ciclo from public.club57_ciclos where id = new.ciclo_id;
      if v_ciclo.estado in ('facturado', 'pagado', 'vencido') then
        insert into public.club57_ciclo_ajustes (ciclo_id, empresa_id, order_id, monto, concepto)
        values (
          public.club57_ciclo_para(new.empresa_id, public.today_in_queretaro()),
          new.empresa_id, new.id, -new.total,
          'Saldo a favor: pedido ' || new.order_number || ' cancelado después del corte del ' || to_char(v_ciclo.periodo_fin, 'DD/MM/YYYY')
        );
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists club57_orders_puntos_ajustes on public.orders;
create trigger club57_orders_puntos_ajustes
  after update of status on public.orders
  for each row execute function public.club57_pedido_empresa_puntos_y_ajustes();

-- ---------------------------------------------------------------------
-- 4) Registrar el pago del corte: libera el crédito y los puntos de la
--    empresa, y la reactiva si estaba suspendida por pago vencido.
-- ---------------------------------------------------------------------
create or replace function public.club57_admin_registrar_pago(
  p_ciclo_id uuid,
  p_fecha date,
  p_monto numeric,
  p_referencia text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c public.club57_ciclos;
  v_reactivada boolean := false;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;
  select * into v_c from public.club57_ciclos where id = p_ciclo_id for update;
  if not found then
    raise exception 'Corte no encontrado.';
  end if;
  if v_c.estado not in ('facturado', 'vencido') then
    raise exception 'Registra primero la factura de este corte.';
  end if;
  if p_fecha is null or p_monto is null or p_monto <= 0 then
    raise exception 'Captura la fecha y el monto del pago.';
  end if;

  update public.club57_ciclos
  set estado = 'pagado', pago_fecha = p_fecha, pago_monto = round(p_monto, 2),
      pago_referencia = nullif(btrim(coalesce(p_referencia, '')), ''), pagado_at = now(), pago_por = auth.uid()
  where id = p_ciclo_id;

  -- Puntos Club 57 de la empresa por los pedidos del ciclo: quedan disponibles.
  update public.club57_empresa_puntos l
  set estado = 'disponible', fecha_disponible = public.today_in_queretaro()
  from public.orders o
  where o.ciclo_id = p_ciclo_id and o.status <> 'cancelado'
    and l.tipo = 'compra_empresa' and l.order_id = o.id and l.estado = 'pendiente';

  insert into public.club57_empresas_bitacora (empresa_id, accion, detalle, actor_id)
  values (v_c.empresa_id, 'corte', 'Pago registrado del corte del ' || to_char(v_c.periodo_fin, 'DD/MM/YYYY') || ': ' || to_char(p_monto, 'FM$999,999,990.00'), auth.uid());

  if not exists (select 1 from public.club57_ciclos where empresa_id = v_c.empresa_id and estado = 'vencido') then
    update public.club57_empresas
    set estado = 'activa', suspendida_por_pago = false, motivo_estado = null
    where id = v_c.empresa_id and estado = 'suspendida' and suspendida_por_pago;
    v_reactivada := found;
    if v_reactivada then
      insert into public.club57_empresas_bitacora (empresa_id, accion, detalle, actor_id)
      values (v_c.empresa_id, 'reactivada', 'Automática: pago registrado', auth.uid());
    end if;
  end if;
  return v_reactivada;
end;
$$;

revoke all on function public.club57_admin_registrar_pago(uuid, date, numeric, text) from public, anon;
grant execute on function public.club57_admin_registrar_pago(uuid, date, numeric, text) to authenticated;

-- ---------------------------------------------------------------------
-- 5) Portal Empresa: saldo, movimientos y canjes; solicitar un canje
-- ---------------------------------------------------------------------
create or replace function public.club57_portal_puntos()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_empresa uuid := public.club57_requiere_responsable();
begin
  return jsonb_build_object(
    'disponible', (select coalesce(sum(cantidad), 0) from public.club57_empresa_puntos where empresa_id = v_empresa and estado = 'disponible'),
    'pendiente', (select coalesce(sum(cantidad), 0) from public.club57_empresa_puntos where empresa_id = v_empresa and estado = 'pendiente'),
    'movimientos', coalesce((
      select jsonb_agg(x order by x->>'created_at' desc)
      from (
        select jsonb_build_object(
          'id', p.id, 'cantidad', p.cantidad, 'tipo', p.tipo, 'estado', p.estado,
          'referencia', p.referencia, 'created_at', p.created_at
        ) as x
        from public.club57_empresa_puntos p
        where p.empresa_id = v_empresa
        order by p.created_at desc
        limit 100
      ) t
    ), '[]'::jsonb),
    'canjes', coalesce((
      select jsonb_agg(x order by x->>'created_at' desc)
      from (
        select jsonb_build_object(
          'id', c.id, 'nombre', i.nombre, 'puntos', c.puntos_usados, 'estado', c.estado, 'created_at', c.created_at
        ) as x
        from public.club57_empresa_canjes c
        join public.club57_redemption_catalog i on i.id = c.item_id
        where c.empresa_id = v_empresa
        order by c.created_at desc
        limit 100
      ) t
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.club57_portal_puntos() from public, anon;
grant execute on function public.club57_portal_puntos() to authenticated;

-- Solicitar un canje: valida y descuenta al momento; queda pendiente de
-- entrega en tienda. Solo con la empresa activa.
create or replace function public.club57_portal_canjear(p_item_id uuid)
returns public.club57_empresa_canjes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid := public.club57_requiere_responsable();
  v_item record;
  v_saldo integer;
  v_canje public.club57_empresa_canjes;
begin
  if (select estado from public.club57_empresas where id = v_empresa) <> 'activa' then
    raise exception 'Tu empresa está suspendida: podrás canjear puntos cuando se reactive.';
  end if;

  select * into v_item from public.club57_redemption_catalog where id = p_item_id and active for update;
  if not found then
    raise exception 'Este artículo ya no está disponible.';
  end if;
  if v_item.stock <= 0 then
    raise exception 'Este artículo ya no tiene stock disponible.' using errcode = 'F57NS';
  end if;

  -- Bloquea los canjes simultáneos de la misma empresa.
  perform 1 from public.club57_empresas where id = v_empresa for update;
  select coalesce(sum(cantidad), 0) into v_saldo
  from public.club57_empresa_puntos
  where empresa_id = v_empresa and estado = 'disponible';
  if v_saldo < v_item.costo_puntos then
    raise exception 'Tu empresa no tiene puntos suficientes para este artículo.' using errcode = 'F57PI';
  end if;

  update public.club57_redemption_catalog set stock = stock - 1 where id = p_item_id;

  insert into public.club57_empresa_canjes (empresa_id, item_id, puntos_usados, estado, solicitado_por)
  values (v_empresa, p_item_id, v_item.costo_puntos, 'pendiente', auth.uid())
  returning * into v_canje;

  insert into public.club57_empresa_puntos (empresa_id, cantidad, tipo, estado, canje_id, referencia)
  values (v_empresa, -v_item.costo_puntos, 'canje', 'disponible', v_canje.id, 'Canje: ' || v_item.nombre);

  return v_canje;
end;
$$;

revoke all on function public.club57_portal_canjear(uuid) from public, anon;
grant execute on function public.club57_portal_canjear(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 6) Ferretería 57: entregar o cancelar un canje de empresa. Cancelar
--    reembolsa los puntos y regresa el stock.
-- ---------------------------------------------------------------------
create or replace function public.club57_admin_empresa_canje_estado(p_canje_id uuid, p_estado text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_canje public.club57_empresa_canjes;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;
  if p_estado not in ('entregado', 'cancelado') then
    raise exception 'Estatus inválido: %', p_estado;
  end if;

  select * into v_canje from public.club57_empresa_canjes where id = p_canje_id for update;
  if not found then
    raise exception 'Canje no encontrado.';
  end if;
  if v_canje.estado <> 'pendiente' then
    raise exception 'Este canje ya fue resuelto — actualiza la página e intenta de nuevo.' using errcode = 'F57ST';
  end if;

  update public.club57_empresa_canjes
  set estado = p_estado, resuelto_por = auth.uid(), resuelto_at = now()
  where id = p_canje_id;

  if p_estado = 'cancelado' then
    insert into public.club57_empresa_puntos (empresa_id, cantidad, tipo, estado, canje_id, referencia)
    select v_canje.empresa_id, v_canje.puntos_usados, 'reversion_canje', 'disponible', v_canje.id,
           'Cancelación de canje: ' || c.nombre
    from public.club57_redemption_catalog c
    where c.id = v_canje.item_id;

    update public.club57_redemption_catalog set stock = stock + 1 where id = v_canje.item_id;
  end if;
end;
$$;

revoke all on function public.club57_admin_empresa_canje_estado(uuid, text) from public, anon;
grant execute on function public.club57_admin_empresa_canje_estado(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 7) Traspaso: los puntos que pedidos con cargo a empresa (no cancelados)
--    habían generado al colaborador pasan a la empresa. En la cuenta del
--    colaborador se compensan con un movimiento negativo y el original deja
--    de apuntar al pedido, para que una cancelación posterior no lo revierta
--    dos veces.
-- ---------------------------------------------------------------------
do $$
declare
  v_l record;
begin
  for v_l in
    select l.*, o.empresa_id, o.order_number, o.id as pedido_id
    from public.club57_points_ledger l
    join public.orders o on o.id::text = l.referencia
    where l.tipo = 'compra_online' and o.metodo_pago = 'empresa' and o.status <> 'cancelado' and o.empresa_id is not null
  loop
    if not exists (select 1 from public.club57_empresa_puntos where tipo = 'compra_empresa' and order_id = v_l.pedido_id) then
      insert into public.club57_empresa_puntos (empresa_id, cantidad, tipo, estado, order_id, referencia, fecha_disponible, created_at)
      values (v_l.empresa_id, v_l.cantidad, 'compra_empresa', v_l.estado, v_l.pedido_id, 'Pedido ' || v_l.order_number,
              v_l.fecha_disponible, v_l.created_at);
    end if;
    insert into public.club57_points_ledger (member_id, cantidad, tipo, estado, referencia)
    values (v_l.member_id, -v_l.cantidad, 'reversion_cancelacion', v_l.estado,
            'Pedido ' || v_l.order_number || ' con cargo a la empresa: los puntos son de la empresa');
    update public.club57_points_ledger
    set referencia = 'Pedido ' || v_l.order_number || ' (cargo a empresa)'
    where id = v_l.id;
  end loop;
end;
$$;
