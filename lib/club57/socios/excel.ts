import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { normalizeText } from "@/lib/normalizeText";
import { findExampleColumnIndex, isExampleMarkerRow } from "@/lib/importTemplates/buildTemplate";
import { PARTNER_COLUMNS, PARTNER_COLUMN_ALIASES, type PartnerColumnKey } from "./columns";
import type { PartnerInput } from "./normalize";

// Lectura de un Excel o CSV de socios comerciales (solo servidor). Busca en
// todas las hojas la que tenga el encabezado NOMBRE_COMERCIAL en sus
// primeras filas, así sirve tanto la plantilla como el archivo normalizado
// del cliente (hoja «Socios_Comerciales», con columnas extra como «#»).

export interface RawPartnerRow {
  /** Número de fila en el archivo (como lo ve el admin en Excel). */
  rowNumber: number;
  input: Partial<PartnerInput>;
}

export interface ParsedPartnerFile {
  sheetName: string;
  rows: RawPartnerRow[];
}

const KEYS = new Set<string>(PARTNER_COLUMNS.map((column) => column.key));

export function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("result" in value && value.result !== null && value.result !== undefined) return String(value.result);
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("hyperlink" in value && typeof value.hyperlink === "string") return value.hyperlink;
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((part) => part.text).join("");
    return "";
  }
  return String(value);
}

function headerKey(text: string): PartnerColumnKey | null {
  const normalized = normalizeText(text);
  if (KEYS.has(normalized)) return normalized as PartnerColumnKey;
  const spaced = normalized.replace(/_/g, " ");
  return PARTNER_COLUMN_ALIASES[normalized] ?? PARTNER_COLUMN_ALIASES[spaced] ?? null;
}

export async function loadPartnerWorkbook(buffer: Buffer, fileName: string): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  if (fileName.toLowerCase().endsWith(".csv")) {
    await workbook.csv.read(Readable.from(buffer));
  } else {
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  }
  return workbook;
}

export function parsePartnerWorkbook(workbook: ExcelJS.Workbook): ParsedPartnerFile | null {
  for (const sheet of workbook.worksheets) {
    for (let headerRowNumber = 1; headerRowNumber <= Math.min(5, sheet.rowCount); headerRowNumber += 1) {
      const headerRow = sheet.getRow(headerRowNumber);
      const columnIndex = new Map<PartnerColumnKey, number>();
      headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const key = headerKey(cellToString(cell.value));
        if (key && !columnIndex.has(key)) columnIndex.set(key, colNumber);
      });
      if (!columnIndex.has("nombre_comercial")) continue;

      const exampleColumnIndex = findExampleColumnIndex(headerRow, normalizeText, cellToString);
      const rows: RawPartnerRow[] = [];
      for (let rowNumber = headerRowNumber + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
        const row = sheet.getRow(rowNumber);
        if (isExampleMarkerRow(row, exampleColumnIndex)) continue;
        const input: Partial<PartnerInput> = {};
        let hasValue = false;
        for (const [key, col] of columnIndex) {
          const text = cellToString(row.getCell(col).value).trim();
          if (text) hasValue = true;
          input[key] = text;
        }
        if (hasValue) rows.push({ rowNumber, input });
      }
      return { sheetName: sheet.name, rows };
    }
  }
  return null;
}
