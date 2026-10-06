import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROMO_BUCKET } from "@/lib/club57/promociones/config";
import { contentDispositionAttachment } from "@/lib/club57/promociones/archivo";
import { promoEstadoVisible } from "@/lib/club57/promociones/vigencia";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } });
}

// Descarga protegida del PDF de una promoción de Club 57. La vigencia se
// valida AQUÍ en cada request (el botón deshabilitado en /cuenta es solo
// cortesía visual). Orden fijo de validaciones:
//   1) sesión válida            -> 401
//   2) miembro de Club 57       -> 403
//   3) existe y está publicada  -> 404 (archivadas y borradores incluidos)
//   4) hoy (CDMX) en [inicio, fin], ambos inclusivos -> 410
// Si todo pasa, registra la descarga y TRANSMITE el archivo desde Storage
// en streaming (sin URL pública ni firmada, y sin cargarlo completo en
// memoria ni chocar con el límite de cuerpo de respuesta de Vercel).
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError(401, "Inicia sesión para descargar esta promoción.");

  const admin = createAdminClient();
  const { data: member, error: memberError } = await admin
    .from("club57_members")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (memberError) return jsonError(500, "No se pudo verificar tu membresía. Intenta de nuevo.");
  if (!member) return jsonError(403, "Esta descarga es exclusiva para miembros de Club 57.");

  if (!UUID_PATTERN.test(params.id)) return jsonError(404, "Promoción no encontrada.");
  const { data: promo, error: promoError } = await admin
    .from("club57_promociones")
    .select("id, archivo_path, archivo_nombre_original, archivo_bytes, vigencia_inicio, vigencia_fin")
    .eq("id", params.id)
    .eq("estado", "publicada")
    .maybeSingle();
  if (promoError) return jsonError(500, "No se pudo consultar la promoción. Intenta de nuevo.");
  if (!promo) return jsonError(404, "Promoción no encontrada.");

  const estado = promoEstadoVisible(
    { inicio: promo.vigencia_inicio as string, fin: promo.vigencia_fin as string },
    todayInStoreTimezone()
  );
  if (estado === "vencida") return jsonError(410, "Esta promoción ya no está vigente");
  if (estado === "programada") return jsonError(410, "Esta promoción todavía no está disponible");

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const objectPath = (promo.archivo_path as string).split("/").map(encodeURIComponent).join("/");
  const upstream = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${PROMO_BUCKET}/${objectPath}`,
    {
      headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey },
      cache: "no-store",
    }
  );
  if (!upstream.ok || !upstream.body) {
    console.error("[descargar promoción] Storage respondió", upstream.status);
    return jsonError(502, "No se pudo obtener el archivo. Intenta de nuevo en unos minutos.");
  }

  // Métrica, no candado: si el registro falla, el miembro igual recibe su PDF.
  const { error: logError } = await admin
    .from("club57_promo_descargas")
    .insert({ promocion_id: promo.id, member_id: user.id });
  if (logError) console.error("[descargar promoción] no se registró la descarga:", logError.message);

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDispositionAttachment(promo.archivo_nombre_original as string),
      "Content-Length": upstream.headers.get("content-length") ?? String(promo.archivo_bytes),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
