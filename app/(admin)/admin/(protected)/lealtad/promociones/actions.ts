"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/supabase/requireStaff";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";
import {
  PROMO_BUCKET,
  PROMO_MAX_BYTES,
  isPromoTipoHabilitado,
  promoTipoInfo,
  type PromoEstado,
  type PromoTipo,
} from "@/lib/club57/promociones/config";
import { defaultTituloFromFilename, formatBytes, hasPdfSignature } from "@/lib/club57/promociones/archivo";
import {
  findOverlappingPromo,
  formatRangoLegible,
  isIsoDate,
  promoEstadoVisible,
  type PromoEstadoVisible,
} from "@/lib/club57/promociones/vigencia";

// Promociones es exclusivo de admin (un vendedor no publica contenido).
// Cada acción lo verifica por su cuenta, igual que el resto del panel.
async function requireAdmin() {
  const staff = await requireStaff();
  if (!staff || staff.role !== "admin") return null;
  return staff;
}

type AdminSession = NonNullable<Awaited<ReturnType<typeof requireAdmin>>>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MB_LABEL = formatBytes(PROMO_MAX_BYTES);

function revalidatePromociones() {
  revalidatePath("/admin/lealtad/promociones", "layout");
  revalidatePath("/cuenta");
}

// Errores levantados por los triggers/restricciones de la migración
// 20261006010000 — se traducen a un mensaje que ya se puede mostrar tal cual.
function translateDbError(error: { code?: string; message: string }, fallback: string): string {
  switch (error.code) {
    case "23P01":
      return "Esas fechas se traslapan con otra promoción publicada del mismo tipo. Ajusta el rango.";
    case "F57IM":
    case "F57AR":
    case "F57TR":
    case "F57DL":
      return error.message;
    default:
      return `${fallback}: ${error.message}`;
  }
}

async function findOverlapMessage(
  session: AdminSession,
  tipo: PromoTipo,
  rango: { inicio: string; fin: string },
  excludeId: string
): Promise<string | null> {
  const { data, error } = await session.supabase
    .from("club57_promociones")
    .select("id, titulo, vigencia_inicio, vigencia_fin")
    .eq("tipo", tipo)
    .eq("estado", "publicada");
  if (error) return `No se pudo validar el traslape de fechas: ${error.message}`;

  const publicadas = (data ?? []).map((row) => ({
    id: row.id as string,
    titulo: row.titulo as string,
    inicio: row.vigencia_inicio as string,
    fin: row.vigencia_fin as string,
  }));
  const overlap = findOverlappingPromo(rango, publicadas, excludeId);
  if (!overlap) return null;
  return `Se traslapa con "${overlap.titulo}" (${formatRangoLegible(overlap)}). Ajusta las fechas o archiva esa promoción primero.`;
}

// ---------------------------------------------------------------------
// Paso 1 — Archivo
// ---------------------------------------------------------------------

export interface CreatePromoUploadUrlResult {
  error?: string;
  signedUrl?: string;
  path?: string;
}

// El PDF NO pasa por Vercel (límite de ~4.5 MB por request): el navegador
// lo sube directo a Storage con esta URL firmada de un solo uso, y después
// llama a finalizePromoUpload para validarlo y registrarlo.
export async function createPromoUploadUrl(input: { tipo: string; fileSize: number }): Promise<CreatePromoUploadUrlResult> {
  const session = await requireAdmin();
  if (!session) return { error: "No autorizado." };
  if (!isPromoTipoHabilitado(input.tipo)) return { error: "Tipo de promoción no válido." };
  if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) return { error: "El archivo está vacío." };
  if (input.fileSize > PROMO_MAX_BYTES) {
    return { error: `El PDF pesa ${formatBytes(input.fileSize)}; el máximo permitido es ${MAX_MB_LABEL}.` };
  }

  const path = `${input.tipo}/${randomUUID()}.pdf`;
  const { data, error } = await createAdminClient().storage.from(PROMO_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: "No se pudo preparar la subida. Intenta de nuevo." };
  return { signedUrl: data.signedUrl, path };
}

export interface FinalizePromoUploadResult {
  error?: string;
  promo?: { id: string; titulo: string; nombre: string; bytes: number; sha256: string };
}

export async function finalizePromoUpload(input: {
  tipo: string;
  path: string;
  originalName: string;
}): Promise<FinalizePromoUploadResult> {
  const session = await requireAdmin();
  if (!session) return { error: "No autorizado." };
  if (!isPromoTipoHabilitado(input.tipo)) return { error: "Tipo de promoción no válido." };
  const tipo = input.tipo;

  // Solo rutas con la forma exacta que genera createPromoUploadUrl.
  const pathPattern = new RegExp(`^${tipo}/[0-9a-f-]{36}\\.pdf$`);
  if (!pathPattern.test(input.path)) return { error: "Ruta de archivo no válida." };

  const storage = createAdminClient().storage.from(PROMO_BUCKET);
  const reject = async (message: string): Promise<FinalizePromoUploadResult> => {
    await storage.remove([input.path]);
    return { error: message };
  };

  const { data: info, error: infoError } = await storage.info(input.path);
  if (infoError || !info) return { error: "No encontramos el archivo subido. Vuelve a intentarlo." };
  const declaredSize = Number(info.size ?? 0);
  if (declaredSize > PROMO_MAX_BYTES) {
    return reject(`El PDF pesa ${formatBytes(declaredSize)}; el máximo permitido es ${MAX_MB_LABEL}.`);
  }

  const { data: blob, error: downloadError } = await storage.download(input.path);
  if (downloadError || !blob) return { error: "No se pudo leer el archivo subido. Vuelve a intentarlo." };
  const bytes = new Uint8Array(await blob.arrayBuffer());

  if (bytes.byteLength === 0) return reject("El archivo está vacío.");
  if (bytes.byteLength > PROMO_MAX_BYTES) {
    return reject(`El PDF pesa ${formatBytes(bytes.byteLength)}; el máximo permitido es ${MAX_MB_LABEL}.`);
  }
  if (!hasPdfSignature(bytes)) {
    return reject("El archivo no es un PDF válido. Exporta la promoción como PDF y vuelve a subirla.");
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const nombre = input.originalName.trim().slice(0, 255) || "promocion.pdf";
  const titulo = defaultTituloFromFilename(nombre, `${promoTipoInfo(tipo).label} ${todayInStoreTimezone()}`);

  const { data: inserted, error: insertError } = await session.supabase
    .from("club57_promociones")
    .insert({
      tipo,
      titulo,
      archivo_path: input.path,
      archivo_nombre_original: nombre,
      archivo_bytes: bytes.byteLength,
      archivo_sha256: sha256,
      archivo_mime: "application/pdf",
      estado: "borrador",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    return reject(translateDbError(insertError ?? { message: "sin respuesta" }, "No se pudo registrar el archivo"));
  }

  revalidatePromociones();
  return { promo: { id: inserted.id, titulo, nombre, bytes: bytes.byteLength, sha256 } };
}

export interface PromoActionResult {
  error?: string;
}

export async function updatePromoTitulo(id: string, titulo: string): Promise<PromoActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "No autorizado." };
  if (!UUID_PATTERN.test(id)) return { error: "Promoción no encontrada." };
  const clean = titulo.replace(/\s+/g, " ").trim();
  if (clean.length < 3 || clean.length > 80) return { error: "El nombre interno debe tener entre 3 y 80 caracteres." };

  const { error } = await session.supabase.from("club57_promociones").update({ titulo: clean }).eq("id", id);
  if (error) return { error: translateDbError(error, "No se pudo guardar el nombre") };
  revalidatePromociones();
  return {};
}

// ---------------------------------------------------------------------
// Paso 2 — Vigencia (también "Editar fechas" del listado)
// ---------------------------------------------------------------------

export async function setPromoVigencia(id: string, inicio: string, fin: string): Promise<PromoActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "No autorizado." };
  if (!UUID_PATTERN.test(id)) return { error: "Promoción no encontrada." };
  if (!isIsoDate(inicio) || !isIsoDate(fin)) return { error: "Elige una fecha de inicio y una de fin válidas." };
  if (fin < inicio) return { error: "La fecha de fin no puede ser anterior a la de inicio." };

  const { data: promo, error: fetchError } = await session.supabase
    .from("club57_promociones")
    .select("id, tipo, estado, vigencia_inicio")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return { error: `No se pudo leer la promoción: ${fetchError.message}` };
  if (!promo) return { error: "Promoción no encontrada." };
  if (promo.estado === "archivada") return { error: "Una promoción archivada ya no se puede modificar." };

  const hoy = todayInStoreTimezone();
  if (fin < hoy) return { error: "La fecha de fin ya pasó: elige una fecha de hoy en adelante." };
  // Una promoción ya vigente conserva su inicio original aunque sea pasado;
  // cualquier otro inicio debe ser de hoy en adelante.
  if (inicio < hoy && inicio !== promo.vigencia_inicio) {
    return { error: "La fecha de inicio no puede ser anterior a hoy." };
  }

  const overlap = await findOverlapMessage(session, promo.tipo, { inicio, fin }, id);
  if (overlap) return { error: overlap };

  const { error } = await session.supabase
    .from("club57_promociones")
    .update({ vigencia_inicio: inicio, vigencia_fin: fin })
    .eq("id", id);
  if (error) return { error: translateDbError(error, "No se pudieron guardar las fechas") };

  revalidatePromociones();
  return {};
}

// ---------------------------------------------------------------------
// Paso 3 — Publicar
// ---------------------------------------------------------------------

export interface PublishPromoResult {
  error?: string;
  publicada?: { estadoVisible: Exclude<PromoEstadoVisible, "vencida">; inicio: string; fin: string };
}

export async function publishPromo(id: string): Promise<PublishPromoResult> {
  const session = await requireAdmin();
  if (!session) return { error: "No autorizado." };
  if (!UUID_PATTERN.test(id)) return { error: "Promoción no encontrada." };

  const { data: promo, error: fetchError } = await session.supabase
    .from("club57_promociones")
    .select("id, tipo, estado, vigencia_inicio, vigencia_fin")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return { error: `No se pudo leer la promoción: ${fetchError.message}` };
  if (!promo) return { error: "Promoción no encontrada." };
  if ((promo.estado as PromoEstado) !== "borrador") return { error: "Esta promoción ya fue publicada." };
  if (!promo.vigencia_inicio || !promo.vigencia_fin) return { error: "Elige la vigencia antes de publicar." };

  const rango = { inicio: promo.vigencia_inicio as string, fin: promo.vigencia_fin as string };
  const hoy = todayInStoreTimezone();
  if (rango.fin < hoy) return { error: "La vigencia ya terminó: ajusta las fechas antes de publicar." };

  const overlap = await findOverlapMessage(session, promo.tipo, rango, id);
  if (overlap) return { error: overlap };

  const { data: updated, error } = await session.supabase
    .from("club57_promociones")
    .update({ estado: "publicada" })
    .eq("id", id)
    .eq("estado", "borrador")
    .select("id");
  if (error) return { error: translateDbError(error, "No se pudo publicar") };
  if (!updated || updated.length === 0) return { error: "Esta promoción ya fue publicada." };

  revalidatePromociones();
  const estadoVisible = promoEstadoVisible(rango, hoy);
  return { publicada: { estadoVisible: estadoVisible === "programada" ? "programada" : "vigente", ...rango } };
}

// ---------------------------------------------------------------------
// Acciones por fila
// ---------------------------------------------------------------------

export async function archivePromo(id: string): Promise<PromoActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "No autorizado." };
  if (!UUID_PATTERN.test(id)) return { error: "Promoción no encontrada." };

  const { data, error } = await session.supabase
    .from("club57_promociones")
    .update({ estado: "archivada" })
    .eq("id", id)
    .eq("estado", "publicada")
    .select("id");
  if (error) return { error: translateDbError(error, "No se pudo archivar") };
  if (!data || data.length === 0) return { error: "Solo se pueden archivar promociones publicadas." };

  revalidatePromociones();
  return {};
}

// Libera espacio en Storage. Archivada sin descargas: se borra completa.
// Archivada con descargas: se borra solo el PDF y la fila queda como
// historial (fechas y descargas únicas) con archivo_eliminado_at.
export async function deleteArchivedPromo(id: string): Promise<PromoActionResult & { conservada?: boolean }> {
  const session = await requireAdmin();
  if (!session) return { error: "No autorizado." };
  if (!UUID_PATTERN.test(id)) return { error: "Promoción no encontrada." };

  const { data: promo, error: fetchError } = await session.supabase
    .from("club57_promociones")
    .select("id, estado, archivo_path, archivo_eliminado_at")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return { error: `No se pudo leer la promoción: ${fetchError.message}` };
  if (!promo) return { error: "Promoción no encontrada." };
  if (promo.estado !== "archivada") return { error: "Archiva la promoción antes de eliminarla." };
  if (promo.archivo_eliminado_at) return { error: "El PDF de esta promoción ya se eliminó." };

  const { count, error: countError } = await session.supabase
    .from("club57_promo_descargas")
    .select("id", { count: "exact", head: true })
    .eq("promocion_id", id);
  if (countError) return { error: `No se pudieron revisar las descargas: ${countError.message}` };

  const { error: removeError } = await createAdminClient()
    .storage.from(PROMO_BUCKET)
    .remove([promo.archivo_path as string]);
  if (removeError) return { error: "No se pudo eliminar el PDF. Intenta de nuevo." };

  if (!count) {
    const { error } = await session.supabase.from("club57_promociones").delete().eq("id", id);
    if (error) return { error: translateDbError(error, "No se pudo eliminar la promoción") };
    revalidatePromociones();
    return {};
  }

  const { error } = await session.supabase
    .from("club57_promociones")
    .update({ archivo_eliminado_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: translateDbError(error, "No se pudo registrar la eliminación del PDF") };
  revalidatePromociones();
  return { conservada: true };
}

export async function deletePromoDraft(id: string): Promise<PromoActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "No autorizado." };
  if (!UUID_PATTERN.test(id)) return { error: "Promoción no encontrada." };

  const { data, error } = await session.supabase
    .from("club57_promociones")
    .delete()
    .eq("id", id)
    .eq("estado", "borrador")
    .select("archivo_path");
  if (error) return { error: translateDbError(error, "No se pudo eliminar") };
  if (!data || data.length === 0) return { error: "Solo se pueden eliminar borradores." };

  const { error: removeError } = await createAdminClient()
    .storage.from(PROMO_BUCKET)
    .remove(data.map((row) => row.archivo_path as string));
  if (removeError) console.error("[deletePromoDraft] no se pudo borrar el archivo:", removeError.message);

  revalidatePromociones();
  return {};
}
