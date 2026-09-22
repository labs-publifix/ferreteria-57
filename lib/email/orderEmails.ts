// Plantillas de los dos correos transaccionales de pedidos — funciones
// puras (arman {subject, html}, no envían nada) para poder revisarlas o
// probarlas sin tocar Resend, mismo criterio que el resto de builders
// puros del proyecto (ver lib/checkout/whatsapp.ts).
import { formatPrice } from "@/lib/formatPrice";
import { FULFILLMENT_TYPE_LABEL, type FulfillmentType } from "@/lib/orders/status";
import {
  STORE_ADDRESS,
  STORE_FACEBOOK_URL,
  STORE_HORARIO,
  STORE_INSTAGRAM_URL,
  STORE_PHONE_DISPLAY,
  STORE_WHATSAPP_PHONE,
} from "@/lib/store-info";
import { LOCAL_SHIPPING_BUSINESS_DAYS, FORANEO_SHIPPING_BUSINESS_DAYS } from "@/lib/checkout/constants";
import { computePickupReadyTime, computeShippingEta, formatEtaDate, formatReadyAt } from "@/lib/checkout/fulfillmentTiming";
import { LOGO_NARANJA_BASE64 } from "./logoBase64";

// Paleta oficial del manual de marca (brand/Manual de Marca Ferretería
// 57.pdf, sección 03) — mismos valores que tailwind.config.ts, repetidos
// aquí como hex literal porque un correo no puede depender de clases de
// Tailwind ni de CSS externo, solo de estilos inline.
export const COLOR_ORANGE = "#FF6600";
export const COLOR_SLATE = "#3F515A";
export const COLOR_BLACK = "#1A1A1A";
export const COLOR_GRAY = "#F2F1EF";
export const COLOR_WHITE = "#FFFFFF";

export interface OrderEmailItem {
  productName: string;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
}

export interface OrderEmailAddress {
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  postalCode: string;
  city: string;
  state: string;
  references: string;
  /** Solo viene poblado en foráneo — en local_delivery la colonia vive en
   *  OrderEmailData.colonia (normalizada, puede ser "No listada"), no aquí. */
  colonia?: string;
}

export interface OrderEmailData {
  orderNumber: string;
  /** ISO — momento real de creación del pedido, base del cálculo de
   *  listo-para-recoger / fecha límite de entrega (mismas reglas que
   *  ConfirmationView.tsx en la página de confirmación). */
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  fulfillmentType: FulfillmentType;
  /** Solo tiene valor en local_delivery. */
  colonia: string | null;
  /** null en pickup. */
  shippingAddress: OrderEmailAddress | null;
  items: OrderEmailItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
}

// Contenido de usuario (nombre, dirección) va siempre a través de esto
// antes de insertarse en el HTML del correo — nunca se confía en que un
// nombre o una referencia de entrega no traigan caracteres que rompan el
// markup.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatAddress(address: OrderEmailAddress): string {
  const interior = address.interiorNumber ? `, int. ${escapeHtml(address.interiorNumber)}` : "";
  return [
    `${escapeHtml(address.street)} ${escapeHtml(address.exteriorNumber)}${interior}`,
    `${escapeHtml(address.city)}, ${escapeHtml(address.state)} — C.P. ${escapeHtml(address.postalCode)}`,
    `Referencias: ${escapeHtml(address.references)}`,
  ].join("<br>");
}

// Envoltura visual compartida por los dos correos — logo real + paleta del
// manual de marca. Encabezado en blanco con el logo naranja (mismo
// tratamiento que el header del sitio, ver components/layout/Header.tsx:
// fondo blanco, logo naranja) y una barra de acento naranja delgada
// debajo — el naranja es acento, nunca fondo extenso (regla del manual de
// marca, ya documentada en tailwind.config.ts). El pie usa el mismo
// gris-pizarra que el footer del sitio (components/layout/Footer.tsx).
// HTML de correo real (tablas + estilos inline): los clientes de correo no
// respetan hojas de estilo externas ni la mayoría de CSS moderno.
export function renderEmailLayout(bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:0; background-color:${COLOR_GRAY}; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR_GRAY}; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px; background-color:${COLOR_WHITE}; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="background-color:${COLOR_WHITE}; padding:24px 28px 20px; text-align:center;">
                <img
                  src="data:image/png;base64,${LOGO_NARANJA_BASE64}"
                  width="164"
                  alt="Ferretería 57"
                  style="display:inline-block; width:164px; height:auto; border:0;"
                />
              </td>
            </tr>
            <tr>
              <td style="background-color:${COLOR_ORANGE}; height:4px; line-height:4px; font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background-color:${COLOR_SLATE}; padding:18px 28px; font-size:12px; color:${COLOR_WHITE};">
                <span style="opacity:0.85;">Ferretería 57 — ${escapeHtml(STORE_ADDRESS)}<br>
                Tel. ${escapeHtml(STORE_PHONE_DISPLAY)}</span>
                <p style="margin:10px 0 0; font-size:12px;">
                  <a href="${STORE_FACEBOOK_URL}" style="color:${COLOR_WHITE}; text-decoration:underline;">Facebook</a>
                  <span style="opacity:0.6;">&nbsp;·&nbsp;</span>
                  <a href="${STORE_INSTAGRAM_URL}" style="color:${COLOR_WHITE}; text-decoration:underline;">Instagram</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderItemsTable(items: OrderEmailItem[]): string {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0; border-bottom:1px solid ${COLOR_GRAY}; font-size:14px; color:${COLOR_BLACK};">
            ${item.quantity}× ${escapeHtml(item.productName)}${item.variantLabel ? ` (${escapeHtml(item.variantLabel)})` : ""}
          </td>
          <td style="padding:8px 0; border-bottom:1px solid ${COLOR_GRAY}; font-size:14px; color:${COLOR_BLACK}; text-align:right; white-space:nowrap;">
            ${formatPrice(item.unitPrice * item.quantity)}
          </td>
        </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

// Mismo cálculo que ConfirmationView.tsx (getFulfillmentMessage) usa en la
// página de confirmación — la redacción vive aquí, no en
// fulfillmentTiming.ts, porque esa utilidad solo calcula fechas/horas
// (ver comentario ahí). "internal" y "customer" comparten la MISMA fecha
// (nunca deben desalinearse), solo cambia la persona gramatical: al
// equipo se le dice qué debe pasar, al cliente qué le va a pasar a él.
function getFulfillmentTimingMessage(
  fulfillmentType: FulfillmentType,
  createdAt: string,
  audience: "internal" | "customer"
): string {
  const orderTime = new Date(createdAt);

  if (fulfillmentType === "pickup") {
    const readyAt = computePickupReadyTime(orderTime);
    return audience === "customer"
      ? `Tu pedido estará listo para recoger a partir del ${formatReadyAt(readyAt)}.`
      : `Debe estar listo para recoger a partir del ${formatReadyAt(readyAt)}.`;
  }

  if (fulfillmentType === "local_delivery") {
    const eta = computeShippingEta(orderTime, LOCAL_SHIPPING_BUSINESS_DAYS);
    return audience === "customer"
      ? `Recibe tu pedido en un plazo no mayor a ${LOCAL_SHIPPING_BUSINESS_DAYS} días hábiles — llega a más tardar el ${formatEtaDate(eta)}.`
      : `Debe entregarse a más tardar el ${formatEtaDate(eta)} (máximo ${LOCAL_SHIPPING_BUSINESS_DAYS} días hábiles).`;
  }

  const eta = computeShippingEta(orderTime, FORANEO_SHIPPING_BUSINESS_DAYS);
  return audience === "customer"
    ? `Tu pedido llegará a más tardar el ${formatEtaDate(eta)}.`
    : `Debe entregarse a más tardar el ${formatEtaDate(eta)}.`;
}

// Banner prominente justo debajo del saludo/folio en los dos correos —
// pedido explícito: debe quedar MUY claro de qué modalidad se trata (no
// enterrado en una tabla) y siempre acompañado de la fecha/hora que
// corresponde a esa modalidad. Mismo bloque en ambos correos, solo cambia
// el texto de tiempos según audience (ver getFulfillmentTimingMessage).
function renderFulfillmentBanner(data: OrderEmailData, audience: "internal" | "customer"): string {
  const timingMessage = getFulfillmentTimingMessage(data.fulfillmentType, data.createdAt, audience);
  return `
    <div style="margin:0 0 20px; padding:14px 16px; background-color:${COLOR_GRAY}; border-radius:8px; border-left:4px solid ${COLOR_ORANGE};">
      <p style="margin:0; font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:${COLOR_SLATE};">
        ${escapeHtml(FULFILLMENT_TYPE_LABEL[data.fulfillmentType])}
      </p>
      <p style="margin:6px 0 0; font-size:15px; font-weight:bold; color:${COLOR_BLACK};">
        ${escapeHtml(timingMessage)}
      </p>
    </div>`;
}

// Colonia/dirección (o la dirección de la tienda, en pickup) — detalle de
// apoyo que va DEBAJO del banner de arriba, nunca reemplazándolo.
function renderFulfillmentDetail(data: OrderEmailData): string {
  if (data.fulfillmentType === "pickup") {
    return `
      <p style="margin:4px 0 0; font-size:14px; color:${COLOR_BLACK};">
        Retiro en tienda — ${escapeHtml(STORE_ADDRESS)}
      </p>
      <p style="margin:4px 0 0; font-size:13px; color:${COLOR_SLATE};">
        ${STORE_HORARIO.map(escapeHtml).join("<br>")}
      </p>`;
  }

  // local_delivery guarda su colonia (ya normalizada, puede ser "No
  // listada") en data.colonia; foráneo no tiene ese campo a nivel de
  // pedido — la suya vive dentro de shippingAddress.colonia, tal cual la
  // escribió el cliente en su formulario de dirección.
  const colonia = data.fulfillmentType === "local_delivery" ? data.colonia : data.shippingAddress?.colonia;
  const coloniaLine = colonia
    ? `<p style="margin:4px 0 0; font-size:14px; color:${COLOR_BLACK}; font-weight:bold;">Colonia: ${escapeHtml(colonia)}</p>`
    : "";

  return `
    ${coloniaLine}
    ${data.shippingAddress ? `<p style="margin:4px 0 0; font-size:14px; color:${COLOR_BLACK};">${formatAddress(data.shippingAddress)}</p>` : ""}`;
}

// Correo interno — a ferreteria57@proton.me (o a EMAIL_OVERRIDE mientras
// el dominio no esté verificado). Todo lo operativo para que el equipo
// sepa qué preparar y a quién entregárselo, sin adornos.
export function buildInternalNotificationEmail(data: OrderEmailData): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 16px; font-size:18px; color:${COLOR_BLACK};">Nuevo pedido ${escapeHtml(data.orderNumber)}</h1>

    ${renderFulfillmentBanner(data, "internal")}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_SLATE};">Cliente</td>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_BLACK}; text-align:right; font-weight:bold;">${escapeHtml(data.customerName)}</td>
      </tr>
      <tr>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_SLATE};">Teléfono</td>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_BLACK}; text-align:right;">${escapeHtml(data.customerPhone)}</td>
      </tr>
    </table>

    <div style="margin-bottom:16px;">${renderFulfillmentDetail(data)}</div>

    <h2 style="margin:0 0 8px; font-size:15px; color:${COLOR_BLACK};">Productos</h2>
    ${renderItemsTable(data.items)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px; border-top:2px solid ${COLOR_SLATE};">
      <tr>
        <td style="padding:8px 0 0; font-size:15px; color:${COLOR_BLACK}; font-weight:bold;">Total</td>
        <td style="padding:8px 0 0; font-size:15px; color:${COLOR_BLACK}; font-weight:bold; text-align:right;">${formatPrice(data.total)}</td>
      </tr>
    </table>
  `;

  return { subject: `Nuevo pedido ${data.orderNumber}`, html: renderEmailLayout(body) };
}

// Correo al cliente — tono directo y cercano, nada de "estimado cliente".
export function buildCustomerConfirmationEmail(data: OrderEmailData): { subject: string; html: string } {
  const firstName = data.customerName.split(" ")[0] || data.customerName;

  const body = `
    <h1 style="margin:0 0 4px; font-size:18px; color:${COLOR_BLACK};">¡Gracias por tu compra, ${escapeHtml(firstName)}!</h1>
    <p style="margin:0 0 16px; font-size:14px; color:${COLOR_SLATE};">
      Tu pedido <strong>${escapeHtml(data.orderNumber)}</strong> ya quedó registrado.
    </p>

    ${renderFulfillmentBanner(data, "customer")}

    <h2 style="margin:0 0 8px; font-size:15px; color:${COLOR_BLACK};">Tu pedido</h2>
    ${renderItemsTable(data.items)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr>
        <td style="padding:4px 0; font-size:14px; color:${COLOR_SLATE};">Subtotal</td>
        <td style="padding:4px 0; font-size:14px; color:${COLOR_BLACK}; text-align:right;">${formatPrice(data.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0; font-size:14px; color:${COLOR_SLATE};">Envío</td>
        <td style="padding:4px 0; font-size:14px; color:${COLOR_BLACK}; text-align:right;">${
          data.shippingCost === 0 ? "Gratis" : formatPrice(data.shippingCost)
        }</td>
      </tr>
      <tr>
        <td style="padding:8px 0 0; font-size:16px; color:${COLOR_BLACK}; font-weight:bold; border-top:2px solid ${COLOR_SLATE};">Total pagado</td>
        <td style="padding:8px 0 0; font-size:16px; color:${COLOR_BLACK}; font-weight:bold; text-align:right; border-top:2px solid ${COLOR_SLATE};">${formatPrice(data.total)}</td>
      </tr>
    </table>

    <h2 style="margin:24px 0 8px; font-size:15px; color:${COLOR_BLACK};">Detalles de tu entrega</h2>
    ${renderFulfillmentDetail(data)}

    <p style="margin:24px 0 0; font-size:14px; color:${COLOR_BLACK};">
      Guarda este correo como tu comprobante de compra. Si tienes alguna duda sobre tu pedido, escríbenos por
      <a href="https://wa.me/${STORE_WHATSAPP_PHONE}" style="color:${COLOR_BLACK}; font-weight:bold;">WhatsApp</a>
      o responde directo a este correo.
    </p>
  `;

  return { subject: `Tu pedido ${data.orderNumber} está confirmado — Ferretería 57`, html: renderEmailLayout(body) };
}
