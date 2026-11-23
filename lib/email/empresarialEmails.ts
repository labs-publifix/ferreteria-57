// Correos de Club 57 Empresarial — funciones puras (arman {subject, html},
// no envían nada), con la misma envoltura de marca que el resto de los
// correos (renderEmailLayout).
import { STORE_WHATSAPP_PHONE } from "@/lib/store-info";
import { COLOR_BLACK, COLOR_GRAY, COLOR_ORANGE, COLOR_SLATE, escapeHtml, renderEmailLayout } from "./orderEmails";

export interface SolicitudEmpresaEmailData {
  nombreComercial: string;
  razonSocial: string;
  rfc: string | null;
  numEmpleados: number | null;
  responsableNombre: string;
  responsableCorreo: string;
  responsableTelefono: string | null;
}

function fila(label: string, value: string | null | number) {
  return `
      <tr>
        <td style="padding:3px 0; font-size:14px; color:${COLOR_SLATE};">${escapeHtml(label)}</td>
        <td style="padding:3px 0; font-size:14px; color:${COLOR_BLACK}; text-align:right; font-weight:bold;">${escapeHtml(String(value ?? "—"))}</td>
      </tr>`;
}

/** Aviso interno: llegó una solicitud de afiliación desde el sitio. */
export function buildSolicitudEmpresaInternaEmail(data: SolicitudEmpresaEmailData): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 16px; font-size:18px; color:${COLOR_BLACK};">Nueva solicitud de Club 57 Empresarial</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${fila("Empresa", data.nombreComercial)}
      ${fila("Razón social", data.razonSocial)}
      ${fila("RFC", data.rfc)}
      ${fila("Empleados (aprox.)", data.numEmpleados)}
      ${fila("Responsable", data.responsableNombre)}
      ${fila("Correo", data.responsableCorreo)}
      ${fila("Teléfono", data.responsableTelefono)}
    </table>
    <p style="margin:0; font-size:14px; color:${COLOR_BLACK};">
      Revísala y define su convenio en <strong>Admin → Club 57 → Empresas</strong>.
    </p>
  `;
  return {
    subject: `Solicitud Club 57 Empresarial: ${data.nombreComercial}`,
    html: renderEmailLayout(body),
  };
}

/** Confirmación a la empresa: su solicitud está en revisión. */
export function buildSolicitudEmpresaRecibidaEmail(data: SolicitudEmpresaEmailData): { subject: string; html: string } {
  const firstName = data.responsableNombre.split(" ")[0] || data.responsableNombre;
  const body = `
    <h1 style="margin:0 0 4px; font-size:18px; color:${COLOR_BLACK};">Hola, ${escapeHtml(firstName)}</h1>
    <p style="margin:0 0 16px; font-size:14px; color:${COLOR_SLATE};">
      Recibimos la solicitud de <strong>${escapeHtml(data.nombreComercial)}</strong> para unirse a Club 57 Empresarial.
    </p>
    <div style="margin:0 0 20px; padding:14px 16px; background-color:${COLOR_GRAY}; border-radius:8px; border-left:4px solid ${COLOR_ORANGE};">
      <p style="margin:0; font-size:14px; color:${COLOR_BLACK};">
        Nuestro equipo la revisará y se pondrá en contacto contigo para acordar las condiciones del convenio.
        Cuando quede activa, recibirás el código de tu empresa y tu acceso al portal.
      </p>
    </div>
    <p style="margin:0; font-size:14px; color:${COLOR_BLACK};">
      ¿Dudas? Escríbenos por
      <a href="https://wa.me/${STORE_WHATSAPP_PHONE}" style="color:${COLOR_BLACK}; font-weight:bold;">WhatsApp</a>.
    </p>
  `;
  return {
    subject: "Club 57 Empresarial: recibimos tu solicitud",
    html: renderEmailLayout(body),
  };
}
