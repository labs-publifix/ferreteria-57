// Fechas del blog, siempre en la zona del negocio (el servidor de Vercel
// corre en UTC: sin timeZone, un artículo de las 22:00 del día 7 se
// mostraría como del día 8).
const TZ = "America/Mexico_City";

const larga = new Intl.DateTimeFormat("es-MX", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
const corta = new Intl.DateTimeFormat("es-MX", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
const diaNegocio = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** "7 de octubre de 2026" */
export function formatFechaLarga(iso: string): string {
  return larga.format(new Date(iso));
}

/** "07/10/2026" */
export function formatFechaCorta(iso: string): string {
  return corta.format(new Date(iso));
}

/** true si las dos fechas caen en días de calendario distintos (CDMX). */
export function esOtroDia(a: string, b: string): boolean {
  return diaNegocio.format(new Date(a)) !== diaNegocio.format(new Date(b));
}
