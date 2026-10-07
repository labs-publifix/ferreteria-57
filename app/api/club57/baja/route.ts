import { NextResponse, type NextRequest } from "next/server";
import { cambiarSuscripcionAvisos } from "@/lib/club57/avisos/baja";

// Baja en un clic (RFC 8058) para el encabezado List-Unsubscribe-Post de
// los avisos de promociones: el cliente de correo hace POST aquí sin
// sesión. Un GET (alguien que abrió el enlace) va a la página de
// confirmación, que pide un clic explícito: los escáneres de enlaces de
// los correos no dan de baja a nadie por solo visitarlo.
export const dynamic = "force-dynamic";
// Ninguna solicitud de esta ruta (base de datos ni servicio de correo)
// puede salir de la caché de datos de Next.js.
export const fetchCache = "force-no-store";

export async function POST(request: NextRequest) {
  const m = request.nextUrl.searchParams.get("m");
  const t = request.nextUrl.searchParams.get("t");
  const resultado = await cambiarSuscripcionAvisos(m, t, true);
  if (resultado === "invalido") return NextResponse.json({ error: "Enlace no válido" }, { status: 400 });
  if (resultado === "error") return NextResponse.json({ error: "Intenta más tarde" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const destino = new URL("/club57/baja", request.url);
  for (const key of ["m", "t"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) destino.searchParams.set(key, value);
  }
  return NextResponse.redirect(destino, 303);
}
