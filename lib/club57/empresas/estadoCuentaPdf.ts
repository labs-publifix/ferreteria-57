import { PDFDocument, rgb, type PDFPage } from "pdf-lib";
import { STORE_ADDRESS, STORE_PHONE_DISPLAY } from "@/lib/store-info";
import { BRAND_PDF, embedBrandFonts, wrapText } from "@/lib/club57/promociones/liquidaciones/renderPdf";
import { LOGO_NARANJA_PNG } from "@/lib/club57/promociones/liquidaciones/pdfAssets";
import {
  agruparPorEmpleado,
  ESTADO_CICLO_LABEL,
  fechaCorta,
  periodoLabel,
  totalEnvios,
  type CicloLinea,
  type EstadoCiclo,
} from "./cortes";

// Estado de cuenta de Club 57 Empresarial con la identidad de Ferretería 57
// (mismos tokens que el resto de los PDF): pedidos por empleado, saldos a
// favor y total del corte. Tamaño carta.

const { ORANGE, SLATE, BLACK, GRAY, WHITE } = BRAND_PDF;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_HEIGHT = 50;
const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const fechaHora = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Mexico_City" });

export interface EstadoCuentaInput {
  empresa: { nombre_comercial: string; razon_social: string; rfc: string | null };
  ciclo: {
    periodo_inicio: string;
    periodo_fin: string;
    estado: EstadoCiclo;
    factura_folio: string | null;
    factura_fecha: string | null;
    pago_vence: string | null;
    pago_fecha: string | null;
  };
  lineas: CicloLinea[];
  total: number;
}

const COLS = [
  { label: "PEDIDO", width: 110, align: "left" as const },
  { label: "FECHA", width: 100, align: "left" as const },
  { label: "PRODUCTOS", width: 222, align: "left" as const },
  { label: "IMPORTE", width: 100, align: "right" as const },
];

export async function renderEstadoCuentaPdf(input: EstadoCuentaInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await embedBrandFonts(doc);
  const logo = await doc.embedPng(Buffer.from(LOGO_NARANJA_PNG, "base64"));
  const periodo = periodoLabel(input.ciclo.periodo_inicio, input.ciclo.periodo_fin);
  doc.setTitle(`Estado de cuenta ${periodo} — ${input.empresa.nombre_comercial}`);
  doc.setAuthor("Ferretería 57");
  doc.setCreator("Ferretería 57 — Club 57 Empresarial");
  doc.setProducer("Ferretería 57");

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = 0;

  const text = (t: string, x: number, yy: number, opts: { size?: number; bold?: boolean; display?: boolean; color?: ReturnType<typeof rgb> } = {}) =>
    page.drawText(t, {
      x,
      y: yy,
      size: opts.size ?? 9.5,
      font: opts.display ? fonts.display : opts.bold ? fonts.bold : fonts.regular,
      color: opts.color ?? BLACK,
    });
  const right = (t: string, xRight: number, yy: number, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {}) => {
    const font = opts.bold ? fonts.bold : fonts.regular;
    const size = opts.size ?? 9.5;
    text(t, xRight - font.widthOfTextAtSize(t, size), yy, opts);
  };

  const header = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    y = PAGE_HEIGHT - MARGIN;
    const logoWidth = 120;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    page.drawImage(logo, { x: MARGIN, y: y - logoHeight, width: logoWidth, height: logoHeight });
    page.drawText("ESTADO DE CUENTA", {
      x: PAGE_WIDTH - MARGIN - fonts.display.widthOfTextAtSize("ESTADO DE CUENTA", 16),
      y: y - 16,
      size: 16,
      font: fonts.display,
      color: SLATE,
    });
    right("Club 57 Empresarial", PAGE_WIDTH - MARGIN, y - 30, { size: 9, color: SLATE });
    y -= Math.max(logoHeight, 36) + 10;
    page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_WIDTH, height: 4, color: ORANGE });
    y -= 14;
  };

  const tableHeader = () => {
    const h = 20;
    page.drawRectangle({ x: MARGIN, y: y - h, width: CONTENT_WIDTH, height: h, color: SLATE });
    let x = MARGIN;
    for (const c of COLS) {
      const w = fonts.display.widthOfTextAtSize(c.label, 8);
      page.drawText(c.label, {
        x: c.align === "right" ? x + c.width - 8 - w : x + 8,
        y: y - h + 7,
        size: 8,
        font: fonts.display,
        color: WHITE,
      });
      x += c.width;
    }
    y -= h;
  };

  const ensure = (needed: number, withTable = true) => {
    if (y - needed < MARGIN + FOOTER_HEIGHT) {
      header();
      if (withTable) tableHeader();
    }
  };

  // ---- Encabezado de la primera página ----
  header();
  text(input.empresa.nombre_comercial, MARGIN, y - 4, { size: 13, bold: true });
  text(`${input.empresa.razon_social}${input.empresa.rfc ? ` · RFC ${input.empresa.rfc}` : ""}`, MARGIN, y - 18, { size: 9, color: SLATE });
  right(`Periodo: ${periodo}`, PAGE_WIDTH - MARGIN, y - 4, { size: 10, bold: true });
  right(`Estado: ${ESTADO_CICLO_LABEL[input.ciclo.estado]}`, PAGE_WIDTH - MARGIN, y - 18, { size: 9, color: SLATE });
  y -= 34;

  const empleados = agruparPorEmpleado(input.lineas);
  const ajustes = input.lineas.filter((l) => l.tipo === "ajuste");
  const pedidos = input.lineas.filter((l) => l.tipo === "pedido");

  // Banda de resumen
  const bandH = 46;
  page.drawRectangle({ x: MARGIN, y: y - bandH, width: CONTENT_WIDTH, height: bandH, color: GRAY });
  const resumen: [string, string][] = [
    ["Pedidos", String(pedidos.length)],
    ["Colaboradores", String(empleados.length)],
    ["Envíos incluidos", money.format(totalEnvios(input.lineas))],
    ["Total del corte", money.format(input.total)],
  ];
  resumen.forEach(([label, valor], i) => {
    const x = MARGIN + 12 + i * (CONTENT_WIDTH / 4);
    text(label, x, y - 16, { size: 8, color: SLATE });
    text(valor, x, y - 33, { size: i === 3 ? 13 : 11, bold: true });
  });
  y -= bandH + 8;

  const facturaInfo = [
    input.ciclo.factura_folio ? `Factura ${input.ciclo.factura_folio}${input.ciclo.factura_fecha ? ` del ${fechaCorta(input.ciclo.factura_fecha)}` : ""}` : null,
    input.ciclo.pago_vence && input.ciclo.estado !== "pagado" ? `Fecha límite de pago: ${fechaCorta(input.ciclo.pago_vence)}` : null,
    input.ciclo.pago_fecha ? `Pagado el ${fechaCorta(input.ciclo.pago_fecha)}` : null,
  ].filter(Boolean) as string[];
  if (facturaInfo.length) {
    text(facturaInfo.join("   ·   "), MARGIN, y - 4, { size: 9, color: SLATE });
    y -= 16;
  }
  y -= 6;

  // ---- Pedidos por empleado ----
  tableHeader();
  const lineH = 11.5;
  for (const e of empleados) {
    ensure(22 + lineH * 2);
    const eh = 20;
    page.drawRectangle({ x: MARGIN, y: y - eh, width: CONTENT_WIDTH, height: eh, color: rgb(1, 0.94, 0.88) });
    text(`${e.nombre}${e.numero ? `  ·  núm. ${e.numero}` : ""}`, MARGIN + 8, y - eh + 7, { size: 9.5, bold: true });
    right(money.format(e.total), MARGIN + CONTENT_WIDTH - 8, y - eh + 7, { size: 9.5, bold: true });
    y -= eh;

    for (const p of e.pedidos) {
      const descripcion = p.items
        .map((i) => `${i.quantity}× ${i.product_name}${i.variant_label && i.variant_label !== "Único" ? ` (${i.variant_label})` : ""}`)
        .join(", ") + ((p.shipping_cost ?? 0) > 0 ? ` · envío ${money.format(p.shipping_cost ?? 0)}` : "");
      const lineas = wrapText(descripcion, fonts.regular, 8.5, COLS[2].width - 16);
      const rowH = Math.max(lineas.length * lineH, lineH) + 8;
      ensure(rowH);
      let x = MARGIN;
      const base = y - 4 - 8.5;
      const cancelado = p.status === "cancelado";
      text((p.order_number ?? "") + (cancelado ? " *" : ""), x + 8, base, { size: 8.5 });
      x += COLS[0].width;
      text(fechaHora.format(new Date(p.fecha)).replace(/\./g, ""), x + 8, base, { size: 8.5, color: SLATE });
      x += COLS[1].width;
      lineas.forEach((l, i) => text(l, x + 8, base - i * lineH, { size: 8.5 }));
      right(money.format(p.total), MARGIN + CONTENT_WIDTH - 8, base, { size: 8.5 });
      y -= rowH;
      page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_WIDTH, y }, thickness: 0.4, color: rgb(0.85, 0.85, 0.83) });
    }
  }

  // ---- Saldos a favor ----
  if (ajustes.length) {
    ensure(40, false);
    y -= 12;
    text("SALDOS A FAVOR", MARGIN, y - 4, { size: 9, display: true, color: SLATE });
    y -= 16;
    for (const a of ajustes) {
      const lineas = wrapText(a.concepto ?? "Ajuste", fonts.regular, 9, CONTENT_WIDTH - 140);
      const rowH = lineas.length * lineH + 6;
      ensure(rowH, false);
      lineas.forEach((l, i) => text(l, MARGIN + 8, y - 12 - i * lineH, { size: 9 }));
      right(money.format(a.total), MARGIN + CONTENT_WIDTH - 8, y - 12, { size: 9 });
      y -= rowH;
    }
  }

  // ---- Total ----
  ensure(40, false);
  y -= 10;
  page.drawRectangle({ x: MARGIN, y: y - 28, width: CONTENT_WIDTH, height: 28, color: SLATE });
  text("TOTAL DEL CORTE", MARGIN + 12, y - 18, { size: 10, display: true, color: WHITE });
  right(money.format(input.total), MARGIN + CONTENT_WIDTH - 12, y - 19, { size: 13, bold: true, color: WHITE });
  y -= 40;
  if (pedidos.some((p) => p.status === "cancelado")) {
    ensure(16, false);
    text("* Cancelado después de facturar: se refleja como saldo a favor en el siguiente corte.", MARGIN, y - 4, { size: 8, color: SLATE });
    y -= 14;
  }

  // ---- Pie ----
  pages.forEach((p, i) => {
    p.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: FOOTER_HEIGHT - 10, color: SLATE });
    p.drawText(`Ferretería 57 · ${STORE_ADDRESS}`, { x: MARGIN, y: 22, size: 7.5, font: fonts.regular, color: WHITE });
    p.drawText(`Tel. ${STORE_PHONE_DISPLAY} · Club 57 Empresarial`, { x: MARGIN, y: 11, size: 7.5, font: fonts.regular, color: WHITE });
    const label = `Página ${i + 1} de ${pages.length}`;
    p.drawText(label, { x: PAGE_WIDTH - MARGIN - fonts.regular.widthOfTextAtSize(label, 8), y: 22, size: 8, font: fonts.regular, color: WHITE });
  });

  return doc.save();
}
