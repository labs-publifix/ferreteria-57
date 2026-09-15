// Reglas de tiempo de preparación/entrega de las 3 modalidades del
// checkout, construidas sobre el horario fijo de la tienda (ver
// lib/business-hours.ts) — un solo lugar para este cálculo en vez de
// repetirlo donde se muestre una fecha/hora de entrega.
import { addBusinessDays, getNextBusinessOpening, isWithinBusinessHours, STORE_TIME_ZONE } from "@/lib/business-hours";
import { PICKUP_PREP_MINUTES } from "./constants";

// Retiro en tienda: el pedido está listo 2 horas después de recibirse,
// EXCEPTO cuando esas 2 horas no caben dentro del horario de atención del
// mismo día (o el pedido llega fuera de horario / en domingo) — en ese
// caso el conteo de 2 horas arranca desde la siguiente apertura de la
// tienda, nunca desde el momento real del pedido. Es el mismo criterio en
// ambos casos: "fuera de horario" y "dentro de horario pero se pasa del
// cierre" resuelven igual, cayendo los dos en la rama de abajo.
export function computePickupReadyTime(orderTime: Date): Date {
  if (isWithinBusinessHours(orderTime)) {
    const readyTime = new Date(orderTime.getTime() + PICKUP_PREP_MINUTES * 60_000);
    if (isWithinBusinessHours(readyTime)) {
      return readyTime;
    }
  }
  const opening = getNextBusinessOpening(orderTime);
  return new Date(opening.getTime() + PICKUP_PREP_MINUTES * 60_000);
}

// Envío local/foráneo: el plazo se cuenta en días hábiles a partir de un
// "punto de partida" — si el pedido se hace dentro de horario de
// atención, ese mismo día cuenta como el punto de partida (día 0); si se
// hace fuera de horario o en domingo, el punto de partida se recorre al
// siguiente día hábil. A diferencia de retiro en tienda, aquí no importa
// si "faltan horas" en el día: solo si la tienda está o no atendiendo en
// ese momento.
export function computeShippingEta(orderTime: Date, businessDays: number): Date {
  const startingPoint = isWithinBusinessHours(orderTime) ? orderTime : getNextBusinessOpening(orderTime);
  return addBusinessDays(startingPoint, businessDays);
}

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("es-MX", {
  timeZone: STORE_TIME_ZONE,
  weekday: "long",
});
const DAY_MONTH_FORMATTER = new Intl.DateTimeFormat("es-MX", {
  timeZone: STORE_TIME_ZONE,
  day: "numeric",
  month: "long",
});
const TIME_FORMATTER = new Intl.DateTimeFormat("es-MX", {
  timeZone: STORE_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("es-MX", {
  timeZone: STORE_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

// "lunes 15 de septiembre a las 11:00 a. m." — usado para la hora de
// "listo para recoger". Formateado siempre en America/Mexico_City, igual
// que el cálculo: mostrar la hora en el huso del navegador de quien
// compra volvería a introducir la dependencia que se evitó al calcular.
export function formatReadyAt(date: Date): string {
  const weekday = WEEKDAY_FORMATTER.format(date);
  const dayMonth = DAY_MONTH_FORMATTER.format(date);
  const time = TIME_FORMATTER.format(date);
  return `${weekday} ${dayMonth} a las ${time}`;
}

// "17 de septiembre de 2026" — usado para la fecha límite de entrega de
// envío local/foráneo (ahí no se promete una hora exacta, solo el día).
export function formatEtaDate(date: Date): string {
  return FULL_DATE_FORMATTER.format(date);
}
