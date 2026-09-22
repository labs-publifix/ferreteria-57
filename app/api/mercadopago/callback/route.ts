import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MP_OAUTH_STATE_COOKIE } from "@/lib/mercadopago/constants";

interface MpOAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  user_id: number;
  public_key: string;
  expires_in: number;
  scope: string;
}

// A dónde vuelve el admin después del intento de conexión (éxito o
// error) — el bloque "Mercado Pago" de Configuración lee ?mp=... para
// mostrar el mensaje, así la pantalla de confirmación es la misma
// pantalla desde la que se inició, ya reflejando el nuevo estado.
const CONFIG_PAGE_PATH = "/admin/configuracion";

function redirectWithStatus(request: NextRequest, status: "success" | "error", message?: string) {
  const url = new URL(CONFIG_PAGE_PATH, request.url);
  url.searchParams.set("mp", status);
  if (message) url.searchParams.set("mp_message", message);
  const response = NextResponse.redirect(url);
  // La cookie de state ya cumplió su propósito (validar este intento) —
  // se limpia siempre, tanto en éxito como en error.
  response.cookies.delete(MP_OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get(MP_OAUTH_STATE_COOKIE)?.value;

  if (!code) {
    return redirectWithStatus(request, "error", "Mercado Pago no envió un código de autorización.");
  }
  if (!state || !savedState || state !== savedState) {
    return redirectWithStatus(
      request,
      "error",
      "La verificación de la solicitud falló (state inválido o expirado). Intenta conectar de nuevo."
    );
  }

  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!clientId || !clientSecret || !appBaseUrl) {
    return redirectWithStatus(request, "error", "Falta configurar las credenciales de Mercado Pago en el servidor.");
  }

  let tokenData: MpOAuthTokenResponse;
  try {
    const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_secret: clientSecret,
        client_id: clientId,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${appBaseUrl}/api/mercadopago/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("[mercadopago/callback] oauth/token respondió", tokenResponse.status, errorBody);
      return redirectWithStatus(request, "error", "Mercado Pago rechazó el intercambio del código de autorización.");
    }

    tokenData = await tokenResponse.json();
  } catch (err) {
    console.error("[mercadopago/callback] fallo al llamar oauth/token", err);
    return redirectWithStatus(request, "error", "No se pudo contactar a Mercado Pago. Intenta de nuevo.");
  }

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  const adminClient = createAdminClient();
  const { error: upsertError } = await adminClient.from("mercadopago_connection").upsert({
    id: true,
    mp_user_id: String(tokenData.user_id),
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    public_key: tokenData.public_key,
    expires_at: expiresAt,
    scope: tokenData.scope,
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    console.error("[mercadopago/callback] fallo al guardar la conexión", upsertError.message);
    return redirectWithStatus(request, "error", "Se obtuvo el token pero no se pudo guardar. Intenta de nuevo.");
  }

  return redirectWithStatus(request, "success");
}
