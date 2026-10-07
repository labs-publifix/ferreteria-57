// Configuración del aviso por email de promociones de Club 57. Todo sale
// de variables de entorno para que ampliar la capacidad de envío (o
// apagar la función) nunca requiera un cambio de código.
//
// Nota interna (nunca mostrar en la UI): el proveedor de correo hoy tiene
// un tope de 100 correos/día y 3,000/mes COMPARTIDO con los
// transaccionales (pedidos y canjes). RESEND_TRANSACTIONAL_RESERVE deja
// ese margen libre para que un pedido nunca se quede sin su correo.

function envInt(name: string, fallback: number, min = 0): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= min ? value : fallback;
}

export interface AvisosConfig {
  /** Interruptor general (CLUB57_PROMO_EMAILS_ENABLED, default false). */
  enabled: boolean;
  /** Tope diario total del proveedor (transaccionales + avisos). */
  dailyLimit: number;
  /** Envíos diarios reservados para los correos transaccionales. */
  transactionalReserve: number;
  /** Lo que pueden usar los avisos por día: dailyLimit - reserva. */
  promoDailyCap: number;
  monthlyLimit: number;
  /** Tamaño máximo de un lote (el proveedor acepta hasta 100 por llamada). */
  batchSize: number;
}

export function getAvisosConfig(): AvisosConfig {
  const dailyLimit = envInt("RESEND_DAILY_LIMIT", 100, 1);
  const transactionalReserve = Math.min(envInt("RESEND_TRANSACTIONAL_RESERVE", 20, 0), dailyLimit);
  return {
    enabled: process.env.CLUB57_PROMO_EMAILS_ENABLED === "true",
    dailyLimit,
    transactionalReserve,
    promoDailyCap: Math.max(0, dailyLimit - transactionalReserve),
    monthlyLimit: envInt("RESEND_MONTHLY_LIMIT", 3000, 1),
    batchSize: Math.min(100, envInt("CLUB57_PROMO_EMAILS_BATCH_SIZE", 100, 1)),
  };
}

export function isAvisosEnabled(): boolean {
  return getAvisosConfig().enabled;
}

// Remitente propio de los avisos (mismo dominio verificado que los
// transaccionales, distinta dirección). Se puede cambiar sin tocar código.
export function getAvisosFrom(): string {
  return process.env.CLUB57_PROMO_EMAIL_FROM || "Club 57 · Ferretería 57 <club57@ferreteria57.com>";
}

// URL pública del sitio para los enlaces del correo (login y baja).
export function getAvisosBaseUrl(): string {
  const explicit = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const domain =
    process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL;
  return domain ? `https://${domain}` : "http://localhost:3000";
}

// El correo de un aviso se "considera cerca del límite mensual" a partir
// de este porcentaje (solo advierte, nunca bloquea).
export const AVISOS_UMBRAL_MENSUAL = 0.85;

// Hora de negocio a la que sale un aviso programado y corre el cron diario.
export const AVISOS_HORA_ENVIO = 9;
