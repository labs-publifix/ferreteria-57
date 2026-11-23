"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { Readable } from "node:stream";
import { describeDbError, getStoreList, saveVariantLevels } from "@/lib/catalog/productWrite";
import {
  firstOf,
  levelsFromRow,
  parseMoney,
  type PriceLevels,
  type PriceLevelsRow,
  type PriceList,
} from "@/lib/catalog/priceLevels";
import {
  analyzePriceImport,
  type CurrentVariantPrices,
  type PriceImportPreviewRow,
  type PriceImportRawRow,
  type PriceImportResultRow,
  type PriceImportSummary,
} from "@/lib/catalog/priceImport";
import { PRICE_UPDATE_COLUMNS } from "@/lib/importTemplates/columnDefs";
import { normalizeText } from "@/lib/normalizeText";
import { requireStaff } from "@/lib/supabase/requireStaff";

// «Actualizar precios»: Excel con Código y Precio 1–4 (el formato de la
// exportación de productos y el archivo de listas de Truper). Solo escribe
// las 4 listas de cada presentación; nombre, stock, estado, categoría y
// destacado no se tocan aunque el archivo traiga esas columnas. Admin y
// operador, igual que el resto del importador.

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof requireStaff>>>["supabase"];

async function requireCatalogStaff() {
  const staff = await requireStaff();
  return staff && staff.role === "admin" ? staff : null;
}

function headerKey(value: string): string {
  return normalizeText(value).replace(/\s+/g, " ");
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("result" in value && value.result !== null && value.result !== undefined) return String(value.result);
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((part) => part.text).join("");
    return "";
  }
  return String(value);
}

const SKU_BATCH = 200;

/** Precio de tienda y listas vigentes de cada código pedido. */
async function loadCurrentPrices(
  supabase: SupabaseClient,
  skus: string[]
): Promise<Map<string, CurrentVariantPrices> | { error: string }> {
  const bySku = new Map<string, CurrentVariantPrices>();
  const unique = [...new Set(skus.filter(Boolean))];
  for (let i = 0; i < unique.length; i += SKU_BATCH) {
    const { data, error } = await supabase
      .from("product_variants")
      .select("id, sku, label, price, products(name), product_price_levels(precio_1, precio_2, precio_3, precio_4)")
      .in("sku", unique.slice(i, i + SKU_BATCH));
    if (error) return { error: describeDbError("No se pudieron leer los precios actuales", error) };
    for (const row of data ?? []) {
      const product = firstOf(row.products as { name: string } | { name: string }[] | null);
      const label = (row.label ?? "").trim();
      const name = product?.name ?? "";
      bySku.set(row.sku, {
        variantId: row.id,
        sku: row.sku,
        productName: label && label.toLowerCase() !== "único" ? `${name} — ${label}` : name,
        storePrice: Number(row.price),
        levels: levelsFromRow(
          firstOf(row.product_price_levels as PriceLevelsRow | PriceLevelsRow[] | null),
          Number(row.price)
        ),
      });
    }
  }
  return bySku;
}

export interface ParsePriceImportResult {
  error?: string;
  rows?: PriceImportPreviewRow[];
  summary?: PriceImportSummary;
  storeList?: PriceList;
  /** Presentaciones de la tienda que el archivo no menciona (no se tocan). */
  notInFile?: number;
}

export async function parsePriceUpdateFile(formData: FormData): Promise<ParsePriceImportResult> {
  const staff = await requireCatalogStaff();
  if (!staff) return { error: "No autorizado." };
  const { supabase } = staff;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Elige un archivo .xlsx o .csv para continuar." };
  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".csv")) return { error: "El archivo debe ser .xlsx o .csv." };

  let sheet: ExcelJS.Worksheet | undefined;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    if (lowerName.endsWith(".csv")) await workbook.csv.read(Readable.from(buffer));
    // Ver la nota sobre el tipo Buffer de exceljs en importar/actions.ts.
    else await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    // La hoja que traiga las columnas de precios (el archivo de Truper puede
    // traer hojas de apoyo para las fórmulas); si ninguna, la primera.
    sheet =
      workbook.worksheets.find((ws) => {
        const keys: string[] = [];
        ws.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
          keys.push(headerKey(cellText(cell.value)));
        });
        return keys.includes("codigo") && keys.includes("precio 1");
      }) ?? workbook.worksheets[0];
  } catch {
    return { error: "No se pudo leer el archivo. Verifica que no esté dañado." };
  }
  if (!sheet || sheet.rowCount < 2) return { error: "El archivo no tiene filas de datos." };

  const wanted = ["codigo", "precio 1", "precio 2", "precio 3", "precio 4"] as const;
  const columnIndex = new Map<string, number>();
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = headerKey(cellText(cell.value));
    if ((wanted as readonly string[]).includes(key) && !columnIndex.has(key)) columnIndex.set(key, colNumber);
  });
  const missing = wanted.filter((key) => !columnIndex.has(key));
  if (missing.length > 0) {
    const headers = PRICE_UPDATE_COLUMNS.filter((c) => (missing as readonly string[]).includes(c.key)).map((c) => c.header);
    return {
      error: `Al archivo le faltan columnas: ${headers.join(", ")}. Se requieren Código, Precio 1, Precio 2, Precio 3 y Precio 4.`,
    };
  }

  const rawRows: PriceImportRawRow[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const codigo = cellText(row.getCell(columnIndex.get("codigo")!).value).trim();
    const precios = (["precio 1", "precio 2", "precio 3", "precio 4"] as const).map(
      (key) => row.getCell(columnIndex.get(key)!).value as unknown
    ) as PriceImportRawRow["precios"];
    const empty = (v: unknown) => v === null || v === undefined || (typeof v === "string" && !v.trim());
    if (!codigo && precios.every(empty)) continue;
    rawRows.push({ rowNumber, codigo, precios });
  }
  if (rawRows.length === 0) return { error: "El archivo no tiene filas de datos." };

  const [current, storeList, countResult] = await Promise.all([
    loadCurrentPrices(supabase, rawRows.map((row) => row.codigo)),
    getStoreList(supabase),
    supabase.from("product_variants").select("id", { count: "exact", head: true }),
  ]);
  if ("error" in current) return { error: current.error as string };

  const { rows, summary } = analyzePriceImport(rawRows, current, storeList);
  const matched = new Set(rows.filter((row) => row.status !== "error").map((row) => row.codigo)).size;
  const notInFile = countResult.count != null ? Math.max(0, countResult.count - matched) : undefined;

  return { rows, summary, storeList, notInFile };
}

export interface PriceCommitRow {
  rowNumber: number;
  codigo: string;
  precios: number[];
}

export interface CommitPriceImportResult {
  error?: string;
  results?: PriceImportResultRow[];
  updated?: number;
  unchanged?: number;
  failed?: number;
  /** Presentaciones cuyo precio de tienda cambió. */
  storePriceChanged?: number;
}

// Nunca se confía en lo que manda la vista previa: cada código se vuelve a
// buscar y cada precio se vuelve a validar. Todas las listas se guardan en
// una sola operación: o se guardan todas o ninguna.
export async function commitPriceUpdate(rows: PriceCommitRow[]): Promise<CommitPriceImportResult> {
  const staff = await requireCatalogStaff();
  if (!staff) return { error: "No autorizado." };
  const { supabase } = staff;
  if (rows.length === 0) return { error: "No hay precios para actualizar." };

  const [current, storeList] = await Promise.all([
    loadCurrentPrices(supabase, rows.map((row) => row.codigo)),
    getStoreList(supabase),
  ]);
  if ("error" in current) return { error: current.error as string };

  const results: PriceImportResultRow[] = [];
  const toSave: { variantId: string; levels: PriceLevels; rowNumber: number; storeChanged: boolean }[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const variant = current.get(row.codigo);
    const values = (Array.isArray(row.precios) ? row.precios : []).slice(0, 4).map((v) => parseMoney(v));
    if (!variant) {
      results.push({ rowNumber: row.rowNumber, outcome: "failed", detail: "El código ya no existe en la tienda." });
      continue;
    }
    if (seen.has(row.codigo)) {
      results.push({ rowNumber: row.rowNumber, outcome: "failed", detail: "Código repetido en el archivo." });
      continue;
    }
    seen.add(row.codigo);
    if (values.length !== 4 || values.some((v) => v === null || !(v > 0))) {
      results.push({ rowNumber: row.rowNumber, outcome: "failed", detail: "Algún precio no es válido." });
      continue;
    }
    const levels = values as PriceLevels;
    if (levels.every((v, i) => Math.abs(v - variant.levels[i]) < 0.005)) {
      results.push({ rowNumber: row.rowNumber, outcome: "unchanged", detail: "Ya tenía estos precios." });
      continue;
    }
    toSave.push({
      variantId: variant.variantId,
      levels,
      rowNumber: row.rowNumber,
      storeChanged: Math.abs(levels[storeList - 1] - variant.storePrice) >= 0.005,
    });
  }

  if (toSave.length > 0) {
    const saved = await saveVariantLevels(supabase, toSave);
    if (saved.error) return { error: `${saved.error}. No se guardó ningún precio; intenta de nuevo.` };
    for (const row of toSave) {
      results.push({ rowNumber: row.rowNumber, outcome: "updated", detail: "Precios actualizados." });
    }
    revalidatePath("/", "layout");
  }

  return {
    results,
    updated: toSave.length,
    unchanged: results.filter((r) => r.outcome === "unchanged").length,
    failed: results.filter((r) => r.outcome === "failed").length,
    storePriceChanged: toSave.filter((row) => row.storeChanged).length,
  };
}
