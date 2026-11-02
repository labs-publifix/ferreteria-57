import type { Workbook, Worksheet } from "exceljs";
import { normalizeText } from "@/lib/normalizeText";

// Lectura del Excel editorial del blog (docs/blog/backlog_blog_ferreteria57.xlsx)
// para npm run blog:next. Une, por ID, las hojas Backlog, Briefs SEO y
// Guías PDF. Las columnas se ubican por el texto del encabezado (no por
// posición) para que mover una columna en el Excel no rompa nada. Solo
// lectura: el sitio nunca usa este archivo.

export interface ExcelBrief {
  slug: string;
  url: string;
  titleTag: string;
  meta: string;
  h1: string;
  keyword: string;
  secundarias: string;
  faq: string[];
  h2: string[];
  puntosClave: string[];
  extension: string;
  schema: string;
  productos: string;
  enlacesInternos: string[];
  enlacesFuturos: string[];
  pilar: string;
  regla: string;
  enfoqueLocal: string;
  cta: string;
  estado: string;
}

export interface ExcelGuide {
  titulo: string;
  archivo: string;
  formato: string;
  paginas: number | null;
  contenido: string;
  regla: string;
  textoEntrega: string;
  estado: string;
}

export interface ExcelTopic {
  id: string;
  etapa: string;
  /** YYYY-MM-DD o "" si la fila no tiene fecha. */
  fecha: string;
  cluster: string;
  rol: string;
  tipo: string;
  titulo: string;
  keyword: string;
  intencion: string;
  audiencia: string;
  angulo: string;
  regla: string;
  guiaTitulo: string;
  estado: string;
  brief?: ExcelBrief;
  guia?: ExcelGuide;
}

/** Texto de una celda de exceljs: richText, fórmula ({result}), hipervínculo, fecha o número. */
export function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const cell = value as { richText?: { text: string }[]; result?: unknown; text?: unknown; error?: unknown };
    if (Array.isArray(cell.richText)) return cell.richText.map((part) => part.text).join("").trim();
    if ("result" in cell) return cellText(cell.result);
    if ("text" in cell) return cellText(cell.text);
  }
  return "";
}

/** Fecha de una celda como YYYY-MM-DD (Date de Excel, ISO o dd/mm/aaaa). */
export function cellDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = cellText(value);
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  return "";
}

/** Lista de una celda con viñetas («•») o numerada («1.»), una por renglón. */
export function cellList(value: unknown): string[] {
  return cellText(value)
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[•\-–]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

type Row = (header: string) => unknown;

function sheetRows(sheet: Worksheet | undefined): Row[] {
  if (!sheet) return [];
  const headers = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, col) => headers.set(normalizeText(cellText(cell.value)), col));
  // Busca la columna por inicio del encabezado: "Título de la guía", "Car."…
  const column = (header: string): number | undefined => {
    const wanted = normalizeText(header);
    if (headers.has(wanted)) return headers.get(wanted);
    for (const [text, col] of headers) if (text.startsWith(wanted)) return col;
    return undefined;
  };
  const rows: Row[] = [];
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const get: Row = (header) => {
      const col = column(header);
      return col === undefined ? null : row.getCell(col).value;
    };
    if (/^B\d{2,3}$/.test(cellText(get("ID")))) rows.push(get);
  });
  return rows;
}

export function parseWorkbook(workbook: Workbook): ExcelTopic[] {
  const briefs = new Map(
    sheetRows(workbook.getWorksheet("Briefs SEO")).map((get): [string, ExcelBrief] => [
      cellText(get("ID")),
      {
        slug: cellText(get("Slug")),
        url: cellText(get("URL canónica")),
        titleTag: cellText(get("Title tag")),
        meta: cellText(get("Meta description")),
        h1: cellText(get("H1")),
        keyword: cellText(get("Keyword principal")),
        secundarias: cellText(get("Keywords secundarias")),
        faq: cellList(get("Preguntas frecuentes")),
        h2: cellList(get("Estructura (H2)")),
        puntosClave: cellList(get("Puntos clave")),
        extension: cellText(get("Extensión")),
        schema: cellText(get("Schema.org")),
        productos: cellText(get("Productos / categorías")),
        enlacesInternos: cellList(get("Enlaces internos")),
        enlacesFuturos: cellList(get("Enlaces futuros")),
        pilar: cellText(get("Pilar del clúster")),
        regla: cellText(get("Regla de redacción")),
        enfoqueLocal: cellText(get("Enfoque local")),
        cta: cellText(get("CTA hacia Club 57")),
        estado: cellText(get("Estado brief")),
      },
    ])
  );
  const guides = new Map(
    sheetRows(workbook.getWorksheet("Guías PDF")).map((get): [string, ExcelGuide] => {
      const paginas = Number(cellText(get("Páginas")));
      return [
        cellText(get("ID")),
        {
          titulo: cellText(get("Título de la guía")),
          archivo: cellText(get("Nombre de archivo")),
          formato: cellText(get("Formato")),
          paginas: Number.isFinite(paginas) && paginas > 0 ? paginas : null,
          contenido: cellText(get("Contenido por página")),
          regla: cellText(get("Regla de redacción")),
          textoEntrega: cellText(get("Texto de entrega")),
          estado: cellText(get("Estado PDF")),
        },
      ];
    })
  );
  return sheetRows(workbook.getWorksheet("Backlog")).map((get) => {
    const id = cellText(get("ID"));
    return {
      id,
      etapa: cellText(get("Etapa")),
      fecha: cellDate(get("Fecha")),
      cluster: cellText(get("Clúster")),
      rol: cellText(get("Rol")),
      tipo: cellText(get("Tipo")),
      titulo: cellText(get("Título propuesto")),
      keyword: cellText(get("Keyword objetivo")),
      intencion: cellText(get("Intención")),
      audiencia: cellText(get("Audiencia")),
      angulo: cellText(get("Ángulo diferenciador")),
      regla: cellText(get("Regla de redacción")),
      guiaTitulo: cellText(get("Guía PDF")),
      estado: cellText(get("Estado")),
      brief: briefs.get(id),
      guia: guides.get(id),
    };
  });
}
