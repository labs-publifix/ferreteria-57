// Horario fijo de la tienda física, usado para calcular tiempos de
// preparación/entrega del checkout (ver lib/checkout/fulfillmentTiming.ts).
// Todos los cálculos se hacen en America/Mexico_City sin importar el huso
// horario del navegador de quien compra — alguien viendo el sitio desde
// otro país no debe ver una hora de "listo para recoger" corrida por su
// propio huso horario.
//
// PENDIENTE (fuera de alcance de este cambio): esta utilidad NO considera
// días festivos mexicanos, solo el patrón semanal fijo (lunes a sábado
// hábil, domingo cerrado). Agregar un calendario de festivos es una
// mejora futura pendiente.

export const STORE_TIME_ZONE = "America/Mexico_City";

interface DayHours {
  openHour: number;
  closeHour: number;
}

// 0 = domingo … 6 = sábado, igual que Date#getDay()/getUTCDay().
const BUSINESS_HOURS: Record<number, DayHours | null> = {
  0: null, // domingo: cerrado
  1: { openHour: 8, closeHour: 19 },
  2: { openHour: 8, closeHour: 19 },
  3: { openHour: 8, closeHour: 19 },
  4: { openHour: 8, closeHour: 19 },
  5: { openHour: 8, closeHour: 19 },
  6: { openHour: 8, closeHour: 15 }, // sábado
};

function hoursFor(weekday: number): DayHours | null {
  return BUSINESS_HOURS[weekday] ?? null;
}

interface CivilDateTime {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
}

// Lee un instante absoluto como fecha/hora de calendario en
// America/Mexico_City. Se usa Intl (no un offset fijo como "-6") porque es
// la forma correcta de resolver un IANA time zone en JS sin depender de
// una librería externa — aunque México ya no observa horario de verano en
// la mayor parte del país, apoyarse en Intl es más robusto que codificar
// el offset a mano.
function toCivilDateTime(date: Date): CivilDateTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const lookup = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const hour = lookup("hour");
  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
    // Con hour12:false, algunos motores representan la medianoche como
    // "24" en vez de "00" — se normaliza para no desfasar los cálculos.
    hour: hour === 24 ? 0 : hour,
    minute: lookup("minute"),
  };
}

// Día de la semana (0=domingo…6=sábado) de una fecha de calendario — es
// aritmética de calendario pura, no depende de huso horario ni de hora.
function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function addCalendarDays(
  { year, month, day }: { year: number; month: number; day: number },
  amount: number
): { year: number; month: number; day: number } {
  const next = new Date(Date.UTC(year, month - 1, day + amount));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() };
}

// Offset (en minutos) de America/Mexico_City respecto a UTC en el
// instante `date` — se deriva formateando `date` en esa zona y comparando
// contra el mismo instante interpretado como UTC.
function getTimeZoneOffsetMinutes(date: Date): number {
  const civil = toCivilDateTime(date);
  const asUtc = Date.UTC(civil.year, civil.month - 1, civil.day, civil.hour, civil.minute);
  return (asUtc - date.getTime()) / 60_000;
}

// Convierte una hora de pared (año/mes/día/hora/minuto en
// America/Mexico_City) al instante absoluto (Date) que le corresponde.
// Técnica estándar (la misma que usan librerías como date-fns-tz): se
// arma un primer instante interpretando esos componentes como si fueran
// UTC, se mide cuánto se desvía ese instante al formatearlo de vuelta en
// la zona destino, y se corrige por esa diferencia.
function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(utcGuess));
  return new Date(utcGuess - offsetMinutes * 60_000);
}

// ¿El instante `date` cae dentro del horario de atención de la tienda?
export function isWithinBusinessHours(date: Date): boolean {
  const civil = toCivilDateTime(date);
  const hours = hoursFor(weekdayOf(civil.year, civil.month, civil.day));
  if (!hours) return false;
  const minutesOfDay = civil.hour * 60 + civil.minute;
  return minutesOfDay >= hours.openHour * 60 && minutesOfDay < hours.closeHour * 60;
}

// Próxima hora hábil a partir de `date`:
// - Si hoy es día hábil y todavía no abre, regresa la apertura de HOY.
// - Si ya pasó la apertura de hoy (estemos dentro de horario o ya
//   cerrado) o si hoy no es día hábil (domingo), avanza día por día hasta
//   el siguiente día hábil y regresa su apertura.
export function getNextBusinessOpening(date: Date): Date {
  const civil = toCivilDateTime(date);
  const todayHours = hoursFor(weekdayOf(civil.year, civil.month, civil.day));
  const minutesOfDay = civil.hour * 60 + civil.minute;

  if (todayHours && minutesOfDay < todayHours.openHour * 60) {
    return zonedTimeToUtc(civil.year, civil.month, civil.day, todayHours.openHour, 0);
  }

  let cursor = { year: civil.year, month: civil.month, day: civil.day };
  // A lo mucho una vuelta completa a la semana — domingo es el único día
  // cerrado, así que esto siempre encuentra un día hábil mucho antes.
  for (let i = 0; i < 7; i++) {
    cursor = addCalendarDays(cursor, 1);
    const hours = hoursFor(weekdayOf(cursor.year, cursor.month, cursor.day));
    if (hours) {
      return zonedTimeToUtc(cursor.year, cursor.month, cursor.day, hours.openHour, 0);
    }
  }
  // Inalcanzable con el horario semanal actual (domingo es el único día
  // cerrado) — lanzar en vez de devolver un valor incorrecto si algún día
  // BUSINESS_HOURS cambia a algo con más de 6 días cerrados seguidos.
  throw new Error("No se encontró un día hábil dentro de los próximos 7 días.");
}

// Suma `days` días hábiles (sábado cuenta, domingo no) a partir de la
// fecha de calendario de `date` — el día de `date` no cuenta como uno de
// los días sumados, solo los que se avanzan. Devuelve la medianoche
// (America/Mexico_City) del día hábil resultante: para este cálculo solo
// importa la fecha, no la hora.
export function addBusinessDays(date: Date, days: number): Date {
  const civil = toCivilDateTime(date);
  let cursor = { year: civil.year, month: civil.month, day: civil.day };
  let remaining = days;
  while (remaining > 0) {
    cursor = addCalendarDays(cursor, 1);
    if (hoursFor(weekdayOf(cursor.year, cursor.month, cursor.day))) {
      remaining -= 1;
    }
  }
  return zonedTimeToUtc(cursor.year, cursor.month, cursor.day, 0, 0);
}
