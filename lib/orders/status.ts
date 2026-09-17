// Reglas de estatus de pedidos — puras, sin Supabase, para poder
// verificarlas con datos sintéticos y para que tanto el Server Action de
// /admin/pedidos como la UI de detalle usen exactamente la misma tabla de
// transiciones (nunca dos copias de "qué sigue de qué" que puedan
// desalinearse).

export type FulfillmentType = "pickup" | "local_delivery" | "foraneo";

export type OrderStatus =
  | "pendiente_pago"
  | "pagado"
  | "preparando"
  | "listo"
  | "enviado"
  | "entregado"
  | "cancelado";

// Único lugar que enumera los 7 estatus posibles como arreglo — usado
// donde se necesita iterarlos todos (p. ej. inicializar un conteo por
// estatus en el dashboard), en vez de repetir la lista a mano en cada
// lugar que la necesite.
export const ALL_ORDER_STATUSES: OrderStatus[] = [
  "pendiente_pago",
  "pagado",
  "preparando",
  "listo",
  "enviado",
  "entregado",
  "cancelado",
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  preparando: "Preparando",
  listo: "Listo",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const FULFILLMENT_TYPE_LABEL: Record<FulfillmentType, string> = {
  pickup: "Retiro en tienda",
  local_delivery: "Envío local",
  foraneo: "Envío foráneo",
};

// Un color distinto por estatus (no solo "en progreso" vs. "terminado")
// para que la lista de /admin/pedidos se pueda escanear de un vistazo —
// única fuente de verdad, usada tanto en la tabla como en el detalle, así
// nunca queda un estatus con un color en una vista y otro en la otra.
export const ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pendiente_pago: "bg-amber-100 text-amber-800",
  pagado: "bg-blue-100 text-blue-800",
  preparando: "bg-indigo-100 text-indigo-800",
  listo: "bg-violet-100 text-violet-800",
  enviado: "bg-cyan-100 text-cyan-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

// Retiro en tienda nunca pasa por "enviado" — de "listo" avanza directo a
// "entregado" (recogido). Envío local y foráneo sí reparten, así que su
// secuencia es idéntica entre sí.
const SEQUENCE_BY_FULFILLMENT: Record<FulfillmentType, OrderStatus[]> = {
  pickup: ["pendiente_pago", "pagado", "preparando", "listo", "entregado"],
  local_delivery: ["pendiente_pago", "pagado", "preparando", "listo", "enviado", "entregado"],
  foraneo: ["pendiente_pago", "pagado", "preparando", "listo", "enviado", "entregado"],
};

// Único siguiente paso "normal" de la secuencia de este tipo de entrega —
// null si `status` ya es terminal (entregado/cancelado) o no aparece en la
// secuencia (no debería pasar, pero evita reventar con undefined).
export function getNextStatus(status: OrderStatus, fulfillmentType: FulfillmentType): OrderStatus | null {
  if (status === "cancelado" || status === "entregado") return null;
  const sequence = SEQUENCE_BY_FULFILLMENT[fulfillmentType];
  const index = sequence.indexOf(status);
  if (index === -1 || index === sequence.length - 1) return null;
  return sequence[index + 1];
}

// Todos los estatus a los que se puede avanzar DIRECTAMENTE desde el
// actual: el siguiente de la secuencia normal de este tipo de entrega, más
// "cancelado" como salida disponible en cualquier estado no terminal — la
// única fuente de verdad de "qué opciones ofrecer" en /admin/pedidos, así
// nunca se puede saltar un paso ni reabrir un pedido ya cerrado.
export function getAvailableNextStatuses(
  status: OrderStatus,
  fulfillmentType: FulfillmentType
): OrderStatus[] {
  if (status === "cancelado" || status === "entregado") return [];
  const options: OrderStatus[] = [];
  const next = getNextStatus(status, fulfillmentType);
  if (next) options.push(next);
  options.push("cancelado");
  return options;
}

// ¿Es válido pasar de `from` a `to` para este tipo de entrega? Server
// Action de /admin/pedidos: nunca confía en que el botón que mandó el
// cliente ya validó esto — vuelve a comprobarlo contra la misma tabla.
export function isValidStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
  fulfillmentType: FulfillmentType
): boolean {
  return getAvailableNextStatuses(from, fulfillmentType).includes(to);
}
