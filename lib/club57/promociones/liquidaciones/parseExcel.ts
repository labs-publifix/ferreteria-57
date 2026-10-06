import ExcelJS from "exceljs";
import { findExampleColumnIndex, isExampleMarkerRow } from "@/lib/importTemplates/buildTemplate";
import { LIQUIDACIONES_COLUMNS } from "@/lib/importTemplates/columnDefs";
import { normalizeText } from "@/lib/normalizeText";

// Lee el Excel de Liquidaciones del Mes — la fuente de verdad del PDF. Se
// imprime tal cual: mismo orden de filas, descripciones sin corregir (solo
// se limpian espacios sobrantes) y TODAS las filas, incluidas las de 0
// piezas (el asistente solo avisa cuántas hay).

export interface LiquidacionProducto {
  codigo: string;
  descripcion: string;
  piezas: number;
  /** Precio con impuestos (columna "Costo con impuesto"). */
  precio: number;
}

export type ParseLiquidacionResult =
  | { ok: true; productos: LiquidacionProducto[]; sinPiezas: number }
  | { ok: false; error: string; detalles?: string[] };

const MAX_PRODUCTOS = 1000;
const MAX_DETALLES = 12;

type ColumnKey = (typeof LIQUIDACIONES_COLUMNS)[number]["key"];
const REQUIRED_KEYS = LIQUIDACIONES_COLUMNS.filter((column) => column.required).map((column) => column.key);
const ALL_KEYS = LIQUIDACIONES_COLUMNS.map((column) => column.key) as readonly string[];

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if (value instanceof Date) return value.toISOString();
    if ("result" in value && value.result !== null && value.result !== undefined) return String(value.result);
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((part) => part.text).join("");
    return "";
  }
  return String(value);
}

function cellToNumber(value: ExcelJS.CellValue): number | null {
  const raw =
    typeof value === "number"
      ? value
      : value && typeof value === "object" && "result" in value && typeof value.result === "number"
        ? value.result
        : null;
  if (raw !== null) return Number.isFinite(raw) ? raw : null;
  const text = cellToString(value).replace(/[$\s,]/g, "");
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function findHeader(sheet: ExcelJS.Worksheet) {
  for (let rowNumber = 1; rowNumber <= Math.min(5, sheet.rowCount); rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const columnIndex = new Map<ColumnKey, number>();
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const normalized = normalizeText(cellToString(cell.value)).replace(/\s+/g, " ");
      if (ALL_KEYS.includes(normalized)) columnIndex.set(normalized as ColumnKey, colNumber);
    });
    if (REQUIRED_KEYS.every((key) => columnIndex.has(key))) {
      return { rowNumber, columnIndex, exampleColumnIndex: findExampleColumnIndex(row, normalizeText, cellToString) };
    }
  }
  return null;
}

export async function parseLiquidacionExcel(bytes: Uint8Array): Promise<ParseLiquidacionResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(Buffer.from(bytes) as unknown as ArrayBuffer);
  } catch {
    return { ok: false, error: "No se pudo leer el archivo. Verifica que sea un Excel .xlsx válido." };
  }

  let sheet: ExcelJS.Worksheet | undefined;
  let header: ReturnType<typeof findHeader> = null;
  for (const candidate of workbook.worksheets) {
    if (candidate.state !== "visible") continue;
    header = findHeader(candidate);
    if (header) {
      sheet = candidate;
      break;
    }
  }
  if (!sheet || !header) {
    return {
      ok: false,
      error: "No encontramos los encabezados del formato de Liquidaciones.",
      detalles: [
        `La primera fila debe traer: ${LIQUIDACIONES_COLUMNS.map((column) => column.header).join(", ")}.`,
        "Descarga la plantilla para ver el formato exacto.",
      ],
    };
  }

  const col = (key: ColumnKey) => header!.columnIndex.get(key)!;
  const productos: LiquidacionProducto[] = [];
  const errores: string[] = [];

  for (let rowNumber = header.rowNumber + 1; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    if (isExampleMarkerRow(row, header.exampleColumnIndex)) continue;

    const codigoValue = row.getCell(col("codigos")).value;
    const codigo =
      typeof codigoValue === "number" ? String(codigoValue) : cellToString(codigoValue).replace(/\s+/g, " ").trim();
    const descripcion = cellToString(row.getCell(col("descripcion")).value).replace(/\s+/g, " ").trim();
    const cantidadValue = row.getCell(col("cantidad")).value;
    const precioValue = row.getCell(col("costo con impuesto")).value;

    const vacia = !codigo && !descripcion && cellToString(cantidadValue).trim() === "" && cellToString(precioValue).trim() === "";
    if (vacia) continue;

    const problemas: string[] = [];
    if (!codigo) problemas.push("falta el código");
    if (!descripcion) problemas.push("falta la descripción");
    const piezas = cellToNumber(cantidadValue);
    if (piezas === null || !Number.isInteger(piezas) || piezas < 0) problemas.push("la cantidad debe ser un número entero de 0 o más");
    const precio = cellToNumber(precioValue);
    if (precio === null || precio <= 0) problemas.push("el costo con impuesto debe ser un número mayor a 0");

    if (problemas.length > 0) {
      errores.push(`Fila ${rowNumber}${codigo ? ` (${codigo})` : ""}: ${problemas.join(", ")}.`);
      continue;
    }
    productos.push({ codigo, descripcion, piezas: piezas!, precio: Math.round(precio! * 100) / 100 });
  }

  if (errores.length > 0) {
    const extra = errores.length > MAX_DETALLES ? [`…y ${errores.length - MAX_DETALLES} filas más con errores.`] : [];
    return {
      ok: false,
      error: `El Excel tiene ${errores.length} ${errores.length === 1 ? "fila con error" : "filas con error"}. Corrígelas y vuelve a subirlo.`,
      detalles: [...errores.slice(0, MAX_DETALLES), ...extra],
    };
  }
  if (productos.length === 0) return { ok: false, error: "El Excel no trae productos." };
  if (productos.length > MAX_PRODUCTOS) {
    return { ok: false, error: `El Excel trae ${productos.length} productos; el máximo es ${MAX_PRODUCTOS}.` };
  }

  return { ok: true, productos, sinPiezas: productos.filter((producto) => producto.piezas === 0).length };
}
