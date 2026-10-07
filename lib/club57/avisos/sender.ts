// Envío de los avisos de promociones. Cliente PROPIO del proveedor de
// correo, separado de lib/email/sendEmail.ts (el helper transaccional de
// pedidos y canjes no se toca): misma RESEND_API_KEY, distinto remitente,
// API de lotes (hasta 100 por llamada), llave de idempotencia por lote y
// clasificación de errores para que el procesador sepa si detenerse por
// hoy, reintentar o marcar fallidos.
//
// Notas internas del proveedor (Resend), nunca para la UI:
//   * 429 daily_quota_exceeded / monthly_quota_exceeded: tope de cuenta.
//   * 429 rate_limit_exceeded: más de ~2 solicitudes por segundo.
//   * x-resend-daily-quota / x-resend-monthly-quota: encabezados con lo
//     USADO del día/mes por toda la cuenta (incluye los transaccionales).
//   * RESEND_BASE_URL (lo lee el SDK) permite apuntar a un servidor de
//     pruebas sin tocar código.
import { Resend } from "resend";
import type { CreateBatchOptions } from "resend";
import { getAvisosFrom } from "./config";

export interface AvisoMensaje {
  to: string;
  subject: string;
  html: string;
  text: string;
  bajaOneClickUrl: string;
  tipo: string;
}

export type ResultadoLote =
  | { kind: "ok"; ids: (string | null)[]; errores: Map<number, string>; usoDiario: number | null; usoMensual: number | null }
  | { kind: "limite_diario"; usoDiario: number | null }
  | { kind: "limite_mensual"; usoDiario: number | null }
  | { kind: "transitorio"; mensaje: string; usoDiario: number | null }
  | { kind: "rechazado"; mensaje: string; usoDiario: number | null };

let client: Resend | null = null;
function getClient(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

const MAX_INTENTOS = 3;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function leerUso(headers: Record<string, string> | null | undefined, nombre: string): number | null {
  const raw = headers?.[nombre];
  if (raw === undefined) return null;
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Mismo criterio que sendEmail.ts: EMAIL_OVERRIDE (si existe) redirige
// TODO correo a una sola bandeja de prueba.
function destinatario(to: string): string {
  return process.env.EMAIL_OVERRIDE || to;
}

function payload(m: AvisoMensaje) {
  return {
    from: getAvisosFrom(),
    to: destinatario(m.to),
    subject: m.subject,
    html: m.html,
    text: m.text,
    headers: {
      "List-Unsubscribe": `<${m.bajaOneClickUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    tags: [
      { name: "categoria", value: "club57_aviso" },
      { name: "tipo", value: m.tipo },
    ],
  };
}

interface ErrorProveedor {
  name?: string;
  message?: string;
  statusCode?: number | null;
}

function clasificar(error: ErrorProveedor): "limite_diario" | "limite_mensual" | "transitorio" | "rechazado" {
  const name = error.name ?? "";
  if (name === "daily_quota_exceeded") return "limite_diario";
  if (name === "monthly_quota_exceeded") return "limite_mensual";
  const status = typeof error.statusCode === "number" ? error.statusCode : null;
  if (
    name === "rate_limit_exceeded" ||
    name === "concurrent_idempotent_requests" ||
    name === "application_error" ||
    name === "internal_server_error" ||
    (status !== null && (status === 429 || status >= 500))
  ) {
    return "transitorio";
  }
  return "rechazado";
}

// Envía un lote (1–100 mensajes) con reintentos con espera creciente ante
// 429 de velocidad y 5xx/red (máximo 3 intentos). Nunca lanza.
export async function enviarLote(mensajes: AvisoMensaje[], idempotencyKey: string): Promise<ResultadoLote> {
  let ultimo = "";
  let usoDiario: number | null = null;
  for (let intento = 1; intento <= MAX_INTENTOS; intento += 1) {
    try {
      const response = await getClient().batch.send(mensajes.map(payload) as CreateBatchOptions, {
        idempotencyKey,
        batchValidation: "permissive",
      });
      const headers = (response as { headers?: Record<string, string> | null }).headers;
      usoDiario = leerUso(headers, "x-resend-daily-quota") ?? usoDiario;
      const usoMensual = leerUso(headers, "x-resend-monthly-quota");

      if (response.error) {
        const tipo = clasificar(response.error as ErrorProveedor);
        ultimo = response.error.message ?? "Error del servicio de correo";
        if (tipo === "limite_diario") return { kind: "limite_diario", usoDiario };
        if (tipo === "limite_mensual") return { kind: "limite_mensual", usoDiario };
        if (tipo === "rechazado") return { kind: "rechazado", mensaje: ultimo, usoDiario };
      } else {
        const data = (response.data?.data ?? []) as { id: string }[];
        const erroresRaw = ((response.data as { errors?: { index: number; message: string }[] } | null)?.errors ?? []) as {
          index: number;
          message: string;
        }[];
        const errores = new Map<number, string>(erroresRaw.map((e) => [e.index, e.message]));
        // En modo permisivo `data` trae solo los aceptados, en orden.
        const ids: (string | null)[] = [];
        let cursor = 0;
        for (let i = 0; i < mensajes.length; i += 1) {
          if (errores.has(i)) ids.push(null);
          else ids.push(data[cursor++]?.id ?? null);
        }
        return { kind: "ok", ids, errores, usoDiario, usoMensual };
      }
    } catch (error) {
      ultimo = error instanceof Error ? error.message : "Error de red";
    }
    if (intento < MAX_INTENTOS) await sleep(1000 * 2 ** (intento - 1));
  }
  return { kind: "transitorio", mensaje: ultimo, usoDiario };
}

// Correo de prueba al admin: mismo contenido y encabezados, envío
// individual (sin idempotencia: cada prueba es un envío nuevo).
export async function enviarPrueba(
  mensaje: AvisoMensaje
): Promise<{ id: string | null; error: "limite_diario" | "limite_mensual" | "otro" | null; detalle?: string }> {
  try {
    const { data, error } = await getClient().emails.send(payload(mensaje));
    if (error) {
      const tipo = clasificar(error as ErrorProveedor);
      return {
        id: null,
        error: tipo === "limite_diario" || tipo === "limite_mensual" ? tipo : "otro",
        detalle: error.message,
      };
    }
    return { id: data?.id ?? null, error: null };
  } catch (error) {
    return { id: null, error: "otro", detalle: error instanceof Error ? error.message : undefined };
  }
}
