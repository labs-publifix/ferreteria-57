import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { BRAND_PDF, embedBrandFonts, wrapText, type Fonts } from "@/lib/club57/promociones/liquidaciones/renderPdf";
import { LOGO_NARANJA_PNG } from "@/lib/club57/promociones/liquidaciones/pdfAssets";
import type { GuideBlock, GuideData } from "./guide-schema";
import { canonicalUrl } from "./seo";

// PDF de marca de una guía de Club 57, generado al momento de la descarga
// (nada se guarda). Reutiliza las fuentes, el logo y los tokens del PDF de
// Liquidaciones. Carta, texto seleccionable, sin fotos.
//
// Portada negra con el monograma F57, «Guía Club 57», título y lo que
// incluye; páginas de contenido con encabezado, bloques y pie con la URL
// del artículo y el número de página. El naranja solo va en superficies,
// barras y texto grande o sobre negro: nunca texto chico sobre blanco.

const { ORANGE, SLATE, BLACK, GRAY, WHITE } = BRAND_PDF;
const MUTED_ON_BLACK = rgb(0.83, 0.83, 0.81);
const RULE = rgb(0.85, 0.85, 0.83);

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 44;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_TOP = 46;
const BLOCK_GAP = 14;

const BODY = 9.5;
const BODY_LEAD = 13.4;
const CELL = 8.6;
const CELL_LEAD = 11.2;

export interface GuidePdfInput {
  guide: GuideData;
  articleTitle: string;
  /** URL canónica del artículo (va en el pie de cada página). */
  articleUrl: string;
}

export interface GuidePdfResult {
  bytes: Uint8Array;
  pageCount: number;
  /** Páginas físicas de más porque el contenido no cupo en su página (blog:pdf y blog:check lo reportan). */
  overflowPages: number;
}

export function guideFileName(slug: string): string {
  return `guia-${slug}.pdf`;
}

// Un impreso dura más que cualquier deployment: el pie siempre lleva el
// dominio público, no el host del preview o de localhost.
const PUBLIC_SITE_URL = "https://ferreteria57.com";

export function guideArticleUrl(slug: string): string {
  return canonicalUrl(`/blog/${slug}`, PUBLIC_SITE_URL);
}

interface Ctx {
  doc: PDFDocument;
  fonts: Fonts;
  page: PDFPage;
  y: number;
  pages: PDFPage[];
  guide: GuideData;
  overflowPages: number;
}

function drawLines(page: PDFPage, lines: string[], x: number, y: number, font: PDFFont, size: number, lead: number, color: RGB) {
  lines.forEach((line, i) => page.drawText(line, { x, y: y - size - i * lead + 2, font, size, color }));
}

function textHeight(lines: number, size: number, lead: number): number {
  return lines === 0 ? 0 : (lines - 1) * lead + size + 2;
}

function truncate(text: string, font: PDFFont, size: number, width: number): string {
  if (font.widthOfTextAtSize(text, size) <= width) return text;
  let cut = text.length;
  while (cut > 1 && font.widthOfTextAtSize(`${text.slice(0, cut)}…`, size) > width) cut--;
  return `${text.slice(0, cut).trimEnd()}…`;
}

function monogram(page: PDFPage, fonts: Fonts, x: number, top: number, size: number) {
  page.drawRectangle({ x, y: top - size, width: size, height: size, color: ORANGE });
  const fontSize = size * 0.4;
  const width = fonts.display.widthOfTextAtSize("F57", fontSize);
  page.drawText("F57", { x: x + (size - width) / 2, y: top - size / 2 - fontSize * 0.36, font: fonts.display, size: fontSize, color: BLACK });
}

// --- portada ---------------------------------------------------------------

async function drawCover(ctx: Ctx, input: GuidePdfInput) {
  const { fonts, guide } = ctx;
  const page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.pages.push(page);
  const panelBottom = 330;
  page.drawRectangle({ x: 0, y: panelBottom, width: PAGE_WIDTH, height: PAGE_HEIGHT - panelBottom, color: BLACK });
  page.drawRectangle({ x: 0, y: panelBottom, width: PAGE_WIDTH, height: 6, color: ORANGE });

  const top = PAGE_HEIGHT - MARGIN;
  monogram(page, fonts, MARGIN, top, 58);
  page.drawText("GUÍA CLUB 57", { x: MARGIN + 74, y: top - 24, font: fonts.display, size: 15, color: ORANGE });
  page.drawText("ferreteria57.com", { x: MARGIN + 74, y: top - 44, font: fonts.regular, size: 10, color: MUTED_ON_BLACK });

  let y = top - 128;
  const titleSize = guide.titulo.length > 70 ? 26 : 31;
  const titleLead = titleSize * 1.2;
  const titleLines = wrapText(guide.titulo, fonts.display, titleSize, CONTENT_WIDTH);
  drawLines(page, titleLines, MARGIN, y, fonts.display, titleSize, titleLead, WHITE);
  y -= textHeight(titleLines.length, titleSize, titleLead) + 18;
  page.drawRectangle({ x: MARGIN, y: y - 5, width: 72, height: 5, color: ORANGE });
  y -= 5 + 18;
  const subLines = wrapText(guide.subtitulo, fonts.regular, 12.5, CONTENT_WIDTH - 60);
  drawLines(page, subLines, MARGIN, y, fonts.regular, 12.5, 18, MUTED_ON_BLACK);

  page.drawText("Gratis para miembros de Club 57", { x: MARGIN, y: panelBottom + 28, font: fonts.bold, size: 10, color: WHITE });

  // Parte blanca: qué incluye y de qué artículo sale.
  y = panelBottom - 40;
  page.drawText("EN ESTA GUÍA", { x: MARGIN, y: y - 10, font: fonts.display, size: 10, color: SLATE });
  y -= 26;
  guide.paginas.forEach((content, index) => {
    const number = String(index + 2).padStart(2, "0");
    page.drawRectangle({ x: MARGIN, y: y - 22, width: 30, height: 22, color: GRAY });
    page.drawText(number, { x: MARGIN + 15 - fonts.display.widthOfTextAtSize(number, 11) / 2, y: y - 15.5, font: fonts.display, size: 11, color: BLACK });
    page.drawText(truncate(content.titulo, fonts.bold, 11.5, CONTENT_WIDTH - 46), { x: MARGIN + 42, y: y - 15.5, font: fonts.bold, size: 11.5, color: BLACK });
    y -= 30;
  });

  y -= 14;
  page.drawText("Complemento del artículo", { x: MARGIN, y: y - 9, font: fonts.regular, size: 9, color: SLATE });
  y -= 16;
  const articleLines = wrapText(input.articleTitle, fonts.bold, 11, CONTENT_WIDTH);
  drawLines(page, articleLines, MARGIN, y, fonts.bold, 11, 15, BLACK);

  const logo = await ctx.doc.embedPng(Buffer.from(LOGO_NARANJA_PNG, "base64"));
  const logoWidth = 118;
  const logoHeight = (logo.height / logo.width) * logoWidth;
  page.drawImage(logo, { x: MARGIN, y: FOOTER_TOP + 18, width: logoWidth, height: logoHeight });
  const site = "ferreteria57.com";
  page.drawText(site, { x: PAGE_WIDTH - MARGIN - fonts.display.widthOfTextAtSize(site, 13), y: FOOTER_TOP + 22, font: fonts.display, size: 13, color: SLATE });
}

// --- páginas de contenido ---------------------------------------------------

function newContentPage(ctx: Ctx) {
  const { fonts, guide } = ctx;
  const page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.pages.push(page);
  ctx.page = page;
  const top = PAGE_HEIGHT - MARGIN + 8;
  monogram(page, fonts, MARGIN, top, 24);
  const label = "GUÍA CLUB 57";
  const labelWidth = fonts.display.widthOfTextAtSize(label, 8.5);
  page.drawText(label, { x: PAGE_WIDTH - MARGIN - labelWidth, y: top - 15.5, font: fonts.display, size: 8.5, color: SLATE });
  page.drawText(truncate(guide.titulo, fonts.display, 10, CONTENT_WIDTH - 40 - labelWidth - 16), {
    x: MARGIN + 34, y: top - 16, font: fonts.display, size: 10, color: BLACK,
  });
  page.drawRectangle({ x: MARGIN, y: top - 34, width: CONTENT_WIDTH, height: 3, color: ORANGE });
  ctx.y = top - 34 - 20;
}

function remaining(ctx: Ctx): number {
  return ctx.y - FOOTER_TOP - 10;
}

/** Si el alto no cabe, sigue en una página física nueva (se marca como desborde). */
function ensure(ctx: Ctx, height: number) {
  if (height <= remaining(ctx)) return;
  ctx.overflowPages += 1;
  newContentPage(ctx);
}

function blockTitleHeight(title: string | undefined): number {
  return title ? 20 : 0;
}

function drawBlockTitle(ctx: Ctx, title: string | undefined) {
  if (!title) return;
  ctx.page.drawText(title, { x: MARGIN, y: ctx.y - 11, font: ctx.fonts.display, size: 11.5, color: BLACK });
  ctx.y -= 20;
}

function drawTable(ctx: Ctx, block: Extract<GuideBlock, { type: "tabla" }>) {
  const { fonts } = ctx;
  const weights = block.anchos ?? block.columnas.map(() => 1);
  const total = weights.reduce((sum, w) => sum + w, 0);
  const widths = weights.map((w) => (w / total) * CONTENT_WIDTH);
  const padX = 6;
  const padY = 5;
  const headerLines = block.columnas.map((label, i) => wrapText(label.toUpperCase(), fonts.display, 8, widths[i] - padX * 2));
  const headerHeight = Math.max(...headerLines.map((lines) => textHeight(lines.length, 8, 10))) + padY * 2;
  const rows = block.filas.map((row) =>
    row.map((cell, i) => wrapText(cell, i === 0 ? fonts.bold : fonts.regular, CELL, widths[i] - padX * 2))
  );
  const rowHeights = rows.map((cells) => Math.max(...cells.map((lines) => textHeight(lines.length, CELL, CELL_LEAD))) + padY * 2);

  const drawHeader = () => {
    ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - headerHeight, width: CONTENT_WIDTH, height: headerHeight, color: SLATE });
    let x = MARGIN;
    headerLines.forEach((lines, i) => {
      drawLines(ctx.page, lines, x + padX, ctx.y - padY, fonts.display, 8, 10, WHITE);
      x += widths[i];
    });
    ctx.y -= headerHeight;
  };

  ensure(ctx, blockTitleHeight(block.titulo) + headerHeight + (rowHeights[0] ?? 0));
  drawBlockTitle(ctx, block.titulo);
  drawHeader();
  rows.forEach((cells, rowIndex) => {
    const height = rowHeights[rowIndex];
    if (height > remaining(ctx)) {
      ctx.overflowPages += 1;
      newContentPage(ctx);
      drawHeader();
    }
    if (rowIndex % 2 === 1) ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - height, width: CONTENT_WIDTH, height, color: GRAY });
    let x = MARGIN;
    cells.forEach((lines, i) => {
      drawLines(ctx.page, lines, x + padX, ctx.y - padY, i === 0 ? fonts.bold : fonts.regular, CELL, CELL_LEAD, BLACK);
      x += widths[i];
    });
    ctx.y -= height;
    ctx.page.drawLine({ start: { x: MARGIN, y: ctx.y }, end: { x: MARGIN + CONTENT_WIDTH, y: ctx.y }, thickness: 0.5, color: RULE });
  });
}

function drawChecklist(ctx: Ctx, block: Extract<GuideBlock, { type: "checklist" }>) {
  const { fonts } = ctx;
  const indent = 22;
  const items = block.items.map((item) => wrapText(item, fonts.regular, BODY + 0.5, CONTENT_WIDTH - indent));
  const itemHeights = items.map((lines) => textHeight(lines.length, BODY + 0.5, BODY_LEAD + 0.5) + 9);
  ensure(ctx, blockTitleHeight(block.titulo) + (itemHeights[0] ?? 0));
  drawBlockTitle(ctx, block.titulo);
  items.forEach((lines, i) => {
    ensure(ctx, itemHeights[i]);
    ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 12.5, width: 11, height: 11, borderColor: SLATE, borderWidth: 1.2 });
    drawLines(ctx.page, lines, MARGIN + indent, ctx.y, fonts.regular, BODY + 0.5, BODY_LEAD + 0.5, BLACK);
    ctx.y -= itemHeights[i];
  });
}

function drawSteps(ctx: Ctx, block: Extract<GuideBlock, { type: "pasos" }>) {
  const { fonts } = ctx;
  const indent = 32;
  const items = block.items.map((item) => ({
    title: wrapText(item.titulo, fonts.bold, BODY + 0.5, CONTENT_WIDTH - indent),
    text: wrapText(item.texto, fonts.regular, BODY, CONTENT_WIDTH - indent),
  }));
  const heights = items.map((item) => Math.max(22, textHeight(item.title.length, BODY + 0.5, BODY_LEAD) + 3 + textHeight(item.text.length, BODY, BODY_LEAD)) + 10);
  ensure(ctx, blockTitleHeight(block.titulo) + (heights[0] ?? 0));
  drawBlockTitle(ctx, block.titulo);
  items.forEach((item, i) => {
    ensure(ctx, heights[i]);
    ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 22, width: 22, height: 22, color: ORANGE });
    const number = String(i + 1);
    ctx.page.drawText(number, { x: MARGIN + 11 - fonts.display.widthOfTextAtSize(number, 11) / 2, y: ctx.y - 15.5, font: fonts.display, size: 11, color: BLACK });
    drawLines(ctx.page, item.title, MARGIN + indent, ctx.y, fonts.bold, BODY + 0.5, BODY_LEAD, BLACK);
    const titleHeight = textHeight(item.title.length, BODY + 0.5, BODY_LEAD) + 3;
    drawLines(ctx.page, item.text, MARGIN + indent, ctx.y - titleHeight, fonts.regular, BODY, BODY_LEAD, BLACK);
    ctx.y -= heights[i];
  });
}

// Recuadros: seguridad en negro (título naranja grande, texto blanco),
// importante en naranja con texto negro, nota y consejo en gris claro.
interface BoxOptions {
  title?: string;
  text?: string;
  items?: string[];
  background: RGB;
  titleColor: RGB;
  textColor: RGB;
  accent?: RGB;
}

interface BoxFrame {
  x: number;
  width: number;
  /** Alto mínimo (para igualar dos recuadros lado a lado). */
  minHeight?: number;
  /** Solo medir, sin dibujar. */
  measure?: boolean;
}

function drawBox(ctx: Ctx, options: BoxOptions, frame: BoxFrame = { x: MARGIN, width: CONTENT_WIDTH }): number {
  const { fonts } = ctx;
  const pad = 13;
  const inner = frame.width - pad * 2;
  const x0 = frame.x + pad;
  const title = options.title ? wrapText(options.title, fonts.display, 12, inner) : [];
  const text = options.text ? wrapText(options.text, fonts.regular, BODY, inner) : [];
  const items = (options.items ?? []).map((item) => wrapText(item, fonts.regular, BODY, inner - 14));
  const titleHeight = title.length ? textHeight(title.length, 12, 15) + 8 : 0;
  const textBlock = text.length ? textHeight(text.length, BODY, BODY_LEAD) + (items.length ? 6 : 0) : 0;
  const itemsHeight = items.reduce((sum, lines) => sum + textHeight(lines.length, BODY, BODY_LEAD) + 6, 0) - (items.length ? 6 : 0);
  const height = Math.max(frame.minHeight ?? 0, pad * 2 + titleHeight + textBlock + itemsHeight);
  if (frame.measure) return height;

  const top = ctx.y;
  ctx.page.drawRectangle({ x: frame.x, y: top - height, width: frame.width, height, color: options.background });
  let y = top - pad;
  if (title.length) {
    drawLines(ctx.page, title, x0, y, fonts.display, 12, 15, options.titleColor);
    y -= titleHeight;
  }
  if (text.length) {
    drawLines(ctx.page, text, x0, y, fonts.regular, BODY, BODY_LEAD, options.textColor);
    y -= textBlock;
  }
  items.forEach((lines) => {
    ctx.page.drawRectangle({ x: x0, y: y - 8.5, width: 5, height: 5, color: options.accent ?? ORANGE });
    drawLines(ctx.page, lines, x0 + 14, y, fonts.regular, BODY, BODY_LEAD, options.textColor);
    y -= textHeight(lines.length, BODY, BODY_LEAD) + 6;
  });
  return height;
}

type BoxBlock = Extract<GuideBlock, { type: "consejo" | "callout" }>;

function boxOptions(block: BoxBlock): BoxOptions {
  if (block.type === "consejo") {
    return { title: block.titulo ?? "Consejo", text: block.texto, background: GRAY, titleColor: BLACK, textColor: BLACK, accent: ORANGE };
  }
  const theme =
    block.variante === "seguridad"
      ? { background: BLACK, titleColor: ORANGE, textColor: WHITE, accent: ORANGE }
      : block.variante === "importante"
        ? { background: ORANGE, titleColor: BLACK, textColor: BLACK, accent: BLACK }
        : { background: GRAY, titleColor: BLACK, textColor: BLACK, accent: SLATE };
  return { title: block.titulo, text: block.texto, items: block.items, ...theme };
}

function drawFullBox(ctx: Ctx, block: BoxBlock) {
  const options = boxOptions(block);
  ensure(ctx, drawBox(ctx, options, { x: MARGIN, width: CONTENT_WIDTH, measure: true }));
  ctx.y -= drawBox(ctx, options);
}

const COLUMN_GAP = 12;

function drawBoxPair(ctx: Ctx, left: BoxBlock, right: BoxBlock) {
  const width = (CONTENT_WIDTH - COLUMN_GAP) / 2;
  const frames = [{ x: MARGIN, width }, { x: MARGIN + width + COLUMN_GAP, width }];
  const pair = [boxOptions(left), boxOptions(right)];
  const height = Math.max(...pair.map((options, i) => drawBox(ctx, options, { ...frames[i], measure: true })));
  ensure(ctx, height);
  pair.forEach((options, i) => drawBox(ctx, options, { ...frames[i], minHeight: height }));
  ctx.y -= height;
}

function isHalfBox(block: GuideBlock | undefined): block is BoxBlock {
  return (block?.type === "consejo" || block?.type === "callout") && block.mitad === true;
}

function drawBlock(ctx: Ctx, block: GuideBlock) {
  switch (block.type) {
    case "tabla":
      return drawTable(ctx, block);
    case "checklist":
      return drawChecklist(ctx, block);
    case "pasos":
      return drawSteps(ctx, block);
    case "consejo":
    case "callout":
      return drawFullBox(ctx, block);
  }
}

function drawFooters(ctx: Ctx, articleUrl: string) {
  const { fonts } = ctx;
  const url = articleUrl.replace(/^https?:\/\//, "");
  ctx.pages.forEach((page, index) => {
    page.drawLine({ start: { x: MARGIN, y: FOOTER_TOP - 10 }, end: { x: PAGE_WIDTH - MARGIN, y: FOOTER_TOP - 10 }, thickness: 0.6, color: RULE });
    const label = `Página ${index + 1} de ${ctx.pages.length}`;
    const labelWidth = fonts.regular.widthOfTextAtSize(label, 8);
    page.drawText(truncate(url, fonts.regular, 8, CONTENT_WIDTH - labelWidth - 20), { x: MARGIN, y: FOOTER_TOP - 24, font: fonts.regular, size: 8, color: SLATE });
    page.drawText(label, { x: PAGE_WIDTH - MARGIN - labelWidth, y: FOOTER_TOP - 24, font: fonts.regular, size: 8, color: SLATE });
  });
}

export async function renderGuidePdf(input: GuidePdfInput): Promise<GuidePdfResult> {
  const { guide } = input;
  const doc = await PDFDocument.create();
  const fonts = await embedBrandFonts(doc);
  doc.setTitle(`${guide.titulo} — Guía Club 57`);
  doc.setAuthor("Equipo Ferretería 57");
  doc.setSubject(guide.subtitulo);
  doc.setCreator("Ferretería 57 — Club 57");
  doc.setProducer("Ferretería 57");
  doc.setLanguage("es-MX");

  const ctx = { doc, fonts, pages: [], guide, overflowPages: 0, y: 0 } as unknown as Ctx;
  await drawCover(ctx, input);

  for (const content of guide.paginas) {
    newContentPage(ctx);
    const titleLines = wrapText(content.titulo, fonts.display, 19, CONTENT_WIDTH);
    drawLines(ctx.page, titleLines, MARGIN, ctx.y, fonts.display, 19, 23, BLACK);
    ctx.y -= textHeight(titleLines.length, 19, 23) + 8;
    if (content.intro) {
      const intro = wrapText(content.intro, fonts.regular, 10, CONTENT_WIDTH);
      drawLines(ctx.page, intro, MARGIN, ctx.y, fonts.regular, 10, 14, SLATE);
      ctx.y -= textHeight(intro.length, 10, 14) + 4;
    }
    ctx.y -= 10;
    for (let i = 0; i < content.bloques.length; i += 1) {
      if (i > 0) ctx.y -= BLOCK_GAP;
      const block = content.bloques[i];
      const next = content.bloques[i + 1];
      if (isHalfBox(block) && isHalfBox(next)) {
        drawBoxPair(ctx, block, next);
        i += 1;
      } else {
        drawBlock(ctx, block);
      }
    }
  }

  drawFooters(ctx, input.articleUrl);
  return { bytes: await doc.save(), pageCount: ctx.pages.length, overflowPages: ctx.overflowPages };
}
