// Plantilla del correo de confirmación de canje de Club 57 — función pura
// (arma {subject, html}, no envía nada), mismo criterio que
// lib/email/orderEmails.ts para los correos de Pedidos. Reutiliza su
// envoltura visual (renderEmailLayout) y su escape de HTML en vez de
// duplicarlos: es el mismo layout de marca en los dos módulos de correo.
import { STORE_ADDRESS, STORE_HORARIO, STORE_WHATSAPP_PHONE } from "@/lib/store-info";
import {
  COLOR_BLACK,
  COLOR_GRAY,
  COLOR_ORANGE,
  COLOR_SLATE,
  escapeHtml,
  renderEmailLayout,
} from "./orderEmails";

export interface RedemptionRequestedEmailData {
  customerName: string;
  itemName: string;
  pointsUsed: number;
}

// Se manda apenas el cliente SOLICITA el canje (no cuando se entrega en
// tienda) — mismo momento en que request_club57_redemption() ya descontó
// el stock y los puntos, ver supabase/migrations/20260924010000. Nunca
// incluye la contraseña ni ningún otro dato sensible, solo lo que el
// cliente necesita para ir a recogerlo.
export function buildRedemptionRequestedEmail(data: RedemptionRequestedEmailData): { subject: string; html: string } {
  const firstName = data.customerName.split(" ")[0] || data.customerName;

  const body = `
    <h1 style="margin:0 0 4px; font-size:18px; color:${COLOR_BLACK};">¡Listo, ${escapeHtml(firstName)}!</h1>
    <p style="margin:0 0 16px; font-size:14px; color:${COLOR_SLATE};">
      Tu canje de Club 57 — <strong>${escapeHtml(data.itemName)}</strong> — quedó registrado.
    </p>

    <div style="margin:0 0 20px; padding:14px 16px; background-color:${COLOR_GRAY}; border-radius:8px; border-left:4px solid ${COLOR_ORANGE};">
      <p style="margin:0; font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:${COLOR_SLATE};">
        Puntos usados
      </p>
      <p style="margin:6px 0 0; font-size:15px; font-weight:bold; color:${COLOR_BLACK};">
        ${data.pointsUsed} pts
      </p>
    </div>

    <h2 style="margin:0 0 8px; font-size:15px; color:${COLOR_BLACK};">Pasa a recogerlo a la tienda</h2>
    <p style="margin:4px 0 0; font-size:14px; color:${COLOR_BLACK};">${escapeHtml(STORE_ADDRESS)}</p>
    <p style="margin:4px 0 0; font-size:13px; color:${COLOR_SLATE};">
      ${STORE_HORARIO.map(escapeHtml).join("<br>")}
    </p>

    <p style="margin:24px 0 0; font-size:14px; color:${COLOR_BLACK};">
      Muestra este correo o da tu nombre en mostrador para recogerlo. Si tienes alguna duda, escríbenos por
      <a href="https://wa.me/${STORE_WHATSAPP_PHONE}" style="color:${COLOR_BLACK}; font-weight:bold;">WhatsApp</a>.
    </p>
  `;

  return {
    subject: `Club 57: tu canje de ${data.itemName} está listo para recoger`,
    html: renderEmailLayout(body),
  };
}

export interface RedemptionRequestedInternalEmailData {
  customerName: string;
  customerEmail: string;
  itemName: string;
  pointsUsed: number;
}

// Correo interno — mismo momento y mismos datos que el de confirmación al
// cliente (buildRedemptionRequestedEmail), pero dirigido al negocio para
// que sepa qué artículo preparar y a nombre de quién, ver
// getBusinessNotificationRecipients().
export function buildRedemptionRequestedInternalEmail(
  data: RedemptionRequestedInternalEmailData
): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 16px; font-size:18px; color:${COLOR_BLACK};">Nuevo canje de Club 57</h1>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_SLATE};">Cliente</td>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_BLACK}; text-align:right; font-weight:bold;">${escapeHtml(data.customerName)}</td>
      </tr>
      <tr>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_SLATE};">Correo</td>
        <td style="padding:2px 0; font-size:14px; color:${COLOR_BLACK}; text-align:right;">${escapeHtml(data.customerEmail)}</td>
      </tr>
    </table>

    <div style="margin:0 0 20px; padding:14px 16px; background-color:${COLOR_GRAY}; border-radius:8px; border-left:4px solid ${COLOR_ORANGE};">
      <p style="margin:0; font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:${COLOR_SLATE};">
        Artículo a preparar
      </p>
      <p style="margin:6px 0 0; font-size:15px; font-weight:bold; color:${COLOR_BLACK};">
        ${escapeHtml(data.itemName)}
      </p>
      <p style="margin:6px 0 0; font-size:13px; color:${COLOR_SLATE};">
        ${data.pointsUsed} pts usados
      </p>
    </div>

    <p style="margin:0; font-size:14px; color:${COLOR_BLACK};">
      El cliente pasa a recogerlo a la tienda — ver el canje en <strong>/admin/lealtad/canjes</strong>.
    </p>
  `;

  return {
    subject: `Nuevo canje Club 57: ${data.itemName}`,
    html: renderEmailLayout(body),
  };
}
