import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { procesarAvisos } from "@/lib/club57/avisos/processor";
import { getAvisosBaseUrl, isAvisosEnabled } from "@/lib/club57/avisos/config";

// Cron diario (vercel.json, 15:00 UTC = 9:00 CDMX) que manda los avisos
// por email de promociones de Club 57 que tocan hoy. Protegido con
// CRON_SECRET (Vercel lo manda como "Authorization: Bearer <secreto>");
// sin secreto configurado responde 401 siempre.
//
// maxDuration 60 s cabe en cualquier plan de Vercel. La corrida usa ~50 s
// y, si se acaba el tiempo con trabajo pendiente y capacidad disponible
// (solo pasa con una capacidad diaria grande), se vuelve a invocar a sí
// misma (encadenado, máximo 20 eslabones).
export const dynamic = "force-dynamic";
// Ninguna solicitud de esta ruta (base de datos ni servicio de correo)
// puede salir de la caché de datos de Next.js.
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const PRESUPUESTO_MS = 50_000;
const MAX_ESLABONES = 20;

function autorizado(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const recibido = Buffer.from(request.headers.get("authorization") ?? "");
  const esperado = Buffer.from(`Bearer ${secret}`);
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

async function encadenar(eslabon: number) {
  try {
    await fetch(`${getAvisosBaseUrl()}/api/cron/club57-avisos`, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}`, "x-club57-eslabon": String(eslabon) },
      cache: "no-store",
      // Basta con que la siguiente invocación arranque; no se espera su fin.
      signal: AbortSignal.timeout(2500),
    });
  } catch {
    // Timeout esperado: la siguiente invocación sigue corriendo por su cuenta.
  }
}

export async function GET(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!isAvisosEnabled()) {
    return NextResponse.json({ ok: true, desactivado: true });
  }

  const eslabon = Number.parseInt(request.headers.get("x-club57-eslabon") ?? "0", 10) || 0;
  try {
    const resultado = await procesarAvisos({ presupuestoMs: PRESUPUESTO_MS });
    if (resultado.detenidoPor === "tiempo" && eslabon < MAX_ESLABONES) {
      await encadenar(eslabon + 1);
    }
    return NextResponse.json({ ok: true, eslabon, ...resultado });
  } catch (error) {
    console.error("[cron club57-avisos]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
