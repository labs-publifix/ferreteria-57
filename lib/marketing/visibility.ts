// Fecha de "hoy" en el huso horario de la tienda (Querétaro, México —
// America/Mexico_City) en vez de UTC: el servidor corre en UTC, y cerca
// de la medianoche local eso puede adelantar o atrasar un día completo la
// comparación contra starts_at/ends_at si se usara Date().toISOString()
// directo. en-CA formatea como YYYY-MM-DD, igual que los inputs type=date
// y las columnas `date` de Postgres — comparables como texto sin
// convertir nada más.
export function todayInStoreTimezone(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Suma días de calendario a una fecha "YYYY-MM-DD" ya resuelta en huso de
// tienda (por default, hoy) — nunca a partir de new Date() + setDate()
// directo: eso opera en el huso del proceso de Node (UTC en producción),
// que cerca de la medianoche de Querétaro ya puede estar un día adelante
// o atrasado. Construir con Date.UTC(y, m-1, d + days) es aritmética de
// calendario pura (Date normaliza el desbordamiento de mes/año solo), sin
// volver a interpretar el resultado en ningún huso horario.
export function addDaysInStoreTimezone(days: number, from: string = todayInStoreTimezone()): string {
  const [year, month, day] = from.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1, day + days));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${target.getUTCFullYear()}-${pad(target.getUTCMonth() + 1)}-${pad(target.getUTCDate())}`;
}

// Regla compartida por Top Banner y Promo Banners: cuando hay fecha de
// inicio y/o fin, esas fechas deciden solas si algo se ve o no — el
// toggle activo/inactivo se ignora por completo mientras haya alguna
// fecha configurada. Sin ninguna fecha, manda el toggle. La idea: un
// admin programa una campaña una sola vez (fechas) sin tener que
// acordarse de también prender/apagar el toggle justo en esos días.
export function isWithinSchedule(
  { startsAt, endsAt, active }: { startsAt: string | null; endsAt: string | null; active: boolean },
  today: string = todayInStoreTimezone()
): boolean {
  if (startsAt || endsAt) {
    if (startsAt && today < startsAt) return false;
    if (endsAt && today > endsAt) return false;
    return true;
  }
  return active;
}
