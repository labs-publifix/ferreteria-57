import { describe, expect, it } from "vitest";
import { checkCartAgainstQuote, hasValidQuantities, type CartQuote } from "./priceCheck";

const quote = (over: Partial<CartQuote> = {}): CartQuote => ({
  variant_id: "v1",
  product_name: "Martillo",
  variant_label: "Único",
  sku: "10079",
  unit_price: "165.00",
  stock: 10,
  disponible: true,
  ...over,
});

describe("checkCartAgainstQuote", () => {
  it("acepta el carrito cuando los precios coinciden y usa los datos del servidor", () => {
    const result = checkCartAgainstQuote([{ variantId: "v1", unitPrice: 165, quantity: 2 }], [quote()]);
    expect(result).toEqual({
      ok: true,
      subtotal: 330,
      lines: [{ variantId: "v1", productName: "Martillo", variantLabel: "Único", sku: "10079", unitPrice: 165, quantity: 2 }],
    });
  });

  it("detecta un precio distinto al que vio el cliente (cambio o manipulación)", () => {
    expect(checkCartAgainstQuote([{ variantId: "v1", unitPrice: 1, quantity: 1 }], [quote()])).toEqual({
      ok: false,
      reason: "prices_changed",
    });
  });

  it("rechaza productos que ya no están disponibles o no existen", () => {
    expect(checkCartAgainstQuote([{ variantId: "v1", unitPrice: 165, quantity: 1 }], [quote({ disponible: false })])).toEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(checkCartAgainstQuote([{ variantId: "v9", unitPrice: 165, quantity: 1 }], [quote()])).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("suma con redondeo a centavos", () => {
    const result = checkCartAgainstQuote(
      [{ variantId: "v1", unitPrice: 0.1, quantity: 3 }],
      [quote({ unit_price: "0.10" })]
    );
    expect(result.ok && result.subtotal).toBe(0.3);
  });
});

describe("hasValidQuantities", () => {
  it("solo acepta enteros positivos", () => {
    expect(hasValidQuantities([{ variantId: "v1", unitPrice: 1, quantity: 2 }])).toBe(true);
    expect(hasValidQuantities([{ variantId: "v1", unitPrice: 1, quantity: 0 }])).toBe(false);
    expect(hasValidQuantities([{ variantId: "v1", unitPrice: 1, quantity: 1.5 }])).toBe(false);
    expect(hasValidQuantities([{ variantId: "v1", unitPrice: 1, quantity: -1 }])).toBe(false);
  });
});
