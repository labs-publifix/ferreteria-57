"use server";

import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { detectBrandFromName } from "@/lib/catalog/detectBrandFromName";
import { resolveCategory, type CategoryOption } from "@/lib/catalog/resolveCategory";
import {
  createProductRecord,
  describeDbError,
  updateProductFromImportRow,
  type ProductWriteInput,
} from "@/lib/catalog/productWrite";
import { findTakenSkus } from "@/lib/catalog/skuAvailability";
import { normalizeText } from "@/lib/normalizeText";
import { slugify } from "@/lib/slugify";
import { createClient } from "@/lib/supabase/server";

// Mismo criterio que categorias/actions.ts y productos/actions.ts: cada
// Server Action confirma is_admin() por su cuenta.
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

export type ImportRowStatus = "ready" | "existing" | "error";

export interface ImportPreviewRow {
  rowNumber: number;
  categoriaRaw: string;
  categoryId: string | null;
  categoryLabel: string;
  codigo: string;
  nombre: string;
  precioRaw: string;
  marca: string;
  url: string;
  status: ImportRowStatus;
  reason?: string;
  existingProductId?: string;
}

export interface ParseImportResult {
  error?: string;
  rows?: ImportPreviewRow[];
}

// Las 5 columnas reales del archivo del cliente, identificadas por nombre
// de encabezado normalizado (sin acentos/espacios/mayúsculas) — el archivo
// real trae "Categoria " con espacio de más, por eso se compara ya
// normalizado en vez de por texto exacto o por posición fija de columna.
const COLUMNS = ["categoria", "codigo", "nombre", "precio", "url"] as const;
type ColumnKey = (typeof COLUMNS)[number];

// Una celda de ExcelJS puede traer un string/número plano, pero también un
// objeto de fórmula ({ result }) o de hipervínculo ({ text, hyperlink }) —
// esto cubre ambos casos además del caso simple.
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
    // exceljs trae su propio .d.ts con un `declare interface Buffer extends
    // ArrayBuffer {}` ambiental que choca con el Buffer real de Node
    // (@types/node) — en tiempo de ejecución es el mismo Buffer de Node de
    // siempre, el cast solo evita el falso conflicto de tipos.
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  }
  return workbook;
}

export async function parseAndValidateImportFile(formData: FormData): Promise<ParseImportResult> {
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

  // Mapa "columna canónica" -> índice de columna, encontrado por
  // encabezado normalizado en vez de posición fija.
  const columnIndex = new Map<ColumnKey, number>();
  const headerRow = sheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const normalized = normalizeText(cellToString(cell.value));
    if ((COLUMNS as readonly string[]).includes(normalized)) {
      columnIndex.set(normalized as ColumnKey, colNumber);
    }
  });

  const missingColumns = COLUMNS.filter((key) => !columnIndex.has(key));
  if (missingColumns.length > 0) {
    return {
      error: `El archivo no tiene las columnas esperadas: ${missingColumns.join(", ")}. Se requieren Categoria, Codigo, Nombre, Precio y URL.`,
    };
  }

  interface RawRow {
    rowNumber: number;
    categoria: string;
    codigo: string;
    nombre: string;
    precioRaw: string;
    url: string;
  }

  const rawRows: RawRow[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const categoria = cellToString(row.getCell(columnIndex.get("categoria")!).value).trim();
    const codigo = cellToString(row.getCell(columnIndex.get("codigo")!).value).trim();
    const nombre = cellToString(row.getCell(columnIndex.get("nombre")!).value).trim();
    const precioRaw = cellToString(row.getCell(columnIndex.get("precio")!).value).trim();
    const url = cellToString(row.getCell(columnIndex.get("url")!).value).trim();

    // Filas completamente vacías (rastro de filas en blanco al final del
    // archivo) se ignoran del todo — no son un error del usuario, no
    // deberían ni aparecer en la vista previa.
    if (!categoria && !codigo && !nombre && !precioRaw && !url) continue;

    rawRows.push({ rowNumber, categoria, codigo, nombre, precioRaw, url });
  }

  if (rawRows.length === 0) {
    return { error: "El archivo no tiene filas de datos." };
  }

  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, slug");
  if (categoriesError) return { error: `No se pudieron cargar las categorías: ${categoriesError.message}` };
  const categories: CategoryOption[] = categoriesData ?? [];

  const codigos = rawRows.map((row) => row.codigo).filter(Boolean);
  const takenSkus = await findTakenSkus(supabase, codigos);

  const seenInFile = new Set<string>();
  const rows: ImportPreviewRow[] = rawRows.map((raw) => {
    const category = resolveCategory(categories, raw.categoria);
    const precioNumber = raw.precioRaw ? Number.parseFloat(raw.precioRaw.replace(",", ".")) : NaN;
    const marca = raw.nombre ? detectBrandFromName(raw.nombre) : "";

    const base: ImportPreviewRow = {
      rowNumber: raw.rowNumber,
      categoriaRaw: raw.categoria,
      categoryId: category?.id ?? null,
      categoryLabel: category?.name ?? raw.categoria,
      codigo: raw.codigo,
      nombre: raw.nombre,
      precioRaw: raw.precioRaw,
      marca,
      url: raw.url,
      status: "ready",
    };

    if (!raw.codigo) return { ...base, status: "error", reason: "Falta el código." };
    if (!raw.nombre) return { ...base, status: "error", reason: "Falta el nombre." };
    if (!raw.precioRaw || Number.isNaN(precioNumber) || precioNumber < 0) {
      return { ...base, status: "error", reason: "El precio no es válido." };
    }
    if (!category) {
      return { ...base, status: "error", reason: `Categoría no encontrada: "${raw.categoria}".` };
    }
    if (seenInFile.has(raw.codigo)) {
      return { ...base, status: "error", reason: "Código duplicado dentro del archivo." };
    }
    seenInFile.add(raw.codigo);

    const existingProductId = takenSkus.get(raw.codigo);
    if (existingProductId) {
      return {
        ...base,
        status: "existing",
        reason: "Ya existe un producto con este código.",
        existingProductId,
      };
    }

    return base;
  });

  return { rows };
}

export interface ImportCommitRow {
  rowNumber: number;
  categoriaRaw: string;
  codigo: string;
  nombre: string;
  precioRaw: string;
  marca: string;
  url: string;
  status: ImportRowStatus;
  existingProductId?: string;
  /** Solo relevante si status === "existing": el usuario decidió actualizar. */
  updateExisting: boolean;
}

export interface ImportCommitSummary {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  failedDetails: { rowNumber: number; reason: string }[];
}

export interface CommitImportResult {
  error?: string;
  summary?: ImportCommitSummary;
}

// Todo lo que llega aquí se vuelve a validar contra el estado real de la
// base — nunca se confía en el status que trae el cliente (pudo quedar
// desactualizado si algo cambió entre la vista previa y este momento, o
// simplemente el cliente pudo manipular el payload).
export async function commitImportRows(rows: ImportCommitRow[]): Promise<CommitImportResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  if (rows.length === 0) return { error: "No hay filas para importar." };

  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, slug");
  if (categoriesError) return { error: `No se pudieron cargar las categorías: ${categoriesError.message}` };
  const categories: CategoryOption[] = categoriesData ?? [];

  const codigos = rows.map((row) => row.codigo).filter(Boolean);
  const takenSkus = await findTakenSkus(supabase, codigos);
  const existingSlugsResult = await supabase.from("products").select("slug");
  const usedSlugs = new Set((existingSlugsResult.data ?? []).map((row) => row.slug));

  const summary: ImportCommitSummary = { created: 0, updated: 0, skipped: 0, failed: 0, failedDetails: [] };
  const seenInBatch = new Set<string>();

  for (const row of rows) {
    const category = resolveCategory(categories, row.categoriaRaw);
    const precioNumber = Number.parseFloat(row.precioRaw.replace(",", "."));
    const marca = row.marca.trim() || detectBrandFromName(row.nombre);

    function fail(reason: string) {
      summary.failed += 1;
      summary.failedDetails.push({ rowNumber: row.rowNumber, reason });
    }

    if (!row.codigo || !row.nombre || !row.precioRaw || Number.isNaN(precioNumber) || precioNumber < 0) {
      fail("Faltan datos obligatorios o el precio no es válido.");
      continue;
    }
    if (!category) {
      fail(`Categoría no encontrada: "${row.categoriaRaw}".`);
      continue;
    }
    if (seenInBatch.has(row.codigo)) {
      fail("Código duplicado dentro del archivo.");
      continue;
    }
    seenInBatch.add(row.codigo);

    const takenBy = takenSkus.get(row.codigo);

    if (takenBy && !row.updateExisting) {
      // Existe y el usuario no pidió actualizarlo: se omite a propósito,
      // no es un error.
      summary.skipped += 1;
      continue;
    }

    if (takenBy && row.updateExisting) {
      const result = await updateProductFromImportRow(supabase, takenBy, {
        categoryId: category.id,
        name: row.nombre,
        brand: marca,
        specSheetUrl: row.url || null,
        price: precioNumber,
        sku: row.codigo,
      });
      if (result.error) {
        fail(result.error);
      } else {
        summary.updated += 1;
      }
      continue;
    }

    let slug = slugify(row.nombre);
    if (!slug) slug = row.codigo;
    if (usedSlugs.has(slug)) slug = `${slug}-${row.codigo}`;
    usedSlugs.add(slug);

    const input: ProductWriteInput = {
      categoryId: category.id,
      name: row.nombre,
      slug,
      brand: marca,
      // Este importador (modo creación) no trae columna Clave — ver
      // parseAndValidateUpdateFile/commitUpdateRows más abajo para el modo
      // que sí la puebla, por Código, sobre productos ya existentes.
      clave: null,
      shortDescription: "",
      specSheetUrl: row.url || null,
      technicalSpecs: [],
      images: [],
      active: false,
      variants: [{ sku: row.codigo, label: "Único", price: precioNumber, compareAtPrice: null, stock: 0 }],
    };

    const result = await createProductRecord(supabase, input);
    if (result.error) {
      fail(result.error);
    } else {
      summary.created += 1;
    }
  }

  return { summary };
}

// ---------------------------------------------------------------------------
// Modo actualización: un segundo Excel (Categoria, Clave, Codigo, Nombre,
// Precio, URL) donde solo importan Codigo (para encontrar el producto) y
// Clave (el único campo que se escribe). Categoria/Nombre/Precio/URL del
// archivo se ignoran por completo — ni siquiera se leen — a propósito: este
// modo nunca debe poder tocar nada más que `clave`, sin importar qué diga
// el resto de esas columnas.
// ---------------------------------------------------------------------------

const UPDATE_COLUMNS = ["codigo", "clave"] as const;
type UpdateColumnKey = (typeof UPDATE_COLUMNS)[number];

export type UpdateRowStatus = "ready" | "unchanged" | "error";

export interface ImportUpdatePreviewRow {
  rowNumber: number;
  codigo: string;
  claveRaw: string;
  productId: string | null;
  // Nombre real ya guardado en la base para el producto que hizo match —
  // no el de ninguna columna del Excel — así el admin verifica a simple
  // vista que el Código encontró el producto correcto antes de confirmar.
  productName: string | null;
  claveActual: string | null;
  status: UpdateRowStatus;
  reason?: string;
}

export interface ParseUpdateImportResult {
  error?: string;
  rows?: ImportUpdatePreviewRow[];
}

export async function parseAndValidateUpdateFile(formData: FormData): Promise<ParseUpdateImportResult> {
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

  const columnIndex = new Map<UpdateColumnKey, number>();
  const headerRow = sheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const normalized = normalizeText(cellToString(cell.value));
    if ((UPDATE_COLUMNS as readonly string[]).includes(normalized)) {
      columnIndex.set(normalized as UpdateColumnKey, colNumber);
    }
  });

  const missingColumns = UPDATE_COLUMNS.filter((key) => !columnIndex.has(key));
  if (missingColumns.length > 0) {
    return {
      error: `El archivo no tiene las columnas esperadas: ${missingColumns.join(", ")}. Se requieren Codigo y Clave.`,
    };
  }

  interface RawUpdateRow {
    rowNumber: number;
    codigo: string;
    claveRaw: string;
  }

  const rawRows: RawUpdateRow[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const codigo = cellToString(row.getCell(columnIndex.get("codigo")!).value).trim();
    const claveRaw = cellToString(row.getCell(columnIndex.get("clave")!).value).trim();

    // Fila completamente vacía (rastro de filas en blanco al final del
    // archivo): se ignora del todo, igual que en el modo de creación.
    if (!codigo && !claveRaw) continue;

    rawRows.push({ rowNumber, codigo, claveRaw });
  }

  if (rawRows.length === 0) {
    return { error: "El archivo no tiene filas de datos." };
  }

  const codigos = rawRows.map((row) => row.codigo).filter(Boolean);
  const takenSkus = await findTakenSkus(supabase, codigos);

  const productIds = [...new Set([...takenSkus.values()])];
  const productInfo = new Map<string, { name: string; clave: string | null }>();
  if (productIds.length > 0) {
    const { data, error } = await supabase.from("products").select("id, name, clave").in("id", productIds);
    if (error) return { error: `No se pudieron cargar los productos: ${error.message}` };
    for (const product of data ?? []) {
      productInfo.set(product.id, { name: product.name, clave: product.clave });
    }
  }

  const rows: ImportUpdatePreviewRow[] = rawRows.map((raw) => {
    if (!raw.codigo) {
      return {
        rowNumber: raw.rowNumber,
        codigo: raw.codigo,
        claveRaw: raw.claveRaw,
        productId: null,
        productName: null,
        claveActual: null,
        status: "error",
        reason: "Falta el código.",
      };
    }

    const productId = takenSkus.get(raw.codigo) ?? null;
    if (!productId) {
      return {
        rowNumber: raw.rowNumber,
        codigo: raw.codigo,
        claveRaw: raw.claveRaw,
        productId: null,
        productName: null,
        claveActual: null,
        status: "error",
        reason: "Código no encontrado, no se actualizó.",
      };
    }

    const info = productInfo.get(productId);
    const claveActual = info?.clave ?? null;
    const claveNueva = raw.claveRaw || null;
    const unchanged = claveActual === claveNueva;

    return {
      rowNumber: raw.rowNumber,
      codigo: raw.codigo,
      claveRaw: raw.claveRaw,
      productId,
      productName: info?.name ?? null,
      claveActual,
      status: unchanged ? "unchanged" : "ready",
      reason: unchanged ? "La clave ya tiene este valor." : undefined,
    };
  });

  return { rows };
}

export interface ImportUpdateCommitRow {
  rowNumber: number;
  codigo: string;
  claveRaw: string;
  status: UpdateRowStatus;
}

export interface ImportUpdateCommitSummary {
  updated: number;
  unchanged: number;
  failed: number;
  failedDetails: { rowNumber: number; reason: string }[];
}

export interface CommitUpdateResult {
  error?: string;
  summary?: ImportUpdateCommitSummary;
}

// Igual criterio que commitImportRows: nunca se confía en el productId que
// mandó la vista previa — Código se vuelve a resolver contra el estado real
// de la base justo antes de escribir, y el único campo que este camino
// puede tocar es `clave`.
export async function commitUpdateRows(rows: ImportUpdateCommitRow[]): Promise<CommitUpdateResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };
  if (rows.length === 0) return { error: "No hay filas para actualizar." };

  const codigos = rows.map((row) => row.codigo).filter(Boolean);
  const takenSkus = await findTakenSkus(supabase, codigos);

  const summary: ImportUpdateCommitSummary = { updated: 0, unchanged: 0, failed: 0, failedDetails: [] };

  for (const row of rows) {
    function fail(reason: string) {
      summary.failed += 1;
      summary.failedDetails.push({ rowNumber: row.rowNumber, reason });
    }

    if (!row.codigo) {
      fail("Falta el código.");
      continue;
    }

    const productId = takenSkus.get(row.codigo);
    if (!productId) {
      fail("Código no encontrado, no se actualizó.");
      continue;
    }

    if (row.status === "unchanged") {
      summary.unchanged += 1;
      continue;
    }

    const { error } = await supabase
      .from("products")
      .update({ clave: row.claveRaw || null, updated_at: new Date().toISOString() })
      .eq("id", productId);
    if (error) {
      fail(describeDbError("No se pudo actualizar la clave", error));
      continue;
    }
    summary.updated += 1;
  }

  return { summary };
}
