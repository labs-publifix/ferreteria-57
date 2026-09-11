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
