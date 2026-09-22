-- Club 57 — captura real de referred_by: hasta ahora la columna y todo el
-- bono de referido (grant_club57_referral_bonus, ya construido) existían
-- pero ningún formulario pedía el código de quien invitó, así que
-- referred_by siempre quedaba null. Puramente aditivo: una función nueva
-- (para que el formulario de registro, sin sesión todavía, pueda
-- verificar un código sin exponer RLS) + una rama nueva dentro de
-- handle_new_user() que solo se activa si el metadata trae un código.
-- Todo lo demás del alta (online o manual) sigue exactamente igual.

-- club57_referral_code_exists(): único uso es la verificación del lado
-- del cliente en /cuenta ANTES de llamar signUp() — el formulario de
-- registro no tiene sesión todavía, así que una consulta normal a
-- club57_members no vería nada (RLS solo deja leer la fila propia).
-- SECURITY DEFINER + solo boolean de regreso: nunca expone datos de la
-- fila (nombre, correo, teléfono) a quien todavía no se ha registrado,
-- solo "¿existe este código?".
create or replace function public.club57_referral_code_exists(p_code text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.club57_members where upper(referral_code) = upper(trim(p_code))
  );
$$;

grant execute on function public.club57_referral_code_exists(text) to anon, authenticated;

-- handle_new_user(): idéntica a 20260922010000, más la resolución de
-- referred_by. El código tecleado en el formulario viaja como
-- raw_user_meta_data ->> 'referred_by_code' (mismo mecanismo que ya usa
-- full_name) — NUNCA se confía en ese valor tal cual (cualquiera podría
-- llamar la API de Auth directo, sin pasar por el formulario ni por
-- club57_referral_code_exists()): aquí se vuelve a resolver contra
-- club57_members, así que el peor caso es que el código no matchee nada
-- y referred_by quede null, igual que si el campo se hubiera dejado
-- vacío — nunca un error que tumbe la creación de la cuenta completa.
-- Autorreferencia (Parte 3): si por lo que sea el id resuelto fuera el
-- del propio usuario que se está creando, se ignora igual que un código
-- no encontrado.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_referral_code text;
  v_referred_by_code text;
  v_referred_by_id uuid;
begin
  insert into public.profiles (id, full_name, referral_code)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    public.generate_referral_code()
  )
  returning referral_code into v_referral_code;

  v_referred_by_code := nullif(trim(new.raw_user_meta_data ->> 'referred_by_code'), '');
  if v_referred_by_code is not null then
    select id into v_referred_by_id
    from public.club57_members
    where upper(referral_code) = upper(v_referred_by_code);

    if v_referred_by_id = new.id then
      v_referred_by_id := null;
    end if;
  end if;

  insert into public.club57_members (id, full_name, email, phone, referral_code, referred_by, origen_alta)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email),
    new.email,
    null,
    v_referral_code,
    v_referred_by_id,
    'autoregistro'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
