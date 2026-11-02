import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { STORE_ADDRESS, STORE_PHONE_DISPLAY } from "@/lib/store-info";
import { formatRangoLegible, type PromoRango } from "@/lib/club57/promociones/vigencia";
import type { LiquidacionProducto } from "./parseExcel";
import { INTER_BOLD_TTF, INTER_REGULAR_TTF, LOGO_NARANJA_PNG, RUSSO_ONE_TTF } from "./pdfAssets";

// PDF de Liquidaciones del Mes con la identidad de Ferretería 57 (mismos
// tokens que el sitio y los correos): encabezado blanco con logo naranja,
// barra naranja de acento, tabla con encabezado pizarra y filas alternadas
// en gris claro, pie pizarra con datos de la tienda. Tamaño carta.

const ORANGE = rgb(1, 0.4, 0);
const SLATE = rgb(0x3f / 255, 0x51 / 255, 0x5a / 255);
const BLACK = rgb(0x1a / 255, 0x1a / 255, 0x1a / 255);
const GRAY = rgb(0xf2 / 255, 0xf1 / 255, 0xef / 255);
const WHITE = rgb(1, 1, 1);

/** Tokens de marca para los PDF (los reutiliza la guía del blog: lib/blog/guide-pdf.ts). */
export const BRAND_PDF = { ORANGE, SLATE, BLACK, GRAY, WHITE } as const;

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_HEIGHT = 58;

const COLUMNS = [
  { key: "codigo", label: "CÓDIGO", width: 72, align: "left" },
  { key: "piezas", label: "PIEZAS", width: 56, align: "center" },
  { key: "descripcion", label: "DESCRIPCIÓN", width: 284, align: "left" },
  { key: "precio", label: "PRECIO LIQUIDACIÓN", width: 120, align: "right" },
] as const;

const BODY_SIZE = 9.5;
const PRICE_SIZE = 10.5;
const LINE_GAP = 3;
const CELL_PAD_X = 8;
const CELL_PAD_Y = 6;

const moneyFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  display: PDFFont;
}

/** Inter (regular y bold) y Russo One embebidas en subconjunto: texto seleccionable y archivo ligero. */
export async function embedBrandFonts(doc: PDFDocument): Promise<Fonts> {
  doc.registerFontkit(fontkit);
  return {
    regular: await doc.embedFont(Buffer.from(INTER_REGULAR_TTF, "base64"), { subset: true }),
    bold: await doc.embedFont(Buffer.from(INTER_BOLD_TTF, "base64"), { subset: true }),
    display: await doc.embedFont(Buffer.from(RUSSO_ONE_TTF, "base64"), { subset: true }),
  };
}

export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    // Palabra más ancha que la celda: se parte por caracteres.
    let rest = word;
    while (font.widthOfTextAtSize(rest, size) > maxWidth) {
      let cut = rest.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut--;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    current = rest;
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function drawAligned(
  page: PDFPage,
  text: string,
  options: { x: number; width: number; y: number; font: PDFFont; size: number; color: ReturnType<typeof rgb>; align: "left" | "center" | "right" }
) {
  const textWidth = options.font.widthOfTextAtSize(text, options.size);
  const x =
    options.align === "right"
      ? options.x + options.width - CELL_PAD_X - textWidth
      : options.align === "center"
        ? options.x + (options.width - textWidth) / 2
        : options.x + CELL_PAD_X;
  page.drawText(text, { x, y: options.y, font: options.font, size: options.size, color: options.color });
}

export async function renderLiquidacionPdf(input: {
  productos: LiquidacionProducto[];
  rango: PromoRango | null;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await embedBrandFonts(doc);
  const logo = await doc.embedPng(Buffer.from(LOGO_NARANJA_PNG, "base64"));
  const vigencia = input.rango ? `Válido ${formatRangoLegible(input.rango).replace(/^Del /, "del ").replace(/^El /, "el ")}` : "Vigencia por definir";

  doc.setTitle(`Liquidaciones del Mes — Ferretería 57`);
  doc.setAuthor("Ferretería 57");
  doc.setSubject(vigencia);
  doc.setCreator("Ferretería 57 — Club 57");
  doc.setProducer("Ferretería 57");

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = 0;

  const drawTableHeader = () => {
    const height = 24;
    page.drawRectangle({ x: MARGIN, y: y - height, width: CONTENT_WIDTH, height, color: SLATE });
    let x = MARGIN;
    for (const column of COLUMNS) {
      drawAligned(page, column.label, {
        x, width: column.width, y: y - height + 8, font: fonts.display, size: 8.5, color: WHITE, align: column.align,
      });
      x += column.width;
    }
    y -= height;
  };

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    y = PAGE_HEIGHT - MARGIN;

    const logoWidth = 132;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    page.drawImage(logo, { x: MARGIN, y: y - logoHeight, width: logoWidth, height: logoHeight });

    const title = "LIQUIDACIONES DEL MES";
    page.drawText(title, {
      x: PAGE_WIDTH - MARGIN - fonts.display.widthOfTextAtSize(title, 17),
      y: y - 17,
      font: fonts.display,
      size: 17,
      color: SLATE,
    });
    const subtitle = "Exclusivo para miembros de Club 57";
    page.drawText(subtitle, {
      x: PAGE_WIDTH - MARGIN - fonts.regular.widthOfTextAtSize(subtitle, 9),
      y: y - 32,
      font: fonts.regular,
      size: 9,
      color: SLATE,
    });
    y -= Math.max(logoHeight, 38) + 12;

    page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_WIDTH, height: 4, color: ORANGE });
    y -= 4 + 10;

    const bandHeight = 30;
    page.drawRectangle({ x: MARGIN, y: y - bandHeight, width: CONTENT_WIDTH, height: bandHeight, color: GRAY });
    page.drawText(vigencia, { x: MARGIN + 12, y: y - bandHeight + 11, font: fonts.bold, size: 11, color: BLACK });
    const note = "Precios con impuestos incluidos";
    page.drawText(note, {
      x: PAGE_WIDTH - MARGIN - 12 - fonts.regular.widthOfTextAtSize(note, 9),
      y: y - bandHeight + 11.5,
      font: fonts.regular,
      size: 9,
      color: SLATE,
    });
    y -= bandHeight + 12;
    drawTableHeader();
  };

  newPage();

  input.productos.forEach((producto, index) => {
    const descripcionWidth = COLUMNS[2].width - CELL_PAD_X * 2;
    const lines = wrapText(producto.descripcion, fonts.regular, BODY_SIZE, descripcionWidth);
    const lineHeight = BODY_SIZE + LINE_GAP;
    const rowHeight = Math.max(lines.length * lineHeight - LINE_GAP, PRICE_SIZE) + CELL_PAD_Y * 2;

    if (y - rowHeight < MARGIN + FOOTER_HEIGHT) newPage();

    if (index % 2 === 1) {
      page.drawRectangle({ x: MARGIN, y: y - rowHeight, width: CONTENT_WIDTH, height: rowHeight, color: GRAY });
    }
    const firstBaseline = y - CELL_PAD_Y - BODY_SIZE + 1.5;
    const middleBaseline = y - rowHeight / 2 - BODY_SIZE / 2 + 2;

    let x = MARGIN;
    drawAligned(page, producto.codigo, { x, width: COLUMNS[0].width, y: middleBaseline, font: fonts.regular, size: BODY_SIZE, color: BLACK, align: "left" });
    x += COLUMNS[0].width;
    drawAligned(page, String(producto.piezas), { x, width: COLUMNS[1].width, y: middleBaseline, font: fonts.regular, size: BODY_SIZE, color: BLACK, align: "center" });
    x += COLUMNS[1].width;
    lines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: x + CELL_PAD_X,
        y: firstBaseline - lineIndex * lineHeight,
        font: fonts.regular,
        size: BODY_SIZE,
        color: BLACK,
      });
    });
    x += COLUMNS[2].width;
    drawAligned(page, moneyFormatter.format(producto.precio), { x, width: COLUMNS[3].width, y: middleBaseline - 0.5, font: fonts.bold, size: PRICE_SIZE, color: BLACK, align: "right" });

    y -= rowHeight;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_WIDTH, y }, thickness: 0.4, color: rgb(0.85, 0.85, 0.83) });
  });

  // Pie de página en todas las hojas (se dibuja al final para conocer el total).
  pages.forEach((current, index) => {
    current.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: FOOTER_HEIGHT - 8, color: SLATE });
    const legal = "Válidos únicamente con pago de contado.";
    current.drawText(legal, { x: MARGIN, y: 34, font: fonts.bold, size: 8.5, color: WHITE });
    const disclaimer = "Las existencias están sujetas a cambio sin previo aviso.";
    current.drawText(disclaimer, { x: MARGIN, y: 22, font: fonts.regular, size: 8, color: WHITE });
    const store = `Ferretería 57 · ${STORE_ADDRESS} · Tel. ${STORE_PHONE_DISPLAY}`;
    current.drawText(store, { x: MARGIN, y: 10, font: fonts.regular, size: 7, color: WHITE });
    const pageLabel = `Página ${index + 1} de ${pages.length}`;
    current.drawText(pageLabel, {
      x: PAGE_WIDTH - MARGIN - fonts.regular.widthOfTextAtSize(pageLabel, 8),
      y: 34,
      font: fonts.regular,
      size: 8,
      color: WHITE,
    });
  });

  return doc.save();
}
