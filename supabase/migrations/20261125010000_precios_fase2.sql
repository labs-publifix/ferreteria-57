-- Precios · Fase 2: elegir qué lista es el precio de tienda.
--
-- 1) price_settings_log: bitácora de cada cambio de la lista de tienda
--    (quién, cuándo, de qué lista a cuál y cuántas presentaciones cambiaron
--    de precio).
-- 2) vista_previa_lista_tienda(n): antes de confirmar, cuántas
--    presentaciones subirían, bajarían o quedarían igual, y cuántas ofertas
--    («precio antes») dejarían de mostrarse.
-- 3) aplicar_lista_tienda(n): cambia la lista de tienda y, en la misma
--    transacción, pone a cada presentación el precio de esa lista. Solo el
--    admin completo.
-- 4) product_price_levels registra solo quién y cuándo cambió las listas
--    (fichas de producto e importadores).
--
-- No toca datos al correrse: la tienda sigue con la lista que ya tiene.
-- Idempotente: se puede correr más de una vez.

-- ---------------------------------------------------------------------
-- 1) Bitácora
-- ---------------------------------------------------------------------
create table if not exists public.price_settings_log (
  id bigint generated always as identity primary key,
  lista_anterior smallint not null check (lista_anterior between 1 and 4),
  lista_nueva smallint not null check (lista_nueva between 1 and 4),
  presentaciones_cambiadas integer not null default 0,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists price_settings_log_changed_at_idx
  on public.price_settings_log (changed_at desc);

alter table public.price_settings_log enable row level security;

drop policy if exists "El personal lee la bitácora de precios" on public.price_settings_log;
create policy "El personal lee la bitácora de precios"
  on public.price_settings_log for select
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 2) Vista previa del cambio
-- ---------------------------------------------------------------------
create or replace function public.vista_previa_lista_tienda(p_lista smallint)
returns table (
  lista_actual smallint,
  total integer,
  suben integer,
  bajan integer,
  sin_cambio integer,
  ofertas_ocultas integer,
  cambio_promedio_pct numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_full_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_lista is null or p_lista not between 1 and 4 then
    raise exception 'Lista inválida' using errcode = '22023';
  end if;

  return query
  with c as (
    select
      pv.price as actual,
      public.precio_de_lista(l, p_lista) as nuevo,
      pv.compare_at_price as antes
    from public.product_variants pv
    join public.product_price_levels l on l.variant_id = pv.id
  )
  select
    public.lista_tienda_actual(),
    count(*)::integer,
    count(*) filter (where nuevo > actual)::integer,
    count(*) filter (where nuevo < actual)::integer,
    count(*) filter (where nuevo = actual)::integer,
    -- Ofertas que hoy se ven (precio antes > precio actual) y con el nuevo
    -- precio ya no (precio antes <= nuevo).
    count(*) filter (where antes is not null and antes > actual and antes <= nuevo)::integer,
    coalesce(round(avg(case when actual > 0 and nuevo <> actual then (nuevo - actual) / actual * 100 end), 1), 0)
  from c;
end;
$$;

revoke execute on function public.vista_previa_lista_tienda(smallint) from public, anon;
grant execute on function public.vista_previa_lista_tienda(smallint) to authenticated;

-- ---------------------------------------------------------------------
-- 3) Aplicar el cambio
-- ---------------------------------------------------------------------
create or replace function public.aplicar_lista_tienda(p_lista smallint)
returns table (lista_anterior smallint, lista_nueva smallint, presentaciones_cambiadas integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anterior smallint;
  v_cambiadas integer := 0;
begin
  if not public.is_full_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_lista is null or p_lista not between 1 and 4 then
    raise exception 'Lista inválida' using errcode = '22023';
  end if;

  -- Bloquea la configuración: dos cambios al mismo tiempo se forman.
  select s.lista_tienda into v_anterior from public.price_settings s where s.id for update;
  if v_anterior is null then
    insert into public.price_settings (id) values (true) on conflict (id) do nothing;
    select s.lista_tienda into v_anterior from public.price_settings s where s.id for update;
  end if;

  if v_anterior = p_lista then
    return query select v_anterior, p_lista, 0;
    return;
  end if;

  update public.price_settings
  set lista_tienda = p_lista, updated_at = now(), updated_by = auth.uid()
  where id;

  -- Con la bandera puesta, el trigger de «cambio manual de precio» no toca
  -- las listas: aquí solo se copia la lista elegida al precio de tienda.
  perform set_config('f57.sincronizando_precios', '1', true);
  update public.product_variants pv
  set price = public.precio_de_lista(l, p_lista)
  from public.product_price_levels l
  where l.variant_id = pv.id
    and pv.price is distinct from public.precio_de_lista(l, p_lista);
  get diagnostics v_cambiadas = row_count;
  perform set_config('f57.sincronizando_precios', '', true);

  insert into public.price_settings_log (lista_anterior, lista_nueva, presentaciones_cambiadas, changed_by)
  values (v_anterior, p_lista, v_cambiadas, auth.uid());

  return query select v_anterior, p_lista, v_cambiadas;
end;
$$;

revoke execute on function public.aplicar_lista_tienda(smallint) from public, anon;
grant execute on function public.aplicar_lista_tienda(smallint) to authenticated;

-- ---------------------------------------------------------------------
-- 4) Quién y cuándo cambió las listas de una presentación
-- ---------------------------------------------------------------------
create or replace function public.product_price_levels_auditar()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

drop trigger if exists product_price_levels_auditar on public.product_price_levels;
create trigger product_price_levels_auditar
  before insert or update on public.product_price_levels
  for each row execute function public.product_price_levels_auditar();
