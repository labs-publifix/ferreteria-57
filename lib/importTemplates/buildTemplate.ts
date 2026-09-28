import ExcelJS from "exceljs";
import type { ImportColumnDef } from "./columnDefs";

// Columna extra (no parte del esquema real) que la plantilla agrega al
// final para marcar sus propias filas de ejemplo — ver
// isExampleMarkerRow() más abajo. El nombre es deliberadamente obvio en
// español para que quien abra el Excel entienda de inmediato qué es, sin
// tener que leer la hoja de Instrucciones primero.
export const EXAMPLE_COLUMN_HEADER = "Ejemplo (bórrala)";
export const EXAMPLE_MARKER_VALUE = "SI";

export interface BuildTemplateOptions {
  /** Definición de columnas — la MISMA que usa el importador para parsear. */
  columns: readonly ImportColumnDef[];
  /** Nombre de la hoja con los datos (no "Instrucciones", esa se agrega aparte). */
  sheetName: string;
  /** Filas de ejemplo — cada una un mapa columna.key -> valor. Si se omite,
   *  se genera una sola fila usando el `example` de cada columna. */
  exampleRows?: Record<string, string>[];
  /** columna.key -> lista de valores permitidos, para un desplegable de
   *  validación de datos en esa columna (p. ej. categorías vigentes). */
  dropdowns?: Record<string, string[]>;
  /** Título mostrado arriba de la hoja de Instrucciones. */
  instructionsTitle: string;
  /** Notas adicionales de contexto para la hoja de Instrucciones (además
   *  de la tabla de columnas, que siempre se genera). */
  extraNotes?: string[];
}

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF2F2F2" },
};

// Genera el .xlsx de una plantilla descargable a partir de la MISMA
// definición de columnas que usa el importador correspondiente — nunca a
// mano, para que plantilla e importador no puedan desincronizarse (#8).
//
// Devuelve ArrayBuffer (no Buffer ni Uint8Array): exceljs trae su propio
// .d.ts con un `declare interface Buffer extends ArrayBuffer {}` ambiental
// que choca con el Buffer real de Node en cualquier lugar donde se le pida
// encajar en el tipo BodyInit/BlobPart de Response/NextResponse/Blob
// (mismo conflicto de tipos ya documentado en loadWorkbook,
// app/(admin)/.../productos/importar/actions.ts) — un ArrayBuffer plano
// evita el problema de raíz para quien llama (new Blob([buffer])), en vez
// de que cada ruta de descarga tenga que volver a castear.
export async function buildImportTemplate(options: BuildTemplateOptions): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ferretería 57";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(options.sheetName);
  const headers = [...options.columns.map((column) => column.header), EXAMPLE_COLUMN_HEADER];
  sheet.addRow(headers);

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
  });

  const examples =
    options.exampleRows && options.exampleRows.length > 0
      ? options.exampleRows
      : [Object.fromEntries(options.columns.map((column) => [column.key, column.example]))];

  // Filas de ejemplo: en cursiva y gris, más la columna "Ejemplo (bórrala)"
  // marcada "SI" — así se distinguen a simple vista Y quedan reconocibles
  // por el importador si alguien las sube sin borrarlas (ver
  // isExampleMarkerRow, que cada importador ya llama antes de procesar
  // cada fila).
  for (const example of examples) {
    const values = options.columns.map((column) => example[column.key] ?? column.example);
    const row = sheet.addRow([...values, EXAMPLE_MARKER_VALUE]);
    row.font = { italic: true, color: { argb: "FF9CA3AF" } };
  }

  // Desplegables de validación de datos — en un rango generoso de filas
  // futuras (no solo las de ejemplo), para que sirvan también al admin
  // mientras llena el archivo real. Los valores permitidos viven en una
  // hoja aparte y oculta: la forma de lista inline (fórmula con comas)
  // tiene un límite de 255 caracteres en Excel, insuficiente si hay muchas
  // categorías.
  if (options.dropdowns && Object.keys(options.dropdowns).length > 0) {
    const listSheet = workbook.addWorksheet("ListasValidas");
    listSheet.state = "veryHidden";
    let listColOffset = 1;

    for (const [key, values] of Object.entries(options.dropdowns)) {
      const colIndex = options.columns.findIndex((column) => column.key === key);
      if (colIndex === -1 || values.length === 0) continue;

      values.forEach((value, index) => {
        listSheet.getCell(index + 1, listColOffset).value = value;
      });
      const listColLetter = listSheet.getColumn(listColOffset).letter;
      const rangeRef = `ListasValidas!$${listColLetter}$1:$${listColLetter}$${values.length}`;

      const excelCol = colIndex + 1;
      for (let rowNumber = 2; rowNumber <= 500; rowNumber++) {
        sheet.getCell(rowNumber, excelCol).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [rangeRef],
        };
      }
      listColOffset += 1;
    }
  }

  sheet.columns.forEach((column) => {
    column.width = 26;
  });

  const instructions = workbook.addWorksheet("Instrucciones");
  instructions.getCell("A1").value = options.instructionsTitle;
  instructions.getCell("A1").font = { bold: true, size: 14 };

  const tableHeaderRowNumber = 3;
  instructions.getRow(tableHeaderRowNumber).values = ["Columna", "Obligatorio", "Formato / valores permitidos"];
  instructions.getRow(tableHeaderRowNumber).font = { bold: true };
  instructions.getRow(tableHeaderRowNumber).eachCell((cell) => {
    cell.fill = HEADER_FILL;
  });

  options.columns.forEach((column, index) => {
    const row = instructions.getRow(tableHeaderRowNumber + 1 + index);
    row.values = [column.header, column.required ? "Sí" : "No", column.format];
    row.alignment = { vertical: "top", wrapText: true };
  });

  const notesStartRow = tableHeaderRowNumber + options.columns.length + 2;
  const notes = [
    `Las filas marcadas "${EXAMPLE_MARKER_VALUE}" en la columna "${EXAMPLE_COLUMN_HEADER}" son solo de ejemplo — bórralas antes de subir tu archivo. Si las dejas, el sistema las reconoce y las ignora automáticamente, no se importan como productos reales.`,
    ...(options.extraNotes ?? []),
  ];
  notes.forEach((note, index) => {
    const row = instructions.getRow(notesStartRow + index);
    row.getCell(1).value = note;
    row.getCell(1).alignment = { wrapText: true };
    instructions.mergeCells(notesStartRow + index, 1, notesStartRow + index, 3);
  });

  instructions.getColumn(1).width = 28;
  instructions.getColumn(2).width = 14;
  instructions.getColumn(3).width = 90;

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return arrayBuffer as unknown as ArrayBuffer;
}

// Reconoce una fila de ejemplo de la plantilla por su columna marcadora —
// cada importador la llama justo después de leer los valores de una fila,
// antes de decidir si está vacía o tiene errores, para que una fila de
// ejemplo dejada sin borrar nunca se procese como dato real (#8, punto 5).
export function isExampleMarkerRow(row: ExcelJS.Row, exampleColumnIndex: number | undefined): boolean {
  if (exampleColumnIndex === undefined) return false;
  const value = row.getCell(exampleColumnIndex).value;
  const text = typeof value === "string" ? value : value == null ? "" : String(value);
  return text.trim().toUpperCase() === EXAMPLE_MARKER_VALUE;
}

// Busca la columna "Ejemplo (bórrala)" por encabezado normalizado, igual
// que el resto de las columnas — puede no existir (un archivo que no vino
// de la plantilla no la trae), en cuyo caso isExampleMarkerRow() arriba
// simplemente no encuentra nada que marcar.
export function findExampleColumnIndex(
  headerRow: ExcelJS.Row,
  normalizeText: (value: string) => string,
  cellToString: (value: ExcelJS.CellValue) => string
): number | undefined {
  let found: number | undefined;
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (normalizeText(cellToString(cell.value)) === normalizeText(EXAMPLE_COLUMN_HEADER)) {
      found = colNumber;
    }
  });
  return found;
}
