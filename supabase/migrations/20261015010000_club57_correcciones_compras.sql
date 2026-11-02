-- Club 57 — cancelar o corregir una compra registrada en tienda.
--
-- El ledger sigue siendo append-only: nunca se edita ni se borra una
-- compra. Cancelar inserta un movimiento compensatorio (tipo
-- 'cancelacion_compra', con los mismos puntos en negativo y apuntando a la
-- compra original con anula_a). Corregir hace lo mismo y además inserta la
-- compra corregida (tipo 'compra_manual', apuntando a la original con
-- corrige_a). Todo en una sola función (club57_corregir_compra) para que
-- quede completo o no quede nada.
--
-- Política (Términos §6, 7 días naturales en horario de Querétaro):
--   - vendedor: solo compras de sus propios clientes y dentro del plazo;
--     después del plazo, bloqueado.
--   - admin: cualquier compra; fuera del plazo, solo con confirmación
--     explícita y justificación escrita, y queda marcada como «Fuera de
--     política» en la bitácora (club57_correcciones). Esa marca y la
--     justificación nunca son visibles para el cliente.
--   - el saldo puede quedar negativo; el bono de referido no se revierte.
--
-- Estrictamente aditivo para lo que ya existe: columnas nuevas nullable,
-- un valor nuevo en el CHECK de tipo, una tabla nueva y una función nueva.
-- Las únicas políticas que cambian son las de INSERT directo al ledger,
-- que ahora rechazan los movimientos de corrección (solo los escribe la
-- función) — ninguna pantalla actual inserta esos tipos.

-- ---------------------------------------------------------------------
-- 1) Columnas nuevas en club57_points_ledger
-- ---------------------------------------------------------------------
alter table public.club57_points_ledger
  -- Monto de la compra en tienda como número (antes solo vivía dentro del
  -- texto de referencia). Se llena para compra_manual nuevas y por backfill.
  add column if not exists monto numeric(12, 2) check (monto is null or monto > 0),
  -- Movimiento compensatorio → compra que cancela.
  add column if not exists anula_a uuid references public.club57_points_ledger (id) on delete cascade,
  -- Compra corregida → compra original a la que reemplaza.
  add column if not exists corrige_a uuid references public.club57_points_ledger (id) on delete cascade,
  -- Motivo visible para el cliente en su historial (solo en compensatorios).
  add column if not exists motivo text check (
    motivo is null or motivo in ('no_era_lo_que_necesitaba', 'producto_danado', 'error_de_captura', 'otro')
  ),
  add column if not exists motivo_nota text,
  -- Quién escribió el movimiento (lo fija el trigger de abajo, nunca la
  -- app). Sin FK a propósito: create_order también inserta en el ledger y
  -- un FK que fallara ahí haría perder los puntos de un pedido.
  add column if not exists registrado_por uuid,
  -- Llave de idempotencia del formulario de compra en tienda: un doble
  -- clic (o un reintento de red) con la misma llave no registra dos veces.
  add column if not exists request_id uuid;

alter table public.club57_points_ledger
  drop constraint if exists club57_points_ledger_tipo_check;
alter table public.club57_points_ledger
  add constraint club57_points_ledger_tipo_check check (
    tipo in ('compra_online', 'compra_manual', 'referido_bono', 'reversion_cancelacion', 'canje', 'cancelacion_compra')
  );

-- Un compensatorio siempre apunta a su compra, y solo los compensatorios
-- usan anula_a.
alter table public.club57_points_ledger
  drop constraint if exists club57_points_ledger_anula_a_check;
alter table public.club57_points_ledger
  add constraint club57_points_ledger_anula_a_check check ((tipo = 'cancelacion_compra') = (anula_a is not null));

-- Una compra se cancela o corrige una sola vez.
create unique index if not exists club57_points_ledger_anula_a_key
  on public.club57_points_ledger (anula_a) where anula_a is not null;
create unique index if not exists club57_points_ledger_corrige_a_key
  on public.club57_points_ledger (corrige_a) where corrige_a is not null;
create unique index if not exists club57_points_ledger_request_id_key
  on public.club57_points_ledger (request_id) where request_id is not null;

-- Backfill del monto de compras en tienda ya registradas: la acción
-- siempre escribió exactamente "Compra en tienda: $1234.50 MXN".
update public.club57_points_ledger
set monto = (regexp_match(referencia, '^Compra en tienda: \$([0-9]+(\.[0-9]+)?) MXN$'))[1]::numeric
where tipo = 'compra_manual'
  and monto is null
  and referencia ~ '^Compra en tienda: \$[0-9]+(\.[0-9]+)? MXN$';

-- registrado_por = quien hace el INSERT (auth.uid()), sin importar lo que
-- mande el cliente. Queda null para escrituras del servidor (service_role).
create or replace function public.club57_ledger_set_registrado_por()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.registrado_por := auth.uid();
  return new;
end;
$$;

drop trigger if exists club57_ledger_set_registrado_por on public.club57_points_ledger;
create trigger club57_ledger_set_registrado_por
  before insert on public.club57_points_ledger
  for each row execute function public.club57_ledger_set_registrado_por();

-- ---------------------------------------------------------------------
-- 2) INSERT directo al ledger: los movimientos de corrección solo los
--    escribe club57_corregir_compra(). El vendedor, además, solo puede
--    registrar compras en tienda con puntos positivos (lo único que hace
--    hoy registerClub57ManualPurchase).
-- ---------------------------------------------------------------------
drop policy if exists "Los admins registran movimientos de puntos" on public.club57_points_ledger;
create policy "Los admins registran movimientos de puntos"
  on public.club57_points_ledger for insert
  with check (
    public.is_admin()
    and tipo <> 'cancelacion_compra'
    and anula_a is null
    and corrige_a is null
  );

drop policy if exists "Los vendedores registran movimientos de sus clientes" on public.club57_points_ledger;
create policy "Los vendedores registran movimientos de sus clientes"
  on public.club57_points_ledger for insert
  with check (
    public.is_vendedor()
    and tipo = 'compra_manual'
    and cantidad > 0
    and anula_a is null
    and corrige_a is null
    and exists (
      select 1 from public.club57_members m
      where m.id = club57_points_ledger.member_id and m.creado_por_vendedor_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 3) Bitácora de correcciones (uso interno: nunca visible para el cliente)
-- ---------------------------------------------------------------------
create table if not exists public.club57_correcciones (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.club57_members (id) on delete cascade,
  compra_id uuid not null unique references public.club57_points_ledger (id) on delete cascade,
  accion text not null check (accion in ('cancelada', 'corregida')),
  motivo text not null check (motivo in ('no_era_lo_que_necesitaba', 'producto_danado', 'error_de_captura', 'otro')),
  motivo_nota text,
  fuera_de_politica boolean not null default false,
  justificacion text,
  anulacion_id uuid not null references public.club57_points_ledger (id) on delete cascade,
  reemplazo_id uuid references public.club57_points_ledger (id) on delete cascade,
  puntos_anulados integer not null,
  puntos_nuevos integer,
  monto_anterior numeric(12, 2),
  monto_nuevo numeric(12, 2),
  producto_anterior text,
  producto_nuevo text,
  -- Fecha de la compra original (la primera de la cadena si ya había sido
  -- corregida antes) y días naturales transcurridos al corregir.
  fecha_compra timestamptz not null,
  dias_transcurridos integer not null,
  actor_id uuid references public.profiles (id) on delete set null,
  actor_rol text not null check (actor_rol in ('admin', 'vendedor')),
  created_at timestamptz not null default now(),
  constraint club57_correcciones_reemplazo_check check ((accion = 'corregida') = (reemplazo_id is not null)),
  constraint club57_correcciones_justificacion_check check (
    not fuera_de_politica or length(btrim(coalesce(justificacion, ''))) >= 10
  ),
  constraint club57_correcciones_nota_check check (
    motivo <> 'otro' or length(btrim(coalesce(motivo_nota, ''))) > 0
  )
);

create index if not exists club57_correcciones_created_at_idx on public.club57_correcciones (created_at desc);
create index if not exists club57_correcciones_member_id_idx on public.club57_correcciones (member_id);
create index if not exists club57_correcciones_actor_id_idx on public.club57_correcciones (actor_id);

alter table public.club57_correcciones enable row level security;

-- Solo lectura para admin. Sin políticas de insert/update/delete: la única
-- forma de escribir es club57_corregir_compra() (security definer).
drop policy if exists "Los admins leen la bitácora de correcciones" on public.club57_correcciones;
create policy "Los admins leen la bitácora de correcciones"
  on public.club57_correcciones for select
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 4) club57_corregir_compra(): cancelar o corregir, atómico.
--
-- Códigos de error que la app distingue:
--   F57CC  la compra ya fue cancelada o corregida
--   F57PZ  vendedor fuera del plazo de 7 días
--   F57FP  admin fuera del plazo sin confirmar la excepción
--   F57JU  admin fuera del plazo sin justificación suficiente
-- ---------------------------------------------------------------------
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
    case when v_es_admin then 'admin' else 'vendedor' end
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

revoke all on function public.club57_corregir_compra(uuid, text, text, text, numeric, text, text, boolean, text) from public, anon;
grant execute on function public.club57_corregir_compra(uuid, text, text, text, numeric, text, text, boolean, text) to authenticated;
