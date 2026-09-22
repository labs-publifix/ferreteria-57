import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/supabase/requireStaff";
import { MP_OAUTH_STATE_COOKIE, MP_OAUTH_STATE_MAX_AGE_SECONDS } from "@/lib/mercadopago/constants";

// El middleware (lib/supabase/middleware.ts) solo protege rutas que
// empiezan con "/admin" — "/api/admin/..." no matchea ese prefijo, así
// que esta ruta verifica la sesión por su cuenta, igual que cualquier
// Server Action del panel (nunca confiar en que otra capa ya filtró la
// request). Exige admin exacto (no vendedor): conectar Mercado Pago es
// configuración de la tienda, no atención a clientes.
export async function GET(request: NextRequest) {
  const staff = await requireStaff();
  if (!staff || staff.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const clientId = process.env.MP_CLIENT_ID;
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!clientId || !appBaseUrl) {
    return NextResponse.json(
      { error: "Falta configurar MP_CLIENT_ID o APP_BASE_URL en el servidor." },
      { status: 500 }
    );
  }

  // Un state aleatorio por intento de conexión — el callback lo compara
  // contra esta misma cookie para descartar cualquier respuesta que no
  // haya empezado aquí (protección estándar de OAuth contra CSRF).
  const state = randomBytes(24).toString("hex");

  const authorizeUrl = new URL("https://auth.mercadopago.com.mx/authorization");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("platform_id", "mp");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("redirect_uri", `${appBaseUrl}/api/mercadopago/callback`);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(MP_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MP_OAUTH_STATE_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
