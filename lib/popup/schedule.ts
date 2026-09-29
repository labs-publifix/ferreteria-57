// Pop-Up Banner: a diferencia de isWithinSchedule() en
// lib/marketing/visibility.ts (Top Banner / Promo Banners), que compara
// fechas "YYYY-MM-DD" a granularidad de DÍA, este banner se programa a
// nivel de MINUTO (starts_at/ends_at son timestamptz) — la prueba de
// verificación pide crear uno con una ventana de 2 minutos. Por eso este
// módulo no reutiliza esa función (sería imprecisa aquí) y trabaja
// directo con instantes (Date), sin tocar el archivo existente.

export type PopupBannerStatus = "programado" | "activo" | "finalizado" | "inactivo";

export function computePopupStatus(
  banner: { activo: boolean; startsAt: string; endsAt: string },
  now: Date = new Date()
): PopupBannerStatus {
  if (!banner.activo) return "inactivo";
  const start = new Date(banner.startsAt);
  const end = new Date(banner.endsAt);
  if (now.getTime() < start.getTime()) return "programado";
  if (now.getTime() > end.getTime()) return "finalizado";
  return "activo";
}

export const POPUP_STATUS_LABEL: Record<PopupBannerStatus, string> = {
  programado: "Programado",
  activo: "Activo ahora",
  finalizado: "Finalizado",
  inactivo: "Inactivo",
};

export const POPUP_STATUS_BADGE_CLASS: Record<PopupBannerStatus, string> = {
  programado: "bg-amber-100 text-amber-800",
  activo: "bg-green-100 text-green-800",
  finalizado: "bg-brand-gray text-brand-slate",
  inactivo: "bg-brand-gray text-brand-slate/70",
};

export interface ScheduleRange {
  startsAt: string;
  endsAt: string;
}

// Dos intervalos [a.startsAt, a.endsAt) y [b.startsAt, b.endsAt) se
// traslapan si cada uno empieza antes de que el otro termine — fórmula
// estándar de intersección de intervalos, simétrica en ambas direcciones.
export function rangesOverlap(a: ScheduleRange, b: ScheduleRange): boolean {
  return new Date(a.startsAt).getTime() < new Date(b.endsAt).getTime()
    && new Date(b.startsAt).getTime() < new Date(a.endsAt).getTime();
}

// Regla de negocio (decisión explícita, confirmada con el cliente): un
// traslape con otro banner ACTIVO se rechaza al guardar en vez de
// resolverse solo (p. ej. "gana el más reciente") — mantiene la decisión
// de cuál banner corre siempre en manos de un humano, nunca implícita.
//
// IMPORTANTE — esta validación es a nivel APLICACIÓN, no a nivel base de
// datos: se hace consultando filas existentes antes de escribir, no con un
// EXCLUDE USING gist (no hay precedente de eso en el proyecto, y agregar
// la extensión btree_gist solo para esto sería una idioma nueva sin
// justificación con el volumen actual). Esto es seguro mientras el panel
// lo use un admin a la vez, como hoy — dos guardados concurrentes entre sí
// (dos pestañas, o dos admins editando al mismo tiempo) podrían, en teoría,
// colarse ambos antes de que cualquiera vea el rechazo del otro (carrera
// clásica "leer-luego-escribir"). Si el equipo llega a tener varios admins
// gestionando este módulo en simultáneo, esa carrera dejaría de ser
// hipotética y valdría la pena mover esta regla a la base de datos (p. ej.
// con `create extension btree_gist` + `exclude using gist (tstzrange(starts_at, ends_at) with &&) where (activo)`).
export function findOverlappingBanner<T extends ScheduleRange & { id: string; nombre: string }>(
  candidate: ScheduleRange,
  existingActiveBanners: T[],
  excludeId?: string
): T | null {
  for (const banner of existingActiveBanners) {
    if (banner.id === excludeId) continue;
    if (rangesOverlap(candidate, banner)) return banner;
  }
  return null;
}
