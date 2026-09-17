// Plantillas de los dos correos transaccionales de pedidos — funciones
// puras (arman {subject, html}, no envían nada) para poder revisarlas o
// probarlas sin tocar Resend, mismo criterio que el resto de builders
// puros del proyecto (ver lib/checkout/whatsapp.ts).
import { formatPrice } from "@/lib/formatPrice";
import { FULFILLMENT_TYPE_LABEL, type FulfillmentType } from "@/lib/orders/status";
import { STORE_ADDRESS, STORE_HORARIO, STORE_PHONE_DISPLAY } from "@/lib/store-info";
import { LOGO_NARANJA_BASE64 } from "./logoBase64";

// Paleta oficial del manual de marca (brand/Manual de Marca Ferretería
// 57.pdf, sección 03) — mismos valores que tailwind.config.ts, repetidos
// aquí como hex literal porque un correo no puede depender de clases de
// Tailwind ni de CSS externo, solo de estilos inline.
const COLOR_ORANGE = "#FF6600";
const COLOR_SLATE = "#3F515A";
const COLOR_BLACK = "#1A1A1A";
const COLOR_GRAY = "#F2F1EF";
const COLOR_WHITE = "#FFFFFF";

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
}

export interface OrderEmailData {
  orderNumber: string;
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
function escapeHtml(value: string): string {
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
function renderEmailLayout(bodyHtml: string): string {
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

// "Envío local: Centro" / "Retiro en tienda" / "Envío foráneo" — mismo
// texto en ambos correos para que el equipo y el cliente vean la misma
// descripción de la modalidad elegida.
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

  const coloniaLine =
    data.fulfillmentType === "local_delivery" && data.colonia
      ? `<p style="margin:4px 0 0; font-size:14px; color:${COLOR_BLACK}; font-weight:bold;">Colonia: ${escapeHtml(data.colonia)}</p>`
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

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_SLATE};">Cliente</td>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_BLACK}; text-align:right; font-weight:bold;">${escapeHtml(data.customerName)}</td>
      </tr>
      <tr>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_SLATE};">Teléfono</td>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_BLACK}; text-align:right;">${escapeHtml(data.customerPhone)}</td>
      </tr>
      <tr>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_SLATE};">Entrega</td>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_BLACK}; text-align:right;">${escapeHtml(FULFILLMENT_TYPE_LABEL[data.fulfillmentType])}</td>
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
    <p style="margin:0 0 20px; font-size:14px; color:${COLOR_SLATE};">
      Tu pedido <strong>${escapeHtml(data.orderNumber)}</strong> ya quedó registrado.
    </p>

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

    <h2 style="margin:24px 0 8px; font-size:15px; color:${COLOR_BLACK};">${escapeHtml(FULFILLMENT_TYPE_LABEL[data.fulfillmentType])}</h2>
    ${renderFulfillmentDetail(data)}

    <p style="margin:24px 0 0; font-size:14px; color:${COLOR_BLACK};">
      Nuestro equipo se pondrá en contacto contigo para los siguientes pasos. Cualquier duda, respóndenos
      directo a este correo o escríbenos por WhatsApp.
    </p>
  `;

  return { subject: `Tu pedido ${data.orderNumber} está confirmado — Ferretería 57`, html: renderEmailLayout(body) };
}
