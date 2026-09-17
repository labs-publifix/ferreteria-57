// Plantillas de los dos correos transaccionales de pedidos — funciones
// puras (arman {subject, html}, no envían nada) para poder revisarlas o
// probarlas sin tocar Resend, mismo criterio que el resto de builders
// puros del proyecto (ver lib/checkout/whatsapp.ts).
import { formatPrice } from "@/lib/formatPrice";
import { FULFILLMENT_TYPE_LABEL, type FulfillmentType } from "@/lib/orders/status";
import { STORE_ADDRESS, STORE_HORARIO, STORE_PHONE_DISPLAY } from "@/lib/store-info";

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

// Envoltura visual compartida por los dos correos — encabezado con la
// marca, cuerpo libre, pie con los datos de contacto de la tienda. HTML de
// correo real (tablas + estilos inline): los clientes de correo no
// respetan hojas de estilo externas ni la mayoría de CSS moderno.
function renderEmailLayout(bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:0; background-color:#F2F1EF; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F1EF; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px; background-color:#FFFFFF; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="background-color:#3F515A; padding:20px 28px;">
                <span style="color:#FFFFFF; font-size:20px; font-weight:bold; letter-spacing:0.5px;">FERRETERÍA 57</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background-color:#F2F1EF; padding:18px 28px; font-size:12px; color:#3F515A;">
                Ferretería 57 — ${escapeHtml(STORE_ADDRESS)}<br>
                Tel. ${escapeHtml(STORE_PHONE_DISPLAY)}
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
          <td style="padding:8px 0; border-bottom:1px solid #F2F1EF; font-size:14px; color:#1A1A1A;">
            ${item.quantity}× ${escapeHtml(item.productName)}${item.variantLabel ? ` (${escapeHtml(item.variantLabel)})` : ""}
          </td>
          <td style="padding:8px 0; border-bottom:1px solid #F2F1EF; font-size:14px; color:#1A1A1A; text-align:right; white-space:nowrap;">
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
      <p style="margin:4px 0 0; font-size:14px; color:#1A1A1A;">
        Retiro en tienda — ${escapeHtml(STORE_ADDRESS)}
      </p>
      <p style="margin:4px 0 0; font-size:13px; color:#3F515A;">
        ${STORE_HORARIO.map(escapeHtml).join("<br>")}
      </p>`;
  }

  const coloniaLine =
    data.fulfillmentType === "local_delivery" && data.colonia
      ? `<p style="margin:4px 0 0; font-size:14px; color:#1A1A1A; font-weight:bold;">Colonia: ${escapeHtml(data.colonia)}</p>`
      : "";

  return `
    ${coloniaLine}
    ${data.shippingAddress ? `<p style="margin:4px 0 0; font-size:14px; color:#1A1A1A;">${formatAddress(data.shippingAddress)}</p>` : ""}`;
}

// Correo interno — a ferreteria57@proton.me (o a EMAIL_OVERRIDE mientras
// el dominio no esté verificado). Todo lo operativo para que el equipo
// sepa qué preparar y a quién entregárselo, sin adornos.
export function buildInternalNotificationEmail(data: OrderEmailData): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 16px; font-size:18px; color:#1A1A1A;">Nuevo pedido ${escapeHtml(data.orderNumber)}</h1>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:2px 0; font-size:14px; color:#3F515A;">Cliente</td>
        <td style="padding:2px 0; font-size:14px; color:#1A1A1A; text-align:right; font-weight:bold;">${escapeHtml(data.customerName)}</td>
      </tr>
      <tr>
        <td style="padding:2px 0; font-size:14px; color:#3F515A;">Teléfono</td>
        <td style="padding:2px 0; font-size:14px; color:#1A1A1A; text-align:right;">${escapeHtml(data.customerPhone)}</td>
      </tr>
      <tr>
        <td style="padding:2px 0; font-size:14px; color:#3F515A;">Entrega</td>
        <td style="padding:2px 0; font-size:14px; color:#1A1A1A; text-align:right;">${escapeHtml(FULFILLMENT_TYPE_LABEL[data.fulfillmentType])}</td>
      </tr>
    </table>

    <div style="margin-bottom:16px;">${renderFulfillmentDetail(data)}</div>

    <h2 style="margin:0 0 8px; font-size:15px; color:#1A1A1A;">Productos</h2>
    ${renderItemsTable(data.items)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px; border-top:2px solid #1A1A1A;">
      <tr>
        <td style="padding:8px 0 0; font-size:15px; color:#1A1A1A; font-weight:bold;">Total</td>
        <td style="padding:8px 0 0; font-size:15px; color:#1A1A1A; font-weight:bold; text-align:right;">${formatPrice(data.total)}</td>
      </tr>
    </table>
  `;

  return { subject: `Nuevo pedido ${data.orderNumber}`, html: renderEmailLayout(body) };
}

// Correo al cliente — tono directo y cercano, nada de "estimado cliente".
export function buildCustomerConfirmationEmail(data: OrderEmailData): { subject: string; html: string } {
  const firstName = data.customerName.split(" ")[0] || data.customerName;

  const body = `
    <h1 style="margin:0 0 4px; font-size:18px; color:#1A1A1A;">¡Gracias por tu compra, ${escapeHtml(firstName)}!</h1>
    <p style="margin:0 0 20px; font-size:14px; color:#3F515A;">
      Tu pedido <strong>${escapeHtml(data.orderNumber)}</strong> ya quedó registrado.
    </p>

    <h2 style="margin:0 0 8px; font-size:15px; color:#1A1A1A;">Tu pedido</h2>
    ${renderItemsTable(data.items)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr>
        <td style="padding:4px 0; font-size:14px; color:#3F515A;">Subtotal</td>
        <td style="padding:4px 0; font-size:14px; color:#1A1A1A; text-align:right;">${formatPrice(data.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0; font-size:14px; color:#3F515A;">Envío</td>
        <td style="padding:4px 0; font-size:14px; color:#1A1A1A; text-align:right;">${
          data.shippingCost === 0 ? "Gratis" : formatPrice(data.shippingCost)
        }</td>
      </tr>
      <tr>
        <td style="padding:8px 0 0; font-size:16px; color:#1A1A1A; font-weight:bold; border-top:2px solid #1A1A1A;">Total pagado</td>
        <td style="padding:8px 0 0; font-size:16px; color:#1A1A1A; font-weight:bold; text-align:right; border-top:2px solid #1A1A1A;">${formatPrice(data.total)}</td>
      </tr>
    </table>

    <h2 style="margin:24px 0 8px; font-size:15px; color:#1A1A1A;">${escapeHtml(FULFILLMENT_TYPE_LABEL[data.fulfillmentType])}</h2>
    ${renderFulfillmentDetail(data)}

    <p style="margin:24px 0 0; font-size:14px; color:#1A1A1A;">
      Nuestro equipo se pondrá en contacto contigo para los siguientes pasos. Cualquier duda, respóndenos
      directo a este correo o escríbenos por WhatsApp.
    </p>
  `;

  return { subject: `Tu pedido ${data.orderNumber} está confirmado — Ferretería 57`, html: renderEmailLayout(body) };
}
