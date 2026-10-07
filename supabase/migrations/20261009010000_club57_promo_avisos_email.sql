-- Club 57 — Aviso por email de promociones (Promo Truper, Temporada y
-- Liquidaciones). Estrictamente ADITIVA: una columna nueva con default
-- seguro en club57_members y tablas/funciones nuevas. No toca ni redefine
-- ningún objeto existente.
--
-- Diseño:
--   * Una "campaña" por cada aviso de una promoción. Al crearla se CONGELAN
--     sus destinatarios en club57_email_envios (orden estable por fecha de
--     alta del miembro), así el progreso, los reintentos y la reanudación
--     tras un corte nunca dependen de cómo cambie la tabla de miembros.
--   * UNIQUE(campana_id, member_id): nadie recibe dos veces el mismo aviso.
--   * Los envíos salen en "lotes" (club57_email_lotes): el id del lote es la
--     llave de idempotencia con el proveedor de correo. Si un proceso se
--     corta después de enviar y antes de marcar, el siguiente reenvía el
--     MISMO lote con la MISMA llave y el proveedor no lo duplica.
--   * club57_email_lock: candado global (lease con vencimiento) para que dos
--     corridas simultáneas (cron + "Enviar ahora") nunca rebasen el límite
--     diario ni tomen los mismos destinatarios.
--   * Todo se escribe desde el servidor con la service role. El panel admin
--     solo lee (RLS is_admin()); los miembros no ven nada de esto.

-- ---------------------------------------------------------------------
-- Baja de avisos de promociones (solo afecta a estos correos, nunca a
-- los transaccionales de pedidos ni de canjes).
alter table public.club57_members
  add column if not exists promos_email_optout boolean not null default false,
  add column if not exists promos_email_optout_at timestamptz;

-- ---------------------------------------------------------------------
create table if not exists public.club57_email_campanas (
  id uuid primary key default gen_random_uuid(),
  promocion_id uuid not null references public.club57_promociones (id) on delete cascade,
  tipo public.club57_promo_tipo not null,
  -- 'todos': todos los miembros elegibles. 'no_recibieron': solo quienes
  -- quedaron pendientes o fallidos en avisos anteriores de esta promoción.
  alcance text not null default 'todos' check (alcance in ('todos', 'no_recibieron')),
  estado text not null default 'programada'
    check (estado in ('programada', 'en_proceso', 'completada', 'con_errores', 'cancelada')),
  asunto text not null,
  total integer not null default 0 check (total >= 0),
  enviados integer not null default 0 check (enviados >= 0),
  fallidos integer not null default 0 check (fallidos >= 0),
  omitidos integer not null default 0 check (omitidos >= 0),
  programado_para timestamptz not null default now(),
  iniciada_at timestamptz,
  finalizada_at timestamptz,
  -- Por qué se detuvo HOY sin terminar ('limite_diario' / 'limite_mensual'):
  -- solo informativo para el panel, se limpia en la siguiente corrida.
  pausa_motivo text check (pausa_motivo is null or pausa_motivo in ('limite_diario', 'limite_mensual')),
  pausa_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un solo aviso activo (programado o en proceso) por promoción a la vez.
create unique index if not exists club57_email_campanas_una_activa
  on public.club57_email_campanas (promocion_id)
  where estado in ('programada', 'en_proceso');
create index if not exists club57_email_campanas_cola_idx
  on public.club57_email_campanas (estado, programado_para, created_at);
create index if not exists club57_email_campanas_promocion_idx
  on public.club57_email_campanas (promocion_id, created_at desc);

create table if not exists public.club57_email_lotes (
  id uuid primary key default gen_random_uuid(),
  campana_id uuid not null references public.club57_email_campanas (id) on delete cascade,
  tamano integer not null check (tamano > 0),
  created_at timestamptz not null default now(),
  cerrado_at timestamptz
);

create table if not exists public.club57_email_envios (
  id uuid primary key default gen_random_uuid(),
  campana_id uuid not null references public.club57_email_campanas (id) on delete cascade,
  member_id uuid not null references public.club57_members (id) on delete cascade,
  email text not null,
  nombre text,
  orden integer not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'enviado', 'fallido', 'omitido')),
  -- Solo para 'omitido': 'vencida' | 'baja' | 'cancelada' | 'archivada'.
  motivo text,
  lote_id uuid references public.club57_email_lotes (id) on delete set null,
  -- Foto de los datos con los que se arma el correo al tomar el lote: un
  -- reintento del mismo lote manda exactamente el mismo contenido.
  puntos integer,
  resend_id text,
  error text,
  intentos integer not null default 0,
  enviado_en timestamptz,
  updated_at timestamptz not null default now(),
  unique (campana_id, member_id)
);

create index if not exists club57_email_envios_cola_idx
  on public.club57_email_envios (campana_id, estado, orden);
create index if not exists club57_email_envios_enviado_en_idx
  on public.club57_email_envios (enviado_en) where estado = 'enviado';
create index if not exists club57_email_envios_lote_idx
  on public.club57_email_envios (lote_id) where lote_id is not null;
create index if not exists club57_email_envios_member_idx
  on public.club57_email_envios (member_id);

-- Correos de prueba al admin: cuentan contra el límite diario.
create table if not exists public.club57_email_pruebas (
  id uuid primary key default gen_random_uuid(),
  promocion_id uuid references public.club57_promociones (id) on delete cascade,
  email text not null,
  resend_id text,
  error text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists club57_email_pruebas_created_idx on public.club57_email_pruebas (created_at);

create table if not exists public.club57_email_lock (
  id integer primary key default 1 check (id = 1),
  holder uuid,
  locked_until timestamptz
);
insert into public.club57_email_lock (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- RLS: el panel admin lee; nadie escribe salvo la service role.
alter table public.club57_email_campanas enable row level security;
alter table public.club57_email_lotes enable row level security;
alter table public.club57_email_envios enable row level security;
alter table public.club57_email_pruebas enable row level security;
alter table public.club57_email_lock enable row level security;

drop policy if exists "Admins leen avisos de promociones" on public.club57_email_campanas;
create policy "Admins leen avisos de promociones"
  on public.club57_email_campanas for select using (public.is_admin());
drop policy if exists "Admins leen envios de avisos" on public.club57_email_envios;
create policy "Admins leen envios de avisos"
  on public.club57_email_envios for select using (public.is_admin());
drop policy if exists "Admins leen pruebas de avisos" on public.club57_email_pruebas;
create policy "Admins leen pruebas de avisos"
  on public.club57_email_pruebas for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- Inicio del día / mes de negocio (America/Mexico_City) como timestamptz.
create or replace function public.club57_email_inicio_dia()
returns timestamptz
language sql
stable
as $$
  select (date_trunc('day', now() at time zone 'America/Mexico_City')) at time zone 'America/Mexico_City';
$$;

create or replace function public.club57_email_inicio_mes()
returns timestamptz
language sql
stable
as $$
  select (date_trunc('month', now() at time zone 'America/Mexico_City')) at time zone 'America/Mexico_City';
$$;

-- Envíos de avisos (campañas + pruebas aceptadas) de hoy y del mes.
create or replace function public.club57_email_uso()
returns table (hoy integer, mes integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from club57_email_envios where estado = 'enviado' and enviado_en >= club57_email_inicio_dia())::integer
      + (select count(*) from club57_email_pruebas where resend_id is not null and created_at >= club57_email_inicio_dia())::integer,
    (select count(*) from club57_email_envios where estado = 'enviado' and enviado_en >= club57_email_inicio_mes())::integer
      + (select count(*) from club57_email_pruebas where resend_id is not null and created_at >= club57_email_inicio_mes())::integer;
$$;

-- Miembros elegibles: con correo con forma válida, sin baja de avisos, un
-- solo envío por correo (si dos registros comparten correo, gana el más
-- antiguo). Orden estable: fecha de alta, luego id.
create or replace function public.club57_email_elegibles(p_promocion uuid, p_alcance text)
returns table (member_id uuid, email text, nombre text, alta timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select distinct on (lower(trim(m.email)))
      m.id, trim(m.email) as email, m.full_name, m.created_at
    from club57_members m
    where m.promos_email_optout = false
      and trim(m.email) ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    order by lower(trim(m.email)), m.created_at, m.id
  )
  select b.id, b.email, b.full_name, b.created_at
  from base b
  where p_alcance = 'todos'
     or (
       p_alcance = 'no_recibieron'
       and exists (
         select 1 from club57_email_envios e
         join club57_email_campanas c on c.id = e.campana_id
         where c.promocion_id = p_promocion and e.member_id = b.id
       )
       and not exists (
         select 1 from club57_email_envios e
         join club57_email_campanas c on c.id = e.campana_id
         where c.promocion_id = p_promocion and e.member_id = b.id and e.estado = 'enviado'
       )
     )
  order by b.created_at, b.id;
$$;

create or replace function public.club57_email_elegibles_conteo(p_promocion uuid)
returns table (todos integer, no_recibieron integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from club57_email_elegibles(p_promocion, 'todos'))::integer,
    (select count(*) from club57_email_elegibles(p_promocion, 'no_recibieron'))::integer;
$$;

-- Crea la campaña y congela sus destinatarios en una sola transacción.
create or replace function public.club57_email_campana_crear(
  p_promocion uuid,
  p_asunto text,
  p_programado_para timestamptz,
  p_alcance text,
  p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo club57_promociones%rowtype;
  v_id uuid;
  v_total integer;
begin
  select * into v_promo from club57_promociones where id = p_promocion for share;
  if not found or v_promo.estado <> 'publicada' then
    raise exception 'Solo se puede avisar de una promoción publicada.' using errcode = 'F57AV';
  end if;
  if v_promo.vigencia_fin < today_in_queretaro() then
    raise exception 'La promoción ya venció.' using errcode = 'F57AV';
  end if;

  insert into club57_email_campanas (promocion_id, tipo, alcance, estado, asunto, programado_para, created_by)
  values (p_promocion, v_promo.tipo, p_alcance, 'programada', p_asunto, p_programado_para, p_created_by)
  returning id into v_id;

  insert into club57_email_envios (campana_id, member_id, email, nombre, orden)
  select v_id, e.member_id, e.email, e.nombre, row_number() over (order by e.alta, e.member_id)
  from club57_email_elegibles(p_promocion, p_alcance) e;

  get diagnostics v_total = row_count;
  if v_total = 0 then
    raise exception 'No hay miembros a quienes enviar este aviso.' using errcode = 'F57AV';
  end if;

  update club57_email_campanas set total = v_total where id = v_id;
  return v_id;
end;
$$;

-- Recalcula los contadores de una campaña desde sus envíos.
create or replace function public.club57_email_campana_recalcular(p_campana uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update club57_email_campanas c
  set enviados = s.enviados,
      fallidos = s.fallidos,
      omitidos = s.omitidos,
      total = s.total,
      updated_at = now()
  from (
    select
      count(*) filter (where estado = 'enviado')::integer as enviados,
      count(*) filter (where estado = 'fallido')::integer as fallidos,
      count(*) filter (where estado = 'omitido')::integer as omitidos,
      count(*)::integer as total
    from club57_email_envios where campana_id = p_campana
  ) s
  where c.id = p_campana;
$$;

-- Toma el siguiente lote de una campaña. Si hay un lote ABIERTO (enviado
-- al proveedor pero sin marcar, p. ej. por un corte), devuelve ese mismo
-- lote para reenviarlo con la misma llave de idempotencia. Quien se dio de
-- baja después de congelar la campaña se marca 'omitido' y no entra.
create or replace function public.club57_email_lote_tomar(p_campana uuid, p_max integer)
returns table (lote_id uuid, lote_creado timestamptz, envio_id uuid, member_id uuid, email text, nombre text, puntos integer)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_lote uuid;
  v_creado timestamptz;
begin
  select e.lote_id into v_lote
  from club57_email_envios e
  where e.campana_id = p_campana and e.estado = 'pendiente' and e.lote_id is not null
  order by e.orden
  limit 1;

  if v_lote is null then
    if p_max <= 0 then
      return;
    end if;

    update club57_email_envios e
    set estado = 'omitido', motivo = 'baja', updated_at = now()
    from club57_members m
    where e.campana_id = p_campana and e.estado = 'pendiente' and e.lote_id is null
      and m.id = e.member_id and m.promos_email_optout = true;

    insert into club57_email_lotes (campana_id, tamano)
    select p_campana, least(p_max, count(*))
    from club57_email_envios
    where campana_id = p_campana and estado = 'pendiente' and lote_id is null
    having count(*) > 0
    returning id into v_lote;

    if v_lote is null then
      return;
    end if;

    update club57_email_envios e
    set lote_id = v_lote,
        intentos = e.intentos + 1,
        puntos = (
          select coalesce(sum(l.cantidad), 0)::integer
          from club57_points_ledger l
          where l.member_id = e.member_id and l.estado = 'disponible'
        ),
        updated_at = now()
    where e.id in (
      select id from club57_email_envios
      where campana_id = p_campana and estado = 'pendiente' and lote_id is null
      order by orden
      limit p_max
      for update skip locked
    );
  end if;

  select l.created_at into v_creado from club57_email_lotes l where l.id = v_lote;

  return query
  select v_lote, v_creado, e.id, e.member_id, e.email, e.nombre, e.puntos
  from club57_email_envios e
  where e.lote_id = v_lote and e.estado = 'pendiente'
  order by e.orden;
end;
$$;

-- Marca el resultado de un lote ya enviado: [{id, resend_id, error}].
-- Con resend_id -> 'enviado'; sin él -> 'fallido' con su error.
create or replace function public.club57_email_lote_marcar(p_lote uuid, p_resultados jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update club57_email_envios e
  set estado = case when r.resend_id is not null then 'enviado' else 'fallido' end,
      resend_id = r.resend_id,
      error = case when r.resend_id is not null then null else coalesce(r.error, 'No se pudo enviar') end,
      enviado_en = case when r.resend_id is not null then now() else null end,
      updated_at = now()
  from jsonb_to_recordset(p_resultados) as r(id uuid, resend_id text, error text)
  where e.id = r.id and e.lote_id = p_lote and e.estado = 'pendiente';

  update club57_email_lotes set cerrado_at = now() where id = p_lote;
end;
$$;

-- Cierra la campaña si ya no le quedan pendientes.
create or replace function public.club57_email_campana_finalizar(p_campana uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado text;
begin
  perform club57_email_campana_recalcular(p_campana);
  if exists (select 1 from club57_email_envios where campana_id = p_campana and estado = 'pendiente') then
    select estado into v_estado from club57_email_campanas where id = p_campana;
    return v_estado;
  end if;
  update club57_email_campanas
  set estado = case when fallidos > 0 then 'con_errores' else 'completada' end,
      finalizada_at = now(),
      pausa_motivo = null,
      pausa_at = null,
      updated_at = now()
  where id = p_campana and estado in ('programada', 'en_proceso')
  returning estado into v_estado;
  return coalesce(v_estado, (select estado from club57_email_campanas where id = p_campana));
end;
$$;

-- Candado global con vencimiento (lease): true si este holder lo obtuvo.
create or replace function public.club57_email_lock_tomar(p_holder uuid, p_segundos integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  update club57_email_lock
  set holder = p_holder, locked_until = now() + make_interval(secs => p_segundos)
  where id = 1 and (holder is null or locked_until is null or locked_until < now() or holder = p_holder)
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

create or replace function public.club57_email_lock_soltar(p_holder uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update club57_email_lock set holder = null, locked_until = null where id = 1 and holder = p_holder;
$$;

-- Métrica del panel: de los destinatarios a quienes sí les llegó el último
-- aviso de cada promoción, cuántos descargaron el PDF (descargas únicas).
create or replace function public.club57_email_metricas()
returns table (
  promocion_id uuid,
  campana_id uuid,
  estado text,
  ultimo_envio timestamptz,
  enviados integer,
  descargaron integer
)
language sql
stable
security definer
set search_path = public
as $$
  with ultima as (
    select distinct on (c.promocion_id) c.promocion_id, c.id, c.estado
    from club57_email_campanas c
    where exists (select 1 from club57_email_envios e where e.campana_id = c.id and e.estado = 'enviado')
    order by c.promocion_id, c.created_at desc
  )
  select
    u.promocion_id,
    u.id,
    u.estado,
    (select max(e.enviado_en) from club57_email_envios e where e.campana_id = u.id and e.estado = 'enviado'),
    (select count(*) from club57_email_envios e where e.campana_id = u.id and e.estado = 'enviado')::integer,
    (
      select count(distinct d.member_id)
      from club57_promo_descargas d
      where d.promocion_id = u.promocion_id
        and d.member_id in (select e.member_id from club57_email_envios e where e.campana_id = u.id and e.estado = 'enviado')
    )::integer
  from ultima u
  where public.is_admin() or auth.role() = 'service_role';
$$;

-- Las funciones de escritura solo las llama el servidor (service role).
revoke all on function public.club57_email_uso() from public, anon, authenticated;
revoke all on function public.club57_email_elegibles(uuid, text) from public, anon, authenticated;
revoke all on function public.club57_email_elegibles_conteo(uuid) from public, anon, authenticated;
revoke all on function public.club57_email_campana_crear(uuid, text, timestamptz, text, uuid) from public, anon, authenticated;
revoke all on function public.club57_email_campana_recalcular(uuid) from public, anon, authenticated;
revoke all on function public.club57_email_lote_tomar(uuid, integer) from public, anon, authenticated;
revoke all on function public.club57_email_lote_marcar(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.club57_email_campana_finalizar(uuid) from public, anon, authenticated;
revoke all on function public.club57_email_lock_tomar(uuid, integer) from public, anon, authenticated;
revoke all on function public.club57_email_lock_soltar(uuid) from public, anon, authenticated;
revoke all on function public.club57_email_metricas() from public, anon;
grant execute on function public.club57_email_uso() to service_role;
grant execute on function public.club57_email_elegibles(uuid, text) to service_role;
grant execute on function public.club57_email_elegibles_conteo(uuid) to service_role;
grant execute on function public.club57_email_campana_crear(uuid, text, timestamptz, text, uuid) to service_role;
grant execute on function public.club57_email_campana_recalcular(uuid) to service_role;
grant execute on function public.club57_email_lote_tomar(uuid, integer) to service_role;
grant execute on function public.club57_email_lote_marcar(uuid, jsonb) to service_role;
grant execute on function public.club57_email_campana_finalizar(uuid) to service_role;
grant execute on function public.club57_email_lock_tomar(uuid, integer) to service_role;
grant execute on function public.club57_email_lock_soltar(uuid) to service_role;
grant execute on function public.club57_email_metricas() to authenticated, service_role;
