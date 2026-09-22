-- ---------------------------------------------------------------------
-- mercadopago_connection: fila única con las credenciales OAuth de la
-- cuenta de Mercado Pago del cliente (modo Marketplace) — mismo patrón
-- singleton que club57_config y top_banner_config (id booleano + check).
-- A diferencia de esas dos, esta tabla NUNCA se lee desde el navegador:
-- guarda un access_token y un refresh_token reales, así que RLS se deja
-- activado SIN ninguna policy. Sin policies, ni anon ni authenticated
-- pueden hacer nada contra esta tabla — solo la service_role (que se
-- salta RLS por completo, ver lib/supabase/admin.ts) puede leerla o
-- escribirla, y esa clave nunca sale del servidor.
-- ---------------------------------------------------------------------
create table if not exists public.mercadopago_connection (
  id boolean primary key default true,
  mp_user_id text,
  access_token text,
  refresh_token text,
  public_key text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mercadopago_connection_singleton check (id)
);

alter table public.mercadopago_connection enable row level security;

-- Sin policies a propósito: ni siquiera los admins autenticados vía anon
-- key pueden leer o escribir esta tabla desde el navegador o desde una
-- Server Action con el cliente normal — solo código de servidor con
-- createAdminClient() (service_role) la toca, ver
-- lib/mercadopago/getSellerAccessToken.ts y el callback de OAuth.
