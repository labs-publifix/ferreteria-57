// Pop-Up Banner: los campos de fecha/hora se capturan y muestran en
// America/Mexico_City (huso de la tienda) pero se guardan en UTC
// (timestamptz) — a diferencia de lib/marketing/visibility.ts, que solo
// maneja fechas de calendario ("YYYY-MM-DD", sin hora), aquí sí hace falta
// la hora completa porque la programación se prueba con ventanas de
// minutos. No se usa ninguna librería externa (el proyecto no trae
// date-fns-tz/luxon) — todo con Intl.DateTimeFormat, nativo del runtime.

const TIME_ZONE = "America/Mexico_City";

function partsToMap(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  return map;
}

// Instante UTC (ISO) -> valor para <input type="datetime-local">
// ("YYYY-MM-DDTHH:mm") mostrando la hora de pared de Ciudad de México.
export function utcIsoToMexicoCityInputValue(utcIso: string): string {
  const date = new Date(utcIso);
  const parts = partsToMap(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date)
  );
  // Algunos motores de Intl devuelven "24" para la medianoche con
  // hour12:false — normalizado a "00" (mismo instante, otra notación).
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}

// Valor de <input type="datetime-local"> (hora de pared en Ciudad de
// México, SIN información de huso) -> instante UTC equivalente (ISO).
//
// Técnica: como Date.UTC() no sabe de husos horarios, arma un primer
// candidato tratando los números escritos como si ya fueran UTC: mide qué
// hora de pared da ese instante en Ciudad de México, y corrige el
// candidato por la diferencia. Dos iteraciones bastan siempre (el offset
// de una sola zona no cambia entre la primera corrección y la segunda) —
// funciona sin importar el offset exacto (hoy UTC-6 fijo, México ya no usa
// horario de verano desde 2022) y sigue siendo correcto si esa regla
// cambiara en el futuro.
export function mexicoCityInputValueToUtcIso(inputValue: string): string {
  const [datePart, timePart] = inputValue.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const targetWallTime = Date.UTC(year, month - 1, day, hour, minute);

  let guess = targetWallTime;
  for (let i = 0; i < 2; i++) {
    const parts = partsToMap(
      new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(new Date(guess))
    );
    const wallHour = parts.hour === "24" ? 0 : Number(parts.hour);
    const wallFromGuess = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      wallHour,
      Number(parts.minute)
    );
    guess += targetWallTime - wallFromGuess;
  }

  return new Date(guess).toISOString();
}

// Para mostrar fecha/hora ya guardadas (lectura, no un input) — mismo
// huso, formato legible en español.
export function formatMexicoCityDateTime(utcIso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(utcIso));
}
