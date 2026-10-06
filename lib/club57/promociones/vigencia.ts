// Vigencia de promociones de Club 57 — funciones puras (sin I/O), usadas
// igual en el servidor (endpoint de descarga, páginas) y en el navegador
// (validación en vivo del asistente). Las fechas son de CALENDARIO
// "YYYY-MM-DD" en America/Mexico_City, ambas inclusivas: una promoción con
// fin = hoy sigue vigente hasta las 23:59:59 de hoy en CDMX. Como el
// formato ISO ordena igual que la fecha, se comparan como texto.
import { addDaysInStoreTimezone, todayInStoreTimezone } from "@/lib/marketing/visibility";
import {
  PROMO_FINALIZADA_DIAS,
  PROMO_TIPOS,
  PROMO_ULTIMOS_DIAS,
  type PromoEstado,
  type PromoTipo,
} from "./config";

export type PromoEstadoVisible = "programada" | "vigente" | "vencida";

export interface PromoRango {
  inicio: string;
  fin: string;
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function toUtcMs(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function diffDays(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / 86_400_000);
}

export function promoEstadoVisible(rango: PromoRango, hoy: string): PromoEstadoVisible {
  if (hoy < rango.inicio) return "programada";
  if (hoy > rango.fin) return "vencida";
  return "vigente";
}

// Regla que el endpoint de descarga aplica en cada request: "hoy" se
// resuelve en CDMX a partir del instante real del servidor.
export function isPromoVigente(rango: PromoRango, now: Date = new Date()): boolean {
  return promoEstadoVisible(rango, todayInStoreTimezone(now)) === "vigente";
}

// Días que quedan contando hoy: fin = hoy -> 1 ("Último día").
export function diasRestantes(fin: string, hoy: string): number {
  return diffDays(hoy, fin) + 1;
}

export function rangesOverlapInclusive(a: PromoRango, b: PromoRango): boolean {
  return a.inicio <= b.fin && b.inicio <= a.fin;
}

export function findOverlappingPromo<T extends PromoRango & { id: string }>(
  candidate: PromoRango,
  publicadas: T[],
  excludeId?: string
): T | null {
  return publicadas.find((promo) => promo.id !== excludeId && rangesOverlapInclusive(candidate, promo)) ?? null;
}

const fechaLargaFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const fechaSinAnioFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

// "2026-10-31" -> "31 de octubre de 2026"
export function formatFechaLarga(isoDate: string): string {
  return fechaLargaFormatter.format(toUtcMs(isoDate));
}

// "2026-11-01" -> "1 de noviembre" (con año solo si no es el año de `hoy`).
export function formatFechaCorta(isoDate: string, hoy: string): string {
  return isoDate.slice(0, 4) === hoy.slice(0, 4)
    ? fechaSinAnioFormatter.format(toUtcMs(isoDate))
    : fechaLargaFormatter.format(toUtcMs(isoDate));
}

// "Del 6 de octubre al 31 de octubre de 2026" (el año se repite solo si
// el rango cruza de año).
export function formatRangoLegible(rango: PromoRango): string {
  if (rango.inicio === rango.fin) return `El ${formatFechaLarga(rango.inicio)}`;
  const mismoAnio = rango.inicio.slice(0, 4) === rango.fin.slice(0, 4);
  const inicio = mismoAnio
    ? fechaSinAnioFormatter.format(toUtcMs(rango.inicio))
    : formatFechaLarga(rango.inicio);
  return `Del ${inicio} al ${formatFechaLarga(rango.fin)}`;
}

function lastDayOfMonth(year: number, monthIndex: number): string {
  const date = new Date(Date.UTC(year, monthIndex + 1, 0));
  return date.toISOString().slice(0, 10);
}

export interface PromoAtajos {
  esteMes: PromoRango;
  proximoMes: PromoRango;
  proximos15Dias: PromoRango;
}

export function promoAtajos(hoy: string): PromoAtajos {
  const [y, m] = hoy.split("-").map(Number);
  const nextMonthStart = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  return {
    esteMes: { inicio: hoy, fin: lastDayOfMonth(y, m - 1) },
    proximoMes: { inicio: nextMonthStart, fin: lastDayOfMonth(y, m) },
    proximos15Dias: { inicio: hoy, fin: addDaysInStoreTimezone(14, hoy) },
  };
}

// ---------------------------------------------------------------------
// Estado por tipo (panel admin) y tarjetas del miembro (/cuenta)
// ---------------------------------------------------------------------

export interface PromoPublicadaRow extends PromoRango {
  id: string;
  tipo: PromoTipo;
}

export interface PromoResumenTipo<T extends PromoPublicadaRow> {
  vigente: T | null;
  proxima: T | null;
}

export function resumenPorTipo<T extends PromoPublicadaRow>(
  publicadas: T[],
  tipo: PromoTipo,
  hoy: string
): PromoResumenTipo<T> {
  const delTipo = publicadas.filter((promo) => promo.tipo === tipo);
  const vigente = delTipo.find((promo) => promoEstadoVisible(promo, hoy) === "vigente") ?? null;
  const proxima =
    delTipo
      .filter((promo) => promoEstadoVisible(promo, hoy) === "programada")
      .sort((a, b) => (a.inicio < b.inicio ? -1 : 1))[0] ?? null;
  return { vigente, proxima };
}

export type MemberPromoCardState =
  | { estado: "vigente"; promocionId: string; vigenciaFin: string; diasRestantes: number; mostrarUltimosDias: boolean }
  | { estado: "programada"; vigenciaInicio: string }
  | { estado: "finalizada" }
  | { estado: "proximamente" };

export interface MemberPromoCard {
  tipo: PromoTipo;
  label: string;
  state: MemberPromoCardState;
}

// Prioridad: vigente > próxima programada > recién finalizada (últimos
// PROMO_FINALIZADA_DIAS días) > próximamente. Liquidaciones se queda en
// "Próximamente" hasta su fase.
export function buildMemberPromoCards(publicadas: PromoPublicadaRow[], hoy: string): MemberPromoCard[] {
  const limiteFinalizada = addDaysInStoreTimezone(-PROMO_FINALIZADA_DIAS, hoy);

  return PROMO_TIPOS.map((info): MemberPromoCard => {
    if (!info.habilitado) return { tipo: info.tipo, label: info.label, state: { estado: "proximamente" } };

    const { vigente, proxima } = resumenPorTipo(publicadas, info.tipo, hoy);
    if (vigente) {
      const restantes = diasRestantes(vigente.fin, hoy);
      return {
        tipo: info.tipo,
        label: info.label,
        state: {
          estado: "vigente",
          promocionId: vigente.id,
          vigenciaFin: vigente.fin,
          diasRestantes: restantes,
          mostrarUltimosDias: restantes <= PROMO_ULTIMOS_DIAS,
        },
      };
    }
    if (proxima) {
      return { tipo: info.tipo, label: info.label, state: { estado: "programada", vigenciaInicio: proxima.inicio } };
    }
    const recienFinalizada = publicadas.some(
      (promo) => promo.tipo === info.tipo && promo.fin < hoy && promo.fin >= limiteFinalizada
    );
    return { tipo: info.tipo, label: info.label, state: { estado: recienFinalizada ? "finalizada" : "proximamente" } };
  });
}

export const PROMO_ESTADO_LABEL: Record<PromoEstadoVisible | Exclude<PromoEstado, "publicada">, string> = {
  programada: "Programada",
  vigente: "Vigente",
  vencida: "Vencida",
  borrador: "Borrador",
  archivada: "Archivada",
};

export const PROMO_ESTADO_BADGE_CLASS: Record<PromoEstadoVisible | Exclude<PromoEstado, "publicada">, string> = {
  programada: "bg-amber-100 text-amber-800",
  vigente: "bg-green-100 text-green-800",
  vencida: "bg-brand-gray text-brand-slate",
  borrador: "border border-dashed border-brand-slate/40 bg-white text-brand-slate",
  archivada: "bg-brand-gray text-brand-slate/80",
};

export function promoEstadoParaChip(
  estado: PromoEstado,
  rango: Partial<PromoRango>,
  hoy: string
): PromoEstadoVisible | Exclude<PromoEstado, "publicada"> {
  if (estado === "publicada" && rango.inicio && rango.fin) {
    return promoEstadoVisible({ inicio: rango.inicio, fin: rango.fin }, hoy);
  }
  return estado === "archivada" ? "archivada" : "borrador";
}
