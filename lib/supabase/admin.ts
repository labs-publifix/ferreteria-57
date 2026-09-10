import { createClient } from "@supabase/supabase-js";

// Cliente con la service_role: se salta Row Level Security por completo y
// puede usar la Admin API de Auth (crear usuarios ya confirmados, sin
// pasar por el flujo de registro normal). SOLO se importa desde código
// que corre en el servidor (Server Actions) y que primero verifica
// is_admin() por su cuenta — nunca debe llegar al navegador ni usarse sin
// esa verificación previa. No usa @supabase/ssr (esto no es una sesión de
// usuario con cookies, es una credencial de servicio fija).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY (o NEXT_PUBLIC_SUPABASE_URL) en el servidor."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
