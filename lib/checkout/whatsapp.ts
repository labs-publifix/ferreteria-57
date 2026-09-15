// Mensaje prellenado de WhatsApp para cotización manual de envío foráneo
// (flujo 3, pedidos >= $4,000 MXN): el equipo necesita ver qué se pidió sin
// tener que pedírselo de vuelta al cliente.
import { STORE_WHATSAPP_PHONE } from "@/lib/store-info";
import { formatPrice } from "@/lib/formatPrice";

export interface ForaneoQuoteItem {
  name: string;
  variantLabel: string | null;
  quantity: number;
}

export function buildForaneoQuoteMessage(items: ForaneoQuoteItem[], subtotal: number): string {
  const lines = items.map(
    (item) => `- ${item.quantity}x ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""}`
  );
  return [
    "Hola, quiero cotizar el envío foráneo de mi pedido:",
    ...lines,
    `Subtotal: ${formatPrice(subtotal)}`,
  ].join("\n");
}

export function buildForaneoWhatsAppUrl(items: ForaneoQuoteItem[], subtotal: number): string {
  const message = buildForaneoQuoteMessage(items, subtotal);
  return `https://wa.me/${STORE_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
