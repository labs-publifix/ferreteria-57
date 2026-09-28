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

export interface StockInquiryProduct {
  name: string;
  /** Cód. de la variante (SKU) si hay, para que el equipo identifique
   *  exactamente qué presentación se pregunta — igual que el resto del
   *  sitio, clave y sku son datos distintos y ninguno reemplaza al otro. */
  sku?: string | null;
  clave?: string | null;
}

// Dos redacciones distintas: "agotado" (stock 0, no hay tope que mostrar)
// vs. "tope alcanzado" (sí hay un máximo disponible y vale la pena
// decírselo al equipo para que sepa qué está pidiendo el cliente sin
// tener que preguntárselo de vuelta). Mismo patrón que
// buildForaneoQuoteMessage: función pura, la URL se arma aparte.
export function buildStockInquiryMessage(
  product: StockInquiryProduct,
  options: { desiredQuantity: number; available: number | null }
): string {
  const codeParts = [
    product.sku ? `Cód. ${product.sku}` : null,
    product.clave ? `Clave ${product.clave}` : null,
  ].filter(Boolean);
  const codeLine = codeParts.length > 0 ? ` (${codeParts.join(", ")})` : "";

  if (options.available === null || options.available === 0) {
    return `Hola, quiero consultar disponibilidad de "${product.name}"${codeLine}. ¿Cuándo tienen más?`;
  }

  return `Hola, quiero ${options.desiredQuantity} de "${product.name}"${codeLine} pero solo tienen ${options.available} disponibles. ¿Pueden conseguirme el resto?`;
}

export function buildStockInquiryWhatsAppUrl(
  product: StockInquiryProduct,
  options: { desiredQuantity: number; available: number | null }
): string {
  const message = buildStockInquiryMessage(product, options);
  return `https://wa.me/${STORE_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

// Buscador sin resultados: el término buscado va tal cual en el mensaje
// para que el equipo no tenga que pedírselo de vuelta al cliente.
export function buildSearchNotFoundWhatsAppUrl(query: string): string {
  const message = `Hola, busqué "${query}" en la tienda en línea y no lo encontré. ¿Lo tienen disponible?`;
  return `https://wa.me/${STORE_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
