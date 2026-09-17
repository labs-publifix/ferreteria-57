// Fecha/hora límite prometida al cliente en la confirmación del checkout
// (ver components/checkout/ConfirmationView.tsx), recalculada aquí del
// lado del servidor a partir de orders.created_at — no se guarda como
// columna porque es 100% determinística (mismas reglas de horario de
// negocio, mismo resultado) y así nunca puede desalinearse de lo que
// realmente se le prometió al cliente.
import { LOCAL_SHIPPING_BUSINESS_DAYS, FORANEO_SHIPPING_BUSINESS_DAYS } from "@/lib/checkout/constants";
import { computePickupReadyTime, computeShippingEta, formatEtaDate, formatReadyAt } from "@/lib/checkout/fulfillmentTiming";
import type { FulfillmentType } from "./status";

export interface OrderReadiness {
  /** Para columnas de tabla, p. ej. "Listo: lunes 18 de septiembre a las 1:00 p. m." */
  short: string;
  /** Para la vista de detalle, con más contexto. */
  long: string;
}

export function getOrderReadiness(fulfillmentType: FulfillmentType, createdAt: string): OrderReadiness {
  const orderTime = new Date(createdAt);

  if (fulfillmentType === "pickup") {
    const readyAt = computePickupReadyTime(orderTime);
    return {
      short: `Listo: ${formatReadyAt(readyAt)}`,
      long: `Debe estar listo para recoger a partir del ${formatReadyAt(readyAt)} — es lo que se le prometió al cliente en la confirmación.`,
    };
  }

  const businessDays = fulfillmentType === "local_delivery" ? LOCAL_SHIPPING_BUSINESS_DAYS : FORANEO_SHIPPING_BUSINESS_DAYS;
  const eta = computeShippingEta(orderTime, businessDays);
  return {
    short: `Entrega: ${formatEtaDate(eta)}`,
    long: `Se le prometió al cliente una entrega a más tardar el ${formatEtaDate(eta)}.`,
  };
}
