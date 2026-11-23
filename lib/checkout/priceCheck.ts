// Compara lo que el cliente vio en su carrito contra la cotización que hace
// el servidor (cotizar_carrito): el precio que de verdad le corresponde a
// quien compra, si el producto sigue activo y los datos reales de cada
// presentación. El checkout nunca usa el precio que manda el navegador; esto
// solo decide si se puede seguir o si hay que avisar que algo cambió.

export interface ClientCartItem {
  variantId: string;
  unitPrice: number;
  quantity: number;
}

export interface CartQuote {
  variant_id: string;
  product_name: string;
  variant_label: string | null;
  sku: string;
  unit_price: number | string;
  stock: number;
  disponible: boolean;
}

export interface QuotedLine {
  variantId: string;
  productName: string;
  variantLabel: string | null;
  sku: string;
  unitPrice: number;
  quantity: number;
}

export type PriceCheckResult =
  | { ok: true; lines: QuotedLine[]; subtotal: number }
  | { ok: false; reason: "unavailable" | "prices_changed" };

const TOLERANCE = 0.005;

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function checkCartAgainstQuote(items: ClientCartItem[], quotes: CartQuote[]): PriceCheckResult {
  const byVariant = new Map(quotes.map((quote) => [quote.variant_id, quote]));
  const lines: QuotedLine[] = [];
  let pricesChanged = false;

  for (const item of items) {
    const quote = byVariant.get(item.variantId);
    if (!quote || !quote.disponible) return { ok: false, reason: "unavailable" };
    const unitPrice = Number(quote.unit_price);
    if (!Number.isFinite(unitPrice)) return { ok: false, reason: "unavailable" };
    if (Math.abs(unitPrice - item.unitPrice) > TOLERANCE) pricesChanged = true;
    lines.push({
      variantId: item.variantId,
      productName: quote.product_name,
      variantLabel: quote.variant_label,
      sku: quote.sku,
      unitPrice,
      quantity: item.quantity,
    });
  }

  if (pricesChanged) return { ok: false, reason: "prices_changed" };
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
  return { ok: true, lines, subtotal };
}

/** Cantidades válidas: enteros positivos. */
export function hasValidQuantities(items: ClientCartItem[]): boolean {
  return items.every((item) => Number.isInteger(item.quantity) && item.quantity > 0);
}
