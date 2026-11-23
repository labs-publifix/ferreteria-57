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

function boton(href: string, texto: string) {
  return `
    <p style="margin:20px 0;">
      <a href="${escapeHtml(href)}" style="display:inline-block; padding:12px 22px; background-color:${COLOR_ORANGE}; color:${COLOR_BLACK}; font-weight:bold; font-size:14px; text-decoration:none; border-radius:8px;">${escapeHtml(texto)}</a>
    </p>`;
}

/** Acceso del responsable al Portal Empresa (enlace para crear su contraseña). */
export function buildAccesoResponsableEmail(data: {
  responsableNombre: string;
  empresa: string;
  codigo: string | null;
  enlace: string;
}): { subject: string; html: string } {
  const firstName = data.responsableNombre.split(" ")[0] || data.responsableNombre;
  const codigo = data.codigo
    ? `<div style="margin:0 0 16px; padding:14px 16px; background-color:${COLOR_GRAY}; border-radius:8px; border-left:4px solid ${COLOR_ORANGE};">
        <p style="margin:0; font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:${COLOR_SLATE};">Código de tu empresa</p>
        <p style="margin:6px 0 0; font-size:20px; font-weight:bold; letter-spacing:1px; color:${COLOR_BLACK};">${escapeHtml(data.codigo)}</p>
        <p style="margin:6px 0 0; font-size:13px; color:${COLOR_SLATE};">Compártelo con tus colaboradores para que se registren en Club 57.</p>
      </div>`
    : "";
  const body = `
    <h1 style="margin:0 0 4px; font-size:18px; color:${COLOR_BLACK};">Bienvenido a Club 57 Empresarial, ${escapeHtml(firstName)}</h1>
    <p style="margin:0 0 16px; font-size:14px; color:${COLOR_SLATE};">
      <strong>${escapeHtml(data.empresa)}</strong> ya forma parte del programa. Desde el Portal Empresa apruebas a tus
      colaboradores, defines su línea de crédito y configuras tu nómina.
    </p>
    ${codigo}
    <p style="margin:0; font-size:14px; color:${COLOR_BLACK};">Crea tu contraseña para entrar al portal:</p>
    ${boton(data.enlace, "Crear mi contraseña")}
    <p style="margin:0; font-size:12px; color:${COLOR_SLATE};">
      El enlace vence en unas horas. Si expira, entra a ferreteria57.com/cuenta y usa «¿Olvidaste tu contraseña?» con este correo.
    </p>
  `;
  return { subject: `Tu acceso al Portal Empresa de Club 57 · ${data.empresa}`, html: renderEmailLayout(body) };
}

/** Aviso al responsable: un colaborador pidió vincularse. */
export function buildSolicitudEmpleadoEmail(data: {
  responsableNombre: string;
  empresa: string;
  empleadoNombre: string;
  empleadoCorreo: string;
  numeroEmpleado: string | null;
  portalUrl: string;
}): { subject: string; html: string } {
  const firstName = data.responsableNombre.split(" ")[0] || data.responsableNombre;
  const body = `
    <h1 style="margin:0 0 4px; font-size:18px; color:${COLOR_BLACK};">Hola, ${escapeHtml(firstName)}</h1>
    <p style="margin:0 0 16px; font-size:14px; color:${COLOR_SLATE};">
      Un colaborador pidió vincularse a <strong>${escapeHtml(data.empresa)}</strong> en Club 57 Empresarial.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      ${fila("Nombre", data.empleadoNombre)}
      ${fila("Correo", data.empleadoCorreo)}
      ${fila("Número de empleado", data.numeroEmpleado)}
    </table>
    <p style="margin:0; font-size:14px; color:${COLOR_BLACK};">Apruébalo y define su línea de crédito, o rechaza la solicitud:</p>
    ${boton(data.portalUrl, "Revisar en el Portal Empresa")}
  `;
  return { subject: `Club 57 Empresarial: ${data.empleadoNombre} pidió vincularse`, html: renderEmailLayout(body) };
}

const pesos = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

/** Al empleado: su empresa aprobó, rechazó o dio de baja su vínculo. */
export function buildVinculoResueltoEmail(data: {
  empleadoNombre: string;
  empresa: string;
  estado: "activo" | "rechazado" | "baja";
  motivo: string | null;
  lineaCredito: number | null;
  cuentaUrl: string;
}): { subject: string; html: string } {
  const firstName = data.empleadoNombre.split(" ")[0] || data.empleadoNombre;
  const empresa = escapeHtml(data.empresa);
  const textos = {
    activo: {
      subject: `Ya puedes comprar con cargo a ${data.empresa}`,
      cuerpo: `${empresa} aprobó tu registro en Club 57 Empresarial.`,
    },
    rechazado: {
      subject: `Club 57 Empresarial: tu solicitud con ${data.empresa}`,
      cuerpo: `${empresa} no aprobó tu solicitud para Club 57 Empresarial.`,
    },
    baja: {
      subject: `Club 57 Empresarial: cambio en tu vínculo con ${data.empresa}`,
      cuerpo: `${empresa} terminó tu vínculo con Club 57 Empresarial. Tu cuenta de Club 57 sigue activa con todos sus beneficios.`,
    },
  }[data.estado];
  const linea =
    data.estado === "activo" && data.lineaCredito !== null
      ? `<div style="margin:0 0 16px; padding:14px 16px; background-color:${COLOR_GRAY}; border-radius:8px; border-left:4px solid ${COLOR_ORANGE};">
        <p style="margin:0; font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:${COLOR_SLATE};">Tu línea de crédito</p>
        <p style="margin:6px 0 0; font-size:18px; font-weight:bold; color:${COLOR_BLACK};">${pesos(data.lineaCredito)}</p>
        <p style="margin:6px 0 0; font-size:13px; color:${COLOR_SLATE};">Se renueva conforme tu empresa te descuenta vía nómina.</p>
      </div>`
      : "";
  const motivo =
    data.motivo && data.estado !== "activo"
      ? `<p style="margin:0 0 16px; font-size:14px; color:${COLOR_BLACK};"><strong>Motivo:</strong> ${escapeHtml(data.motivo)}</p>`
      : "";
  const body = `
    <h1 style="margin:0 0 4px; font-size:18px; color:${COLOR_BLACK};">Hola, ${escapeHtml(firstName)}</h1>
    <p style="margin:0 0 16px; font-size:14px; color:${COLOR_SLATE};">${textos.cuerpo}</p>
    ${linea}
    ${motivo}
    ${boton(data.cuentaUrl, "Ver mi cuenta")}
  `;
  return { subject: textos.subject, html: renderEmailLayout(body) };
}
