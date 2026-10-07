import { createClient } from "@supabase/supabase-js";

// Cliente service role para el aviso por email, con TODA solicitud en
// `no-store`: Next.js 14 guarda en su caché de datos los fetch (incluso
// POST) de un route handler, y aquí una respuesta repetida significaría
// tomar un lote viejo o marcar como enviado algo que no salió. Mismo
// alcance que lib/supabase/admin.ts: solo servidor, tras verificar permisos
// (o la firma del enlace de baja / el secreto del cron).
export function createAvisosDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Falta configurar SUPABASE_SERVICE_ROLE_KEY (o NEXT_PUBLIC_SUPABASE_URL) en el servidor.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
