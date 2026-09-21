"use server";

import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { normalizeText } from "@/lib/normalizeText";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return null;

  return supabase;
}

const COLUMNS = ["codigos", "clave", "descripcion", "costos"] as const;
type ColumnKey = (typeof COLUMNS)[number];

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("result" in value && value.result !== null && value.result !== undefined) {
      return String(value.result);
    }
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    return "";
  }
  return String(value);
}

async function loadWorkbook(file: File): Promise<ExcelJS.Workbook> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  const isCsv = file.name.toLowerCase().endsWith(".csv");
  if (isCsv) {
    await workbook.csv.read(Readable.from(buffer));
  } else {
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  }
  return workbook;
}

// A diferencia del importador de productos (encabezado siempre en la fila
// 1), el archivo real de este catálogo trae una fila 1 vacía y el
// encabezado en la fila 2 — se busca entre las primeras filas en vez de
// asumir una posición fija, así cualquiera de los dos formatos funciona.
function findHeaderRow(sheet: ExcelJS.Worksheet, maxRowsToScan = 5): { rowNumber: number; columnIndex: Map<ColumnKey, number> } | null {
  for (let rowNumber = 1; rowNumber <= Math.min(maxRowsToScan, sheet.rowCount); rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const columnIndex = new Map<ColumnKey, number>();
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const normalized = normalizeText(cellToString(cell.value));
      if ((COLUMNS as readonly string[]).includes(normalized)) {
        columnIndex.set(normalized as ColumnKey, colNumber);
      }
    });
    if (COLUMNS.every((key) => columnIndex.has(key))) {
      return { rowNumber, columnIndex };
    }
  }
  return null;
}

export type CatalogImportRowStatus = "ready" | "error";

export interface CatalogImportPreviewRow {
  rowNumber: number;
  codigo: string;
  clave: string;
  descripcion: string;
  costoRaw: string;
  puntosCalculados: number | null;
  status: CatalogImportRowStatus;
  reason?: string;
}

export interface ParseCatalogImportResult {
  error?: string;
  rows?: CatalogImportPreviewRow[];
}

export async function parseAndValidateCatalogImportFile(formData: FormData): Promise<ParseCatalogImportResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elige un archivo .xlsx o .csv para continuar." };
  }
  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".csv")) {
    return { error: "El archivo debe ser .xlsx o .csv." };
  }

  let sheet: ExcelJS.Worksheet | undefined;
  try {
    const workbook = await loadWorkbook(file);
    sheet = workbook.worksheets[0];
  } catch {
    return { error: "No se pudo leer el archivo. Verifica que no esté dañado." };
  }
  if (!sheet || sheet.rowCount < 2) {
    return { error: "El archivo no tiene filas de datos." };
  }

  const header = findHeaderRow(sheet);
  if (!header) {
    return {
      error: "El archivo no tiene las columnas esperadas: Codigos, Clave, Descripcion, Costos.",
    };
  }

  // Puntos = Costo ÷ (tasa_canje_pct/100 × monto_por_punto), con los
  // valores VIGENTES de club57_config en este momento — no se recalculan
  // después si la configuración cambia; el admin puede ajustar cada fila
  // a mano si hace falta.
  const { data: config, error: configError } = await supabase
    .from("club57_config")
    .select("monto_por_punto, tasa_canje_pct")
    .maybeSingle();
  if (configError || !config) {
    return { error: `No se pudo leer la configuración de Club 57: ${configError?.message ?? "sin datos"}` };
  }
  const divisor = (Number(config.tasa_canje_pct) / 100) * Number(config.monto_por_punto);

  const rows: CatalogImportPreviewRow[] = [];
  for (let rowNumber = header.rowNumber + 1; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const codigo = cellToString(row.getCell(header.columnIndex.get("codigos")!).value).trim();
    const clave = cellToString(row.getCell(header.columnIndex.get("clave")!).value).trim();
    const descripcion = cellToString(row.getCell(header.columnIndex.get("descripcion")!).value).trim();
    const costoRaw = cellToString(row.getCell(header.columnIndex.get("costos")!).value).trim();

    if (!codigo && !clave && !descripcion && !costoRaw) continue;

    const base: CatalogImportPreviewRow = {
      rowNumber,
      codigo,
      clave,
      descripcion,
      costoRaw,
      puntosCalculados: null,
      status: "ready",
    };

    if (!descripcion) {
      rows.push({ ...base, status: "error", reason: "Falta la descripción." });
      continue;
    }
    const costoNumber = costoRaw ? Number.parseFloat(costoRaw.replace(",", ".")) : NaN;
    if (!costoRaw || Number.isNaN(costoNumber) || costoNumber <= 0) {
      rows.push({ ...base, status: "error", reason: "El costo no es válido." });
      continue;
    }

    const puntos = Math.round(costoNumber / divisor);
    if (puntos <= 0) {
      rows.push({ ...base, status: "error", reason: "El cálculo de puntos da 0 — revisa el costo." });
      continue;
    }

    rows.push({ ...base, puntosCalculados: puntos });
  }

  if (rows.length === 0) {
    return { error: "El archivo no tiene filas de datos." };
  }

  return { rows };
}

export interface CatalogImportCommitRow {
  rowNumber: number;
  codigo: string;
  clave: string;
  descripcion: string;
  puntos: number;
  status: CatalogImportRowStatus;
}

export interface CatalogImportCommitSummary {
  created: number;
  failed: number;
  failedDetails: { rowNumber: number; reason: string }[];
}

export interface CommitCatalogImportResult {
  error?: string;
  summary?: CatalogImportCommitSummary;
}

// Vuelve a validar todo server-side — nunca confía en el status/valores
// que trae el cliente, mismo criterio que el resto de los importadores.
export async function commitCatalogImportRows(rows: CatalogImportCommitRow[]): Promise<CommitCatalogImportResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };
  if (rows.length === 0) return { error: "No hay filas para importar." };

  const summary: CatalogImportCommitSummary = { created: 0, failed: 0, failedDetails: [] };

  for (const row of rows) {
    if (row.status !== "ready") {
      summary.failed += 1;
      summary.failedDetails.push({ rowNumber: row.rowNumber, reason: "Fila con error, no se importó." });
      continue;
    }
    if (!row.descripcion || !Number.isFinite(row.puntos) || row.puntos <= 0) {
      summary.failed += 1;
      summary.failedDetails.push({ rowNumber: row.rowNumber, reason: "Datos inválidos." });
      continue;
    }

    // Nace inactivo y sin imagen real (mismo criterio que productos): el
    // admin sube la foto y activa cada artículo después, uno por uno.
    const { error } = await supabase.from("club57_redemption_catalog").insert({
      nombre: row.descripcion,
      descripcion: row.descripcion,
      clave: row.clave || null,
      // Código numérico de Truper (ej. 68069) — se usa para localizar la
      // imagen del artículo en el catálogo del fabricante, nunca se
      // muestra al cliente.
      codigo: row.codigo || null,
      costo_puntos: row.puntos,
      stock: 0,
      image_url: null,
      active: false,
    });

    if (error) {
      summary.failed += 1;
      summary.failedDetails.push({ rowNumber: row.rowNumber, reason: error.message });
    } else {
      summary.created += 1;
    }
  }

  return { summary };
}
