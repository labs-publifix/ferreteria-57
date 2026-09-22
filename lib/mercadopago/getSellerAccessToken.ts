import { createAdminClient } from "@/lib/supabase/admin";
import { MP_TOKEN_EXPIRY_MARGIN_MS } from "@/lib/mercadopago/constants";

interface MpOAuthRefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Error propio (no un throw genérico) para que quien llame pueda
// distinguir "todavía no se conectó Mercado Pago" de cualquier otra falla
// y mostrar un mensaje accionable en vez de un error 500 genérico.
export class MercadoPagoNotConnectedError extends Error {
  constructor() {
    super("La tienda todavía no conectó su cuenta de Mercado Pago.");
    this.name = "MercadoPagoNotConnectedError";
  }
}

// Único punto del proyecto que entrega un access_token de Mercado Pago
// listo para usarse: siempre lee la fila real de mercadopago_connection
// (nunca cachea en memoria entre requests, esto corre en serverless) y
// refresca por su cuenta si hace falta, así quien llama nunca tiene que
// preocuparse por la expiración del token.
export async function getSellerAccessToken(): Promise<string> {
  const adminClient = createAdminClient();
  const { data: connection, error } = await adminClient
    .from("mercadopago_connection")
    .select("access_token, refresh_token, expires_at")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    console.error("[getSellerAccessToken] fallo al leer mercadopago_connection", error.message);
    throw new Error("No se pudo leer la conexión con Mercado Pago.");
  }
  if (!connection || !connection.access_token || !connection.refresh_token) {
    throw new MercadoPagoNotConnectedError();
  }

  const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
  const isExpiringSoon = expiresAt - Date.now() < MP_TOKEN_EXPIRY_MARGIN_MS;
  if (!isExpiringSoon) {
    return connection.access_token;
  }

  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Falta configurar MP_CLIENT_ID o MP_CLIENT_SECRET en el servidor.");
  }

  const refreshResponse = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_secret: clientSecret,
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
    }),
  });

  if (!refreshResponse.ok) {
    const errorBody = await refreshResponse.text();
    console.error("[getSellerAccessToken] oauth/token (refresh) respondió", refreshResponse.status, errorBody);
    throw new Error("No se pudo refrescar el token de Mercado Pago.");
  }

  const refreshed: MpOAuthRefreshResponse = await refreshResponse.json();
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  const { error: updateError } = await adminClient
    .from("mercadopago_connection")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (updateError) {
    // El token refrescado sí sirve para este request aunque no se haya
    // podido guardar — devolverlo igual es mejor que fallar el cobro por
    // un problema de persistencia; el próximo request lo detectará como
    // "por vencer" de nuevo y reintentará guardar el refresh.
    console.error("[getSellerAccessToken] fallo al guardar el token refrescado", updateError.message);
  }

  return refreshed.access_token;
}
