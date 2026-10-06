"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/supabase/requireStaff";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";
import {
  LIQUIDACION_EXCEL_MAX_BYTES,
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
  type PromoRango,
} from "@/lib/club57/promociones/vigencia";
import { parseLiquidacionExcel, type LiquidacionProducto } from "@/lib/club57/promociones/liquidaciones/parseExcel";
import { renderLiquidacionPdf } from "@/lib/club57/promociones/liquidaciones/renderPdf";

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

// El archivo NO pasa por Vercel (límite de ~4.5 MB por request): el
// navegador lo sube directo a Storage con esta URL firmada de un solo uso,
// y después llama a finalizePromoUpload (PDF) o finalizeLiquidacionUpload
// (Excel de Liquidaciones) para validarlo y registrarlo.
export async function createPromoUploadUrl(input: { tipo: string; fileSize: number }): Promise<CreatePromoUploadUrlResult> {
  const session = await requireAdmin();
  if (!session) return { error: "No autorizado." };
  if (!isPromoTipoHabilitado(input.tipo)) return { error: "Tipo de promoción no válido." };
  const esExcel = promoTipoInfo(input.tipo).formato === "excel";
  const maxBytes = esExcel ? LIQUIDACION_EXCEL_MAX_BYTES : PROMO_MAX_BYTES;
  if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) return { error: "El archivo está vacío." };
  if (input.fileSize > maxBytes) {
    return {
      error: `${esExcel ? "El Excel" : "El PDF"} pesa ${formatBytes(input.fileSize)}; el máximo permitido es ${formatBytes(maxBytes)}.`,
    };
  }

  const path = esExcel ? `${input.tipo}/excel/${randomUUID()}.xlsx` : `${input.tipo}/${randomUUID()}.pdf`;
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
  if (promoTipoInfo(tipo).formato !== "pdf") return { error: "Este tipo de promoción se carga con Excel." };

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

// ---------------------------------------------------------------------
// Liquidaciones del Mes: Excel (fuente de verdad) -> PDF de marca
// ---------------------------------------------------------------------

const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];

function liquidacionPdfNombre(rango: PromoRango | null): string {
  if (!rango) return "Liquidaciones del Mes - Ferreteria 57.pdf";
  return `Liquidaciones del Mes - ${formatRangoLegible(rango).replace(/^Del /, "del ").replace(/^El /, "el ")}.pdf`;
}

type GeneratedPdf = { path: string; nombre: string; bytes: number; sha256: string };

// Lee el Excel guardado, genera el PDF con la vigencia dada y lo sube al
// bucket privado. Quien llama decide qué hacer con el PDF anterior.
async function generateLiquidacionPdf(
  excelPath: string,
  rango: PromoRango | null
): Promise<{ error: string; detalles?: string[] } | { pdf: GeneratedPdf; productos: LiquidacionProducto[]; sinPiezas: number }> {
  const storage = createAdminClient().storage.from(PROMO_BUCKET);
  const { data: blob, error: downloadError } = await storage.download(excelPath);
  if (downloadError || !blob) return { error: "No se pudo leer el Excel de la liquidación. Intenta de nuevo." };

  const parsed = await parseLiquidacionExcel(new Uint8Array(await blob.arrayBuffer()));
  if (!parsed.ok) return { error: parsed.error, detalles: parsed.detalles };

  const pdfBytes = await renderLiquidacionPdf({ productos: parsed.productos, rango });
  const path = `liquidaciones/${randomUUID()}.pdf`;
  const { error: uploadError } = await storage.upload(path, pdfBytes, { contentType: "application/pdf", upsert: false });
  if (uploadError) return { error: "No se pudo guardar el PDF generado. Intenta de nuevo." };

  return {
    pdf: {
      path,
      nombre: liquidacionPdfNombre(rango),
      bytes: pdfBytes.byteLength,
      sha256: createHash("sha256").update(pdfBytes).digest("hex"),
    },
    productos: parsed.productos,
    sinPiezas: parsed.sinPiezas,
  };
}

export interface FinalizeLiquidacionResult {
  error?: string;
  detalles?: string[];
  promo?: NonNullable<FinalizePromoUploadResult["promo"]> & {
    fuente: { nombre: string; productos: number; sinPiezas: number; preview: LiquidacionProducto[] };
  };
}

export async function finalizeLiquidacionUpload(input: { path: string; originalName: string }): Promise<FinalizeLiquidacionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "No autorizado." };
  if (!/^liquidaciones\/excel\/[0-9a-f-]{36}\.xlsx$/.test(input.path)) return { error: "Ruta de archivo no válida." };

  const storage = createAdminClient().storage.from(PROMO_BUCKET);
  const reject = async (message: string, detalles?: string[]): Promise<FinalizeLiquidacionResult> => {
    await storage.remove([input.path]);
    return { error: message, detalles };
  };

  const { data: blob, error: downloadError } = await storage.download(input.path);
  if (downloadError || !blob) return { error: "No encontramos el archivo subido. Vuelve a intentarlo." };
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.byteLength > LIQUIDACION_EXCEL_MAX_BYTES) {
    return reject(`El Excel pesa ${formatBytes(bytes.byteLength)}; el máximo permitido es ${formatBytes(LIQUIDACION_EXCEL_MAX_BYTES)}.`);
  }
  // Un .xlsx es un ZIP: firma "PK\x03\x04". Nunca se confía en la extensión.
  if (!ZIP_SIGNATURE.every((byte, index) => bytes[index] === byte)) {
    return reject("El archivo no es un Excel .xlsx válido. Guárdalo como \"Libro de Excel (.xlsx)\" y vuelve a subirlo.");
  }

  const generated = await generateLiquidacionPdf(input.path, null);
  if ("error" in generated) return reject(generated.error, generated.detalles);

  const nombreExcel = input.originalName.trim().slice(0, 255) || "liquidacion.xlsx";
  const titulo = defaultTituloFromFilename(nombreExcel, `Liquidaciones ${todayInStoreTimezone()}`);
  const { data: inserted, error: insertError } = await session.supabase
    .from("club57_promociones")
    .insert({
      tipo: "liquidaciones",
      titulo,
      archivo_path: generated.pdf.path,
      archivo_nombre_original: generated.pdf.nombre,
      archivo_bytes: generated.pdf.bytes,
      archivo_sha256: generated.pdf.sha256,
      archivo_mime: "application/pdf",
      fuente_excel_path: input.path,
      fuente_excel_nombre: nombreExcel,
      fuente_productos: generated.productos.length,
      estado: "borrador",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    await storage.remove([generated.pdf.path]);
    return reject(translateDbError(insertError ?? { message: "sin respuesta" }, "No se pudo registrar la liquidación"));
  }

  revalidatePromociones();
  return {
    promo: {
      id: inserted.id,
      titulo,
      nombre: generated.pdf.nombre,
      bytes: generated.pdf.bytes,
      sha256: generated.pdf.sha256,
      fuente: {
        nombre: nombreExcel,
        productos: generated.productos.length,
        sinPiezas: generated.sinPiezas,
        preview: generated.productos,
      },
    },
  };
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

export async function setPromoVigencia(
  id: string,
  inicio: string,
  fin: string
): Promise<PromoActionResult & { archivo?: { nombre: string; bytes: number; sha256: string } }> {
  const session = await requireAdmin();
  if (!session) return { error: "No autorizado." };
  if (!UUID_PATTERN.test(id)) return { error: "Promoción no encontrada." };
  if (!isIsoDate(inicio) || !isIsoDate(fin)) return { error: "Elige una fecha de inicio y una de fin válidas." };
  if (fin < inicio) return { error: "La fecha de fin no puede ser anterior a la de inicio." };

  const { data: promo, error: fetchError } = await session.supabase
    .from("club57_promociones")
    .select("id, tipo, estado, vigencia_inicio, archivo_path, fuente_excel_path")
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

  // Liquidaciones: el PDF lleva la vigencia impresa, así que se vuelve a
  // generar desde el mismo Excel con las fechas nuevas.
  if (promo.tipo === "liquidaciones" && promo.fuente_excel_path) {
    const generated = await generateLiquidacionPdf(promo.fuente_excel_path as string, { inicio, fin });
    if ("error" in generated) return { error: generated.error };

    const storage = createAdminClient().storage.from(PROMO_BUCKET);
    const { error } = await session.supabase
      .from("club57_promociones")
      .update({
        vigencia_inicio: inicio,
        vigencia_fin: fin,
        archivo_path: generated.pdf.path,
        archivo_nombre_original: generated.pdf.nombre,
        archivo_bytes: generated.pdf.bytes,
        archivo_sha256: generated.pdf.sha256,
      })
      .eq("id", id);
    if (error) {
      await storage.remove([generated.pdf.path]);
      return { error: translateDbError(error, "No se pudieron guardar las fechas") };
    }
    await storage.remove([promo.archivo_path as string]);
    revalidatePromociones();
    return { archivo: { nombre: generated.pdf.nombre, bytes: generated.pdf.bytes, sha256: generated.pdf.sha256 } };
  }

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
    .select("id, estado, archivo_path, fuente_excel_path, archivo_eliminado_at")
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
    .remove([promo.archivo_path as string, promo.fuente_excel_path as string | null].filter((path): path is string => Boolean(path)));
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
    .select("archivo_path, fuente_excel_path");
  if (error) return { error: translateDbError(error, "No se pudo eliminar") };
  if (!data || data.length === 0) return { error: "Solo se pueden eliminar borradores." };

  const { error: removeError } = await createAdminClient()
    .storage.from(PROMO_BUCKET)
    .remove(
      data.flatMap((row) => [row.archivo_path as string, row.fuente_excel_path as string | null]).filter((path): path is string => Boolean(path))
    );
  if (removeError) console.error("[deletePromoDraft] no se pudo borrar el archivo:", removeError.message);

  revalidatePromociones();
  return {};
}
