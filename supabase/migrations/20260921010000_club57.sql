-- Club 57 (programa de lealtad) — primer prompt: solo esquema +
-- configuración editable + alta manual de clientes + registro de compra.
-- Estrictamente ADITIVO: 5 tablas nuevas, ninguna existente se toca (ni
-- orders/order_items/zonas_envio/products/profiles/auth.users ni sus
-- triggers/políticas ya en producción). No hay riesgo de downtime ni
-- pérdida de datos: no hay ALTER/DROP sobre nada preexistente, solo
-- CREATE TABLE IF NOT EXISTS + CREATE FUNCTION + políticas nuevas sobre
-- tablas nuevas.

-- ---------------------------------------------------------------------
-- club57_config: fila única, mismo patrón que top_banner_config (id
-- boolean primary key + constraint que solo permite id = true).
-- ---------------------------------------------------------------------
create table if not exists public.club57_config (
  id boolean primary key default true,
  monto_por_punto numeric(10, 2) not null default 50 check (monto_por_punto >= 1),
  tasa_canje_pct numeric(5, 2) not null default 10 check (tasa_canje_pct between 1 and 50),
  dias_espera_pendiente integer not null default 7 check (dias_espera_pendiente between 0 and 30),
  puntos_referidor integer not null default 10 check (puntos_referidor between 1 and 100),
  puntos_referido integer not null default 10 check (puntos_referido between 1 and 100),
  updated_at timestamptz not null default now(),
  constraint club57_config_singleton check (id)
);

insert into public.club57_config (id)
values (true)
on conflict (id) do nothing;

alter table public.club57_config enable row level security;

-- Sin lectura pública todavía: nada en el sitio público consume estos
-- valores en este prompt ("se usarán en prompts futuros" — cuando algo sí
-- los necesite mostrar, se amplía esta política entonces).
drop policy if exists "Los admins administran la configuración de Club 57" on public.club57_config;
create policy "Los admins administran la configuración de Club 57"
  on public.club57_config for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- club57_members: 1:1 con auth.users (id = auth.users.id, igual que
-- profiles). email/telefono se duplican aquí (a propósito) porque
-- profiles no los expone y este módulo necesita poder buscar/mostrar
-- ambos sin tocar esa tabla.
-- ---------------------------------------------------------------------

-- Mismo patrón que generate_referral_code() de profiles (migración
-- 20260910020000), pero con su propia función y su propio espacio de
-- unicidad: el código de Club 57 es un dato distinto del referral_code de
-- profiles, aunque se genere igual.
create or replace function public.generate_club57_referral_code()
returns text
language plpgsql
as $$
declare
  code text;
  already_taken boolean;
begin
  loop
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    select exists(select 1 from public.club57_members where referral_code = code) into already_taken;
    exit when not already_taken;
  end loop;
  return code;
end;
$$;

create table if not exists public.club57_members (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  referral_code text not null unique default public.generate_club57_referral_code(),
  referred_by uuid references public.club57_members (id) on delete set null,
  -- 'vendedor': alta manual desde este panel. 'autoregistro': flujo de
  -- self-signup de un prompt futuro — la columna ya queda lista para esa
  -- distinción, aunque hoy solo 'vendedor' tiene un camino real.
  origen_alta text not null default 'vendedor' check (origen_alta in ('vendedor', 'autoregistro')),
  created_at timestamptz not null default now()
);

create index if not exists club57_members_email_idx on public.club57_members (email);
create index if not exists club57_members_phone_idx on public.club57_members (phone);

alter table public.club57_members enable row level security;

drop policy if exists "Los miembros ven su propio registro de Club 57" on public.club57_members;
create policy "Los miembros ven su propio registro de Club 57"
  on public.club57_members for select
  using (auth.uid() = id);

drop policy if exists "Los admins administran miembros de Club 57" on public.club57_members;
create policy "Los admins administran miembros de Club 57"
  on public.club57_members for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- club57_points_ledger: append-only de verdad — a propósito NO hay
-- política de update ni de delete para ningún rol de la app (ni admin),
-- así que la única forma de "corregir" un movimiento es insertar otro
-- que lo compense (p. ej. tipo='reversion_cancelacion'), nunca editar uno
-- ya escrito. Solo INSERT y SELECT quedan permitidos vía RLS.
-- ---------------------------------------------------------------------
create table if not exists public.club57_points_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.club57_members (id) on delete cascade,
  cantidad integer not null check (cantidad <> 0),
  tipo text not null check (
    tipo in ('compra_online', 'compra_manual', 'referido_bono', 'reversion_cancelacion', 'canje')
  ),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'disponible')),
  -- Fecha en la que este movimiento pasa de pendiente a disponible,
  -- calculada al insertar con dias_espera_pendiente — la transición en sí
  -- (el proceso que de verdad cambia estado a 'disponible' cuando esa
  -- fecha ya pasó) es trabajo de un prompt posterior; por ahora el dato
  -- queda calculado y visible, pero nada lo aplica todavía.
  fecha_disponible date,
  -- order_id (como texto) para compra_online, o texto libre para
  -- compra_manual (p. ej. el monto capturado) — nunca una FK real a
  -- orders: este ledger no debe depender de que ese pedido exista o no.
  referencia text,
  created_at timestamptz not null default now()
);

create index if not exists club57_points_ledger_member_id_idx on public.club57_points_ledger (member_id);
create index if not exists club57_points_ledger_estado_idx on public.club57_points_ledger (estado);

alter table public.club57_points_ledger enable row level security;

drop policy if exists "Los miembros ven su propio historial de puntos" on public.club57_points_ledger;
create policy "Los miembros ven su propio historial de puntos"
  on public.club57_points_ledger for select
  using (auth.uid() = member_id);

drop policy if exists "Los admins ven todo el historial de puntos" on public.club57_points_ledger;
create policy "Los admins ven todo el historial de puntos"
  on public.club57_points_ledger for select
  using (public.is_admin());

drop policy if exists "Los admins registran movimientos de puntos" on public.club57_points_ledger;
create policy "Los admins registran movimientos de puntos"
  on public.club57_points_ledger for insert
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- club57_redemption_catalog / club57_redemptions: SOLO esquema por ahora,
-- sin ninguna Server Action ni pantalla que los use todavía (eso es
-- trabajo de un prompt posterior). Quedan con RLS habilitado desde ya
-- (nunca una tabla nueva sin RLS, aunque todavía no tenga UI) con
-- políticas mínimas razonables que no hace falta reabrir después.
-- ---------------------------------------------------------------------
create table if not exists public.club57_redemption_catalog (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text not null default '',
  costo_puntos integer not null check (costo_puntos > 0),
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.club57_redemption_catalog enable row level security;

drop policy if exists "Cualquiera lee el catálogo de canje activo" on public.club57_redemption_catalog;
create policy "Cualquiera lee el catálogo de canje activo"
  on public.club57_redemption_catalog for select
  using (active or public.is_admin());

drop policy if exists "Los admins administran el catálogo de canje" on public.club57_redemption_catalog;
create policy "Los admins administran el catálogo de canje"
  on public.club57_redemption_catalog for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.club57_redemptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.club57_members (id) on delete cascade,
  item_id uuid not null references public.club57_redemption_catalog (id) on delete restrict,
  puntos_usados integer not null check (puntos_usados > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'entregado', 'cancelado')),
  created_at timestamptz not null default now()
);

create index if not exists club57_redemptions_member_id_idx on public.club57_redemptions (member_id);

alter table public.club57_redemptions enable row level security;

drop policy if exists "Los miembros ven sus propios canjes" on public.club57_redemptions;
create policy "Los miembros ven sus propios canjes"
  on public.club57_redemptions for select
  using (auth.uid() = member_id);

drop policy if exists "Los admins administran canjes" on public.club57_redemptions;
create policy "Los admins administran canjes"
  on public.club57_redemptions for all
  using (public.is_admin())
  with check (public.is_admin());
