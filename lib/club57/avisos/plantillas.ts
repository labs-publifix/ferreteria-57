// Plantillas del aviso por email de promociones de Club 57 — funciones
// puras (arman {subject, html, text}, no envían nada), mismo criterio que
// lib/email/orderEmails.ts. Reglas de contenido:
//   * El ÚNICO botón lleva a iniciar sesión en Club 57 (/cuenta). El
//     contenido se descarga solo dentro de la cuenta: ningún enlace del
//     correo apunta al endpoint de descarga, a Storage ni a URLs firmadas,
//     y nunca se adjunta el PDF.
//   * Los únicos enlaces son: inicio de sesión, baja de avisos y contacto
//     de la tienda (teléfono).
//   * HTML de tablas a 600 px con estilos inline (lo único que respetan
//     todos los clientes de correo) + versión de texto plano.
import { escapeHtml, COLOR_BLACK, COLOR_GRAY, COLOR_ORANGE, COLOR_SLATE, COLOR_WHITE } from "@/lib/email/orderEmails";
import { STORE_ADDRESS, STORE_PHONE_DISPLAY, STORE_PHONE_TEL } from "@/lib/store-info";
import type { PromoTipo } from "@/lib/club57/promociones/config";
import { formatFechaCorta, formatRangoLegible, type PromoRango } from "@/lib/club57/promociones/vigencia";

export interface AvisoPlantillaData {
  tipo: PromoTipo;
  /** Nombre completo del miembro (se usa solo el primero). */
  nombre: string | null;
  /** Puntos disponibles; null o 0 = no se muestra el bloque. */
  puntos: number | null;
  rango: PromoRango;
  /** "Hoy" de negocio, para decidir si las fechas llevan año. */
  hoy: string;
  baseUrl: string;
  /** Enlace de baja ya firmado (o de muestra en la vista previa). */
  bajaUrl: string;
}

export interface AvisoEmail {
  subject: string;
  html: string;
  text: string;
}

const HORARIO_CORTO = "Lun–Vie 8:00–19:00 h · Sáb 8:00–15:00 h";
const FONT_TITULO = "'Russo One', 'Arial Black', Arial, Helvetica, sans-serif";
const FONT_CUERPO = "Inter, Arial, Helvetica, sans-serif";

interface CopiaTipo {
  etiqueta: string;
  titular: string;
  entrada: string;
  urgencia: string | null;
}

const COPIA: Record<PromoTipo, CopiaTipo> = {
  promo_truper: {
    etiqueta: "Promo Truper",
    titular: "Ya está disponible la Promo Truper",
    entrada: "La nueva Promo Truper ya está lista para ti en tu cuenta de Club 57.",
    urgencia: null,
  },
  promo_temporada: {
    etiqueta: "Promociones de temporada",
    titular: "Aprovecha las promociones de temporada",
    entrada: "Las promociones de esta temporada ya están disponibles en tu cuenta de Club 57.",
    urgencia: null,
  },
  liquidaciones: {
    etiqueta: "Liquidaciones del mes",
    titular: "Liquidaciones del mes",
    entrada: "Ya puedes consultar las piezas en liquidación de este mes en tu cuenta de Club 57.",
    urgencia: "Hasta agotar existencias",
  },
};

export const AVISO_LINEA_EXCLUSIVA = "Este contenido es exclusivo para miembros de Club 57. Inicia sesión para descargarlo.";
export const AVISO_CTA = "Iniciar sesión en Club 57";

function primerNombre(nombre: string | null): string | null {
  const limpio = (nombre ?? "").replace(/\s+/g, " ").trim();
  // Sin nombre capturado, el alta guarda el correo como nombre: no se usa.
  if (!limpio || limpio.includes("@")) return null;
  return limpio.split(" ")[0];
}

export function avisoAsunto(tipo: PromoTipo, nombre: string | null, rango: PromoRango, hoy: string): string {
  if (tipo === "promo_truper") {
    const n = primerNombre(nombre);
    return n ? `Nueva Promo Truper disponible para ti, ${n}` : "Nueva Promo Truper disponible para ti";
  }
  if (tipo === "promo_temporada") return "Promociones de temporada ya disponibles en Club 57";
  return `Liquidaciones del mes: piezas limitadas hasta el ${formatFechaCorta(rango.fin, hoy)}`;
}

// Asunto "plantilla" para mostrar en el panel antes de enviar.
export function avisoAsuntoMuestra(tipo: PromoTipo, rango: PromoRango, hoy: string): string {
  return tipo === "promo_truper" ? "Nueva Promo Truper disponible para ti, {nombre}" : avisoAsunto(tipo, null, rango, hoy);
}

// Página de inicio de sesión de Club 57 (/cuenta muestra el login sin
// sesión y el panel del miembro con sesión). Los UTM no afectan la página.
export function avisoLoginUrl(baseUrl: string, tipo: PromoTipo): string {
  const params = new URLSearchParams({ utm_source: "email", utm_medium: "club57", utm_campaign: tipo });
  return `${baseUrl}/cuenta?${params.toString()}`;
}

export function avisoBajaUrl(baseUrl: string, memberId: string, token: string): string {
  const params = new URLSearchParams({ m: memberId, t: token });
  return `${baseUrl}/club57/baja?${params.toString()}`;
}

// Endpoint de baja en un clic (encabezado List-Unsubscribe-Post).
export function avisoBajaOneClickUrl(baseUrl: string, memberId: string, token: string): string {
  const params = new URLSearchParams({ m: memberId, t: token });
  return `${baseUrl}/api/club57/baja?${params.toString()}`;
}

const formatoPuntos = new Intl.NumberFormat("es-MX");

export function buildAvisoEmail(data: AvisoPlantillaData): AvisoEmail {
  const copia = COPIA[data.tipo];
  const nombre = primerNombre(data.nombre);
  const saludo = nombre ? `Hola, ${nombre}:` : "Hola, miembro de Club 57:";
  const vigencia = formatRangoLegible(data.rango);
  const loginUrl = avisoLoginUrl(data.baseUrl, data.tipo);
  const logoUrl = `${data.baseUrl}/brand/logo-blanco.png`;
  const puntos = data.puntos && data.puntos > 0 ? formatoPuntos.format(data.puntos) : null;
  const subject = avisoAsunto(data.tipo, data.nombre, data.rango, data.hoy);
  const preheader = `${copia.etiqueta} · ${vigencia}. ${AVISO_LINEA_EXCLUSIVA}`;

  const e = escapeHtml;
  const loginHref = e(loginUrl);
  const bajaHref = e(data.bajaUrl);

  const urgenciaHtml = copia.urgencia
    ? `<tr><td style="padding:0 32px 4px;" class="px">
        <span style="display:inline-block; padding:6px 12px; border-radius:6px; background-color:${COLOR_BLACK}; color:${COLOR_WHITE}; font-family:${FONT_CUERPO}; font-size:12px; font-weight:700; letter-spacing:0.6px; text-transform:uppercase;">${e(copia.urgencia)}</span>
      </td></tr>`
    : "";

  const puntosHtml = puntos
    ? `<tr><td style="padding:8px 32px 0;" class="px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td class="card-soft" style="padding:14px 16px; background-color:${COLOR_GRAY}; border-radius:8px; font-family:${FONT_CUERPO}; font-size:15px; line-height:22px; color:${COLOR_BLACK};">
            Tienes <strong style="font-family:${FONT_TITULO}; font-weight:400; font-size:18px; color:${COLOR_BLACK};" class="txt">${e(puntos)}</strong> puntos disponibles en Club 57.
          </td></tr>
        </table>
      </td></tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${e(subject)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Russo+One&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; }
  a { color:${COLOR_BLACK}; }
  @media only screen and (max-width:620px) {
    .container { width:100% !important; }
    .px { padding-left:20px !important; padding-right:20px !important; }
    .h1 { font-size:26px !important; line-height:32px !important; }
    .btn a { display:block !important; }
  }
  @media (prefers-color-scheme: dark) {
    .bg { background-color:#111417 !important; }
    .card { background-color:#1E2428 !important; }
    .card-soft { background-color:#2A3237 !important; color:${COLOR_GRAY} !important; }
    .txt, .h1 { color:${COLOR_GRAY} !important; }
    .muted, .muted a { color:#C9CFD2 !important; }
    .chip { color:${COLOR_GRAY} !important; border-color:${COLOR_ORANGE} !important; }
  }
  [data-ogsc] .card { background-color:#1E2428 !important; }
  [data-ogsc] .txt, [data-ogsc] .h1 { color:${COLOR_GRAY} !important; }
</style>
</head>
<body class="bg" style="margin:0; padding:0; background-color:${COLOR_GRAY};">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:${COLOR_GRAY};">${e(preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" style="background-color:${COLOR_GRAY};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width:600px; max-width:600px;">

      <!-- Encabezado: logo sobre pizarra con filo naranja -->
      <tr><td bgcolor="${COLOR_SLATE}" style="background-color:${COLOR_SLATE}; padding:20px 32px; border-radius:12px 12px 0 0;" class="px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="left" valign="middle">
              <img src="${e(logoUrl)}" width="150" height="46" alt="Ferretería 57" style="display:block; width:150px; height:auto; border:0; outline:none; text-decoration:none; color:${COLOR_WHITE}; font-family:${FONT_TITULO}; font-size:22px;">
            </td>
            <td align="right" valign="middle" style="font-family:${FONT_TITULO}; font-size:13px; line-height:16px; letter-spacing:0.8px; text-transform:uppercase; color:${COLOR_WHITE};">Club 57</td>
          </tr>
        </table>
      </td></tr>
      <tr><td bgcolor="${COLOR_ORANGE}" style="background-color:${COLOR_ORANGE}; height:6px; line-height:6px; font-size:0;">&nbsp;</td></tr>

      <!-- Cuerpo -->
      <tr><td class="card" bgcolor="${COLOR_WHITE}" style="background-color:${COLOR_WHITE}; border-radius:0 0 12px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:30px 32px 0;" class="px">
            <h1 class="h1" style="margin:0; font-family:${FONT_TITULO}; font-weight:400; font-size:30px; line-height:36px; text-transform:uppercase; color:${COLOR_BLACK};">${e(copia.titular)}</h1>
          </td></tr>
          <tr><td style="padding:16px 32px 12px;" class="px">
            <span class="chip" style="display:inline-block; padding:7px 12px; border:2px solid ${COLOR_ORANGE}; border-radius:8px; font-family:${FONT_CUERPO}; font-size:13px; line-height:16px; font-weight:600; color:${COLOR_BLACK};">Vigencia: ${e(vigencia)}</span>
          </td></tr>
          ${urgenciaHtml}
          <tr><td style="padding:16px 32px 0;" class="px">
            <p class="txt" style="margin:0 0 10px; font-family:${FONT_CUERPO}; font-size:16px; line-height:24px; color:${COLOR_BLACK};">${e(saludo)}</p>
            <p class="txt" style="margin:0; font-family:${FONT_CUERPO}; font-size:16px; line-height:24px; color:${COLOR_BLACK};">${e(copia.entrada)}</p>
          </td></tr>
          ${puntosHtml}
          <tr><td style="padding:20px 32px 0;" class="px">
            <p class="txt" style="margin:0; font-family:${FONT_CUERPO}; font-size:15px; line-height:22px; font-weight:600; color:${COLOR_BLACK};">${e(AVISO_LINEA_EXCLUSIVA)}</p>
          </td></tr>

          <!-- Botón único: iniciar sesión -->
          <tr><td align="left" style="padding:22px 32px 6px;" class="px btn">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr><td align="center" bgcolor="${COLOR_ORANGE}" style="border-radius:8px; background-color:${COLOR_ORANGE};">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${loginHref}" style="height:52px; v-text-anchor:middle; width:300px;" arcsize="16%" stroke="f" fillcolor="${COLOR_ORANGE}">
                  <w:anchorlock/>
                  <center style="color:${COLOR_BLACK}; font-family:Arial, sans-serif; font-size:16px; font-weight:bold;">${e(AVISO_CTA)}</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-- -->
                <a href="${loginHref}" target="_blank" style="display:inline-block; padding:16px 28px; font-family:${FONT_CUERPO}; font-size:16px; line-height:20px; font-weight:700; color:${COLOR_BLACK}; text-decoration:none; border-radius:8px; background-color:${COLOR_ORANGE}; mso-hide:all;">${e(AVISO_CTA)}</a>
                <!--<![endif]-->
              </td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:10px 32px 30px;" class="px">
            <p class="muted" style="margin:0; font-family:${FONT_CUERPO}; font-size:13px; line-height:20px; color:${COLOR_SLATE};">Al iniciar sesión, búscalo en «Promociones para miembros».</p>
          </td></tr>
        </table>
      </td></tr>

      <!-- Pie -->
      <tr><td style="padding:22px 32px 8px;" class="px">
        <p class="muted" style="margin:0 0 6px; font-family:${FONT_CUERPO}; font-size:12px; line-height:18px; color:${COLOR_SLATE};"><strong>Ferretería 57</strong> · ${e(STORE_ADDRESS)}</p>
        <p class="muted" style="margin:0 0 6px; font-family:${FONT_CUERPO}; font-size:12px; line-height:18px; color:${COLOR_SLATE};">Tel. <a href="tel:${e(STORE_PHONE_TEL)}" style="color:${COLOR_SLATE}; text-decoration:underline;">${e(STORE_PHONE_DISPLAY)}</a> · ${e(HORARIO_CORTO)}</p>
        <p class="muted" style="margin:14px 0 0; font-family:${FONT_CUERPO}; font-size:12px; line-height:18px; color:${COLOR_SLATE};">Recibes este correo por ser miembro de Club 57. <a href="${bajaHref}" style="color:${COLOR_SLATE}; text-decoration:underline;">Dejar de recibir avisos de promociones</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    `Club 57 · ${copia.etiqueta}`,
    "",
    copia.titular.toUpperCase(),
    `Vigencia: ${vigencia}`,
    ...(copia.urgencia ? [copia.urgencia] : []),
    "",
    saludo,
    copia.entrada,
    ...(puntos ? ["", `Tienes ${puntos} puntos disponibles en Club 57.`] : []),
    "",
    AVISO_LINEA_EXCLUSIVA,
    "",
    `${AVISO_CTA}: ${loginUrl}`,
    "Al iniciar sesión, búscalo en «Promociones para miembros».",
    "",
    "—",
    `Ferretería 57 · ${STORE_ADDRESS}`,
    `Tel. ${STORE_PHONE_DISPLAY} · ${HORARIO_CORTO}`,
    "",
    "Recibes este correo por ser miembro de Club 57.",
    `Dejar de recibir avisos de promociones: ${data.bajaUrl}`,
  ].join("\n");

  return { subject, html, text };
}
