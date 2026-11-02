-- Club 57 — puntos de cortesía otorgados desde el panel.
--
-- El administrador o el operador otorgan puntos a cualquier cliente de
-- Club 57 con un motivo de una lista cerrada. Los puntos quedan disponibles
-- de inmediato (no son una compra que se pueda devolver) y hay un máximo
-- por otorgamiento que solo el administrador configura. Si se otorgaron por
-- error, se anulan con un movimiento compensatorio (el ledger sigue siendo
-- append-only); si el cliente ya los había canjeado, su saldo puede quedar
-- negativo, igual que al cancelar una compra.
--
--   - tipo 'cortesia': los puntos otorgados (positivos, 'disponible').
--   - tipo 'anulacion_cortesia': su anulación (mismos puntos en negativo,
--     apuntando al otorgamiento con anula_a).
--   - club57_cortesias: bitácora interna de quién otorgó o anuló, cuándo,
--     a quién y por qué. La nota interna vive solo aquí: el cliente lee sus
--     filas del ledger (RLS) y ahí solo va el motivo de la lista.
--
-- Los puntos de cortesía no cuentan como «primera compra» para el bono de
-- referido (grant_club57_referral_bonus solo mira compra_online y
-- compra_manual) y entran al saldo disponible para canje como cualquier
-- otro movimiento disponible.
--
-- Además se cierra el INSERT directo al ledger del personal de
-- administración: la app solo inserta directo compras en tienda
-- (registerClub57ManualPurchase); todo lo demás lo escriben funciones
-- security definer, que validan cada caso.

-- ---------------------------------------------------------------------
-- 1) Máximo por otorgamiento (Configuración de Club 57, solo admin)
-- ---------------------------------------------------------------------
alter table public.club57_config
  add column if not exists max_puntos_cortesia integer not null default 500
    check (max_puntos_cortesia between 1 and 10000);

-- ---------------------------------------------------------------------
-- 2) Tipos y motivos nuevos en el ledger
-- ---------------------------------------------------------------------
alter table public.club57_points_ledger
  drop constraint if exists club57_points_ledger_tipo_check;
alter table public.club57_points_ledger
  add constraint club57_points_ledger_tipo_check check (
    tipo in (
      'compra_online', 'compra_manual', 'referido_bono', 'reversion_cancelacion', 'canje',
      'cancelacion_compra', 'cortesia', 'anulacion_cortesia'
    )
  );

-- Solo los compensatorios (de una compra o de una cortesía) usan anula_a.
alter table public.club57_points_ledger
  drop constraint if exists club57_points_ledger_anula_a_check;
alter table public.club57_points_ledger
  add constraint club57_points_ledger_anula_a_check check (
    (tipo in ('cancelacion_compra', 'anulacion_cortesia')) = (anula_a is not null)
  );

-- Motivos de compras canceladas/corregidas + motivos de cortesía y de su
-- anulación.
alter table public.club57_points_ledger
  drop constraint if exists club57_points_ledger_motivo_check;
alter table public.club57_points_ledger
  add constraint club57_points_ledger_motivo_check check (
    motivo is null or motivo in (
      'no_era_lo_que_necesitaba', 'producto_danado', 'error_de_captura', 'otro',
      'compensacion', 'promocion', 'agradecimiento', 'ajuste_autorizado',
      'otorgado_por_error'
    )
  );

-- ---------------------------------------------------------------------
-- 3) INSERT directo al ledger: el personal de administración solo inserta
--    compras en tienda (lo único que hace la app directo); cortesías,
--    anulaciones, bonos, canjes y correcciones los escriben las funciones.
-- ---------------------------------------------------------------------
drop policy if exists "Los admins registran movimientos de puntos" on public.club57_points_ledger;
create policy "Los admins registran movimientos de puntos"
  on public.club57_points_ledger for insert
  with check (
    public.is_admin()
    and tipo = 'compra_manual'
    and cantidad > 0
    and anula_a is null
    and corrige_a is null
  );

-- ---------------------------------------------------------------------
-- 4) Bitácora de puntos de cortesía (uso interno: nunca visible para el
--    cliente). Un registro por otorgamiento y otro por anulación.
-- ---------------------------------------------------------------------
create table if not exists public.club57_cortesias (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.club57_members (id) on delete cascade,
  accion text not null check (accion in ('otorgada', 'anulada')),
  -- Movimiento del ledger que escribió esta acción.
  movimiento_id uuid not null unique references public.club57_points_ledger (id) on delete cascade,
  -- Otorgamiento al que se refiere (el mismo movimiento si accion = 'otorgada').
  cortesia_id uuid not null references public.club57_points_ledger (id) on delete cascade,
  puntos integer not null check (puntos > 0),
  motivo text not null check (
    (accion = 'otorgada' and motivo in ('compensacion', 'promocion', 'agradecimiento', 'ajuste_autorizado', 'otro'))
    or (accion = 'anulada' and motivo in ('otorgado_por_error', 'otro'))
  ),
  motivo_nota text,
  actor_id uuid references public.profiles (id) on delete set null,
  actor_rol text not null check (actor_rol in ('admin', 'operador')),
  created_at timestamptz not null default now(),
  constraint club57_cortesias_nota_check check (
    motivo <> 'otro' or length(btrim(coalesce(motivo_nota, ''))) > 0
  )
);

create index if not exists club57_cortesias_created_at_idx on public.club57_cortesias (created_at desc);
create index if not exists club57_cortesias_member_id_idx on public.club57_cortesias (member_id);
create index if not exists club57_cortesias_actor_id_idx on public.club57_cortesias (actor_id);
create index if not exists club57_cortesias_cortesia_id_idx on public.club57_cortesias (cortesia_id);

alter table public.club57_cortesias enable row level security;

-- Solo lectura para admin y operador. Sin políticas de escritura: solo
-- escriben club57_otorgar_puntos() y club57_anular_cortesia().
drop policy if exists "Los admins leen la bitácora de cortesías" on public.club57_cortesias;
create policy "Los admins leen la bitácora de cortesías"
  on public.club57_cortesias for select
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 5) club57_otorgar_puntos(): otorgar puntos de cortesía.
--
-- Códigos de error que la app distingue:
--   F57MX  los puntos pasan del máximo por otorgamiento
-- p_request_id: llave del formulario; un doble clic o reintento con la
-- misma llave devuelve el otorgamiento ya hecho sin duplicarlo.
-- ---------------------------------------------------------------------
create or replace function public.club57_otorgar_puntos(
  p_member_id uuid,
  p_cantidad integer,
  p_motivo text,
  p_motivo_nota text default null,
  p_request_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text := public.current_staff_role();
  v_nota text := nullif(btrim(coalesce(p_motivo_nota, '')), '');
  v_max integer;
  v_existente public.club57_points_ledger;
  v_movimiento_id uuid;
  v_saldo integer;
begin
  if not public.is_admin() or v_rol is null or v_rol not in ('admin', 'operador') then
    raise exception 'No autorizado.';
  end if;

  if p_motivo is null or p_motivo not in ('compensacion', 'promocion', 'agradecimiento', 'ajuste_autorizado', 'otro') then
    raise exception 'Elige el motivo.';
  end if;

  if p_motivo = 'otro' and v_nota is null then
    raise exception 'Escribe el motivo en la nota.';
  end if;

  if v_nota is not null and length(v_nota) > 300 then
    raise exception 'La nota es muy larga (máximo 300 caracteres).';
  end if;

  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'Los puntos deben ser un número entero mayor a 0.';
  end if;

  select max_puntos_cortesia into v_max from public.club57_config limit 1;
  if p_cantidad > coalesce(v_max, 500) then
    raise exception 'El máximo por otorgamiento es de % puntos.', coalesce(v_max, 500)
      using errcode = 'F57MX';
  end if;

  -- Un movimiento a la vez por cliente: también ordena dos clics con la
  -- misma llave para que el segundo vea el primero ya escrito.
  perform 1 from public.club57_members where id = p_member_id for update;
  if not found then
    raise exception 'Cliente no encontrado.';
  end if;

  if p_request_id is not null then
    select * into v_existente from public.club57_points_ledger where request_id = p_request_id;
    if found then
      if v_existente.tipo <> 'cortesia' or v_existente.member_id <> p_member_id then
        raise exception 'Solicitud duplicada: actualiza la página e inténtalo de nuevo.';
      end if;
      select coalesce(sum(cantidad), 0) into v_saldo
      from public.club57_points_ledger
      where member_id = p_member_id and estado = 'disponible';
      return jsonb_build_object(
        'cortesia_id', v_existente.id,
        'puntos', v_existente.cantidad,
        'saldo_disponible', v_saldo,
        'duplicada', true
      );
    end if;
  end if;

  insert into public.club57_points_ledger (
    member_id, cantidad, tipo, estado, fecha_disponible, referencia, motivo, request_id
  )
  values (
    p_member_id,
    p_cantidad,
    'cortesia',
    'disponible',
    public.today_in_queretaro(),
    'Puntos de cortesía',
    p_motivo,
    p_request_id
  )
  returning id into v_movimiento_id;

  insert into public.club57_cortesias (
    member_id, accion, movimiento_id, cortesia_id, puntos, motivo, motivo_nota, actor_id, actor_rol
  )
  values (
    p_member_id, 'otorgada', v_movimiento_id, v_movimiento_id, p_cantidad, p_motivo, v_nota, auth.uid(), v_rol
  );

  select coalesce(sum(cantidad), 0) into v_saldo
  from public.club57_points_ledger
  where member_id = p_member_id and estado = 'disponible';

  return jsonb_build_object(
    'cortesia_id', v_movimiento_id,
    'puntos', p_cantidad,
    'saldo_disponible', v_saldo,
    'duplicada', false
  );
end;
$$;

revoke all on function public.club57_otorgar_puntos(uuid, integer, text, text, uuid) from public, anon;
grant execute on function public.club57_otorgar_puntos(uuid, integer, text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 6) club57_anular_cortesia(): anular un otorgamiento.
--
-- Códigos de error que la app distingue:
--   F57CA  esos puntos de cortesía ya fueron anulados
-- ---------------------------------------------------------------------
create or replace function public.club57_anular_cortesia(
  p_cortesia_id uuid,
  p_motivo text,
  p_motivo_nota text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text := public.current_staff_role();
  v_nota text := nullif(btrim(coalesce(p_motivo_nota, '')), '');
  v_cortesia public.club57_points_ledger;
  v_movimiento_id uuid;
  v_saldo integer;
begin
  if not public.is_admin() or v_rol is null or v_rol not in ('admin', 'operador') then
    raise exception 'No autorizado.';
  end if;

  if p_motivo is null or p_motivo not in ('otorgado_por_error', 'otro') then
    raise exception 'Elige el motivo.';
  end if;

  if p_motivo = 'otro' and v_nota is null then
    raise exception 'Escribe el motivo en la nota.';
  end if;

  if v_nota is not null and length(v_nota) > 300 then
    raise exception 'La nota es muy larga (máximo 300 caracteres).';
  end if;

  select * into v_cortesia
  from public.club57_points_ledger
  where id = p_cortesia_id
  for update;

  if not found then
    raise exception 'Movimiento no encontrado.';
  end if;

  if v_cortesia.tipo <> 'cortesia' then
    raise exception 'Solo se pueden anular puntos de cortesía.';
  end if;

  perform 1 from public.club57_members where id = v_cortesia.member_id for update;

  if exists (select 1 from public.club57_points_ledger where anula_a = v_cortesia.id) then
    raise exception 'Estos puntos de cortesía ya fueron anulados — actualiza la página.'
      using errcode = 'F57CA';
  end if;

  -- Mismo estado y fecha que el otorgamiento: si ya estaba disponible (lo
  -- normal), se descuenta del saldo de inmediato y puede quedar negativo.
  insert into public.club57_points_ledger (
    member_id, cantidad, tipo, estado, fecha_disponible, referencia, anula_a, motivo
  )
  values (
    v_cortesia.member_id,
    -v_cortesia.cantidad,
    'anulacion_cortesia',
    v_cortesia.estado,
    v_cortesia.fecha_disponible,
    'Puntos de cortesía anulados',
    v_cortesia.id,
    p_motivo
  )
  returning id into v_movimiento_id;

  insert into public.club57_cortesias (
    member_id, accion, movimiento_id, cortesia_id, puntos, motivo, motivo_nota, actor_id, actor_rol
  )
  values (
    v_cortesia.member_id, 'anulada', v_movimiento_id, v_cortesia.id, v_cortesia.cantidad, p_motivo, v_nota,
    auth.uid(), v_rol
  );

  select coalesce(sum(cantidad), 0) into v_saldo
  from public.club57_points_ledger
  where member_id = v_cortesia.member_id and estado = 'disponible';

  return jsonb_build_object(
    'puntos_anulados', v_cortesia.cantidad,
    'saldo_disponible', v_saldo
  );
end;
$$;

revoke all on function public.club57_anular_cortesia(uuid, text, text) from public, anon;
grant execute on function public.club57_anular_cortesia(uuid, text, text) to authenticated;
