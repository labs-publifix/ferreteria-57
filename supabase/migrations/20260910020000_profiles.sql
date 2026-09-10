-- Perfil público de cada usuario autenticado, más su código de
-- referido para el Programa de Lealtad (mecánica de puntos/canje: fase
-- posterior, esto solo deja el dato listo).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  referral_code text unique not null,
  created_at timestamptz not null default now()
);

-- Genera un código corto (6 caracteres, mayúsculas + dígitos) y reintenta
-- en el, en la práctica nunca alcanzado, caso de choque contra uno ya
-- existente — más simple y suficientemente único que encadenar sufijos.
create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  code text;
  already_taken boolean;
begin
  loop
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    select exists(select 1 from public.profiles where referral_code = code) into already_taken;
    exit when not already_taken;
  end loop;
  return code;
end;
$$;

-- Patrón estándar de Supabase para poblar datos propios de la app al
-- registrarse: trigger en auth.users (tabla que Supabase Auth administra)
-- que inserta la fila correspondiente en public.profiles. full_name viene
-- del metadata que el cliente manda en supabase.auth.signUp({ options: {
-- data: { full_name } } }), ver AuthTabs.tsx.
-- security definer + search_path fijo: corre con permisos suficientes
-- para escribir en public.profiles sin importar qué políticas de RLS
-- tenga esa tabla, y sin quedar expuesto a que alguien manipule
-- search_path para colar una función propia con el mismo nombre.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, referral_code)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    public.generate_referral_code()
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Cada quien lee/edita solo su propia fila. La inserción no necesita su
-- propia política: la hace el trigger de arriba, que corre como
-- security definer y por lo tanto no pasa por RLS.
alter table public.profiles enable row level security;

drop policy if exists "Los usuarios ven su propio perfil" on public.profiles;
create policy "Los usuarios ven su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Los usuarios editan su propio perfil" on public.profiles;
create policy "Los usuarios editan su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);
