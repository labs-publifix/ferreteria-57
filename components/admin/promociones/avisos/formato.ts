// Textos y formatos del aviso por email en el panel. Lenguaje neutro de
// negocio: aquí nunca aparece el nombre del servicio de correo ni detalles
// de su contratación.
import { formatFechaCorta } from "@/lib/club57/promociones/vigencia";
import type { AvisoCampanaResumen, AvisoEstado } from "@/lib/club57/avisos/tipos";

const horaMinuto = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Mexico_City",
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h23",
});
const fechaSola = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// "7 de octubre de 2026, 9:05 h"
export function formatInstante(iso: string): string {
  const fecha = new Date(iso);
  const parts = horaMinuto.formatToParts(fecha);
  const hora = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minuto = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${fechaSola.format(fecha)}, ${hora}:${minuto} h`;
}

export function formatFechaInstante(iso: string): string {
  return fechaSola.format(new Date(iso));
}

export function formatDia(isoDate: string, hoy: string): string {
  return formatFechaCorta(isoDate, hoy);
}

export const AVISO_ESTADO_LABEL: Record<AvisoEstado, string> = {
  programada: "Programado",
  en_proceso: "Enviando",
  completada: "Enviado",
  con_errores: "Enviado con fallidos",
  cancelada: "Cancelado",
};

export const AVISO_ESTADO_CLASS: Record<AvisoEstado, string> = {
  programada: "bg-sky-100 text-sky-900",
  en_proceso: "bg-amber-100 text-amber-900",
  completada: "bg-green-100 text-green-900",
  con_errores: "bg-red-100 text-red-800",
  cancelada: "bg-brand-gray text-brand-slate",
};

export function esActiva(campana: AvisoCampanaResumen | null | undefined): boolean {
  return campana?.estado === "programada" || campana?.estado === "en_proceso";
}

export function miembros(n: number): string {
  return `${n.toLocaleString("es-MX")} ${n === 1 ? "miembro" : "miembros"}`;
}

export function dias(n: number): string {
  return `${n} ${n === 1 ? "día" : "días"}`;
}

export const TEXTO_LIMITE_HOY = "Se alcanzó el límite de envíos de hoy; el aviso continuará mañana.";
export const TEXTO_LIMITE_MES = "Se alcanzó el límite de envíos de este mes; el aviso continuará cuando se renueve la capacidad.";
export const TEXTO_MES_CERCA = "El volumen de envíos de este mes está cerca del límite.";
export const TEXTO_NO_ALCANZA =
  "Algunos miembros no recibirán el aviso antes de que venza la promoción. Contacta a tu administrador de la plataforma para ampliar la capacidad de envío.";
