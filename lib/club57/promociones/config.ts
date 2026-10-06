// Promociones descargables de Club 57 — constantes compartidas entre el
// panel admin, el endpoint de descarga y las tarjetas del miembro.

export type PromoTipo = "promo_truper" | "promo_temporada" | "liquidaciones";
export type PromoEstado = "borrador" | "publicada" | "archivada";

export const PROMO_BUCKET = "club57-promociones";

// Debe coincidir con file_size_limit del bucket en la migración
// 20261006010000_club57_promociones.sql (capa extra del lado de Storage).
export const PROMO_MAX_BYTES = 25 * 1024 * 1024;

// Ventana durante la que el miembro sigue viendo "Promoción finalizada"
// después del último día de vigencia — debe coincidir con el "- 7" de la
// vista club57_promociones_vigentes.
export const PROMO_FINALIZADA_DIAS = 7;

// A partir de cuántos días restantes (inclusive) se muestra "Últimos N días".
export const PROMO_ULTIMOS_DIAS = 5;

// Liquidaciones: el equipo sube el Excel (fuente de verdad) y la
// plataforma genera el PDF. Límite holgado: el archivo real pesa ~15 KB.
export const LIQUIDACION_EXCEL_MAX_BYTES = 5 * 1024 * 1024;

export interface PromoTipoInfo {
  tipo: PromoTipo;
  slug: string;
  label: string;
  /** false = el flujo todavía no está disponible para este tipo. */
  habilitado: boolean;
  /** "pdf": se sube el PDF final. "excel": se sube el Excel y se genera el PDF. */
  formato: "pdf" | "excel";
}

export const PROMO_TIPOS: PromoTipoInfo[] = [
  { tipo: "promo_truper", slug: "promo-truper", label: "Promo Truper", habilitado: true, formato: "pdf" },
  {
    tipo: "promo_temporada",
    slug: "promociones-de-temporada",
    label: "Promociones de Temporada",
    habilitado: true,
    formato: "pdf",
  },
  { tipo: "liquidaciones", slug: "liquidaciones-del-mes", label: "Liquidaciones del Mes", habilitado: true, formato: "excel" },
];

export function promoTipoInfo(tipo: PromoTipo): PromoTipoInfo {
  return PROMO_TIPOS.find((info) => info.tipo === tipo)!;
}

export function promoTipoFromSlug(slug: string): PromoTipoInfo | null {
  return PROMO_TIPOS.find((info) => info.slug === slug) ?? null;
}

export function isPromoTipoHabilitado(value: unknown): value is PromoTipo {
  return PROMO_TIPOS.some((info) => info.tipo === value && info.habilitado);
}
