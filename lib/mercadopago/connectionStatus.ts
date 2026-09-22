import { createAdminClient } from "@/lib/supabase/admin";

export interface MercadoPagoConnectionStatus {
  connected: boolean;
  mpUserId: string | null;
  expiresAt: string | null;
}

// mercadopago_connection no tiene ninguna policy de RLS (ver su
// migración) — ni siquiera un admin autenticado puede leerla con el
// cliente normal, así que esta consulta usa service_role. Nunca devuelve
// access_token ni refresh_token: la página de Configuración solo necesita
// saber SI hay una conexión guardada, no el secreto en sí.
export async function getMercadoPagoConnectionStatus(): Promise<MercadoPagoConnectionStatus> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("mercadopago_connection")
    .select("mp_user_id, access_token, expires_at")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    console.error("[getMercadoPagoConnectionStatus]", error.message);
    return { connected: false, mpUserId: null, expiresAt: null };
  }
  if (!data || !data.access_token) {
    return { connected: false, mpUserId: null, expiresAt: null };
  }

  return { connected: true, mpUserId: data.mp_user_id, expiresAt: data.expires_at };
}
