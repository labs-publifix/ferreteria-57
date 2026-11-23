import { describe, expect, it } from "vitest";
import { paymentMatchesOrderTotal } from "./paymentAmount";

describe("paymentMatchesOrderTotal", () => {
  it("acepta el mismo monto, aunque venga como texto o con diferencia de redondeo", () => {
    expect(paymentMatchesOrderTotal(249.5, "249.50")).toBe(true);
    expect(paymentMatchesOrderTotal(249.505, 249.5)).toBe(true);
  });

  it("rechaza un pago menor o mayor al total del pedido", () => {
    expect(paymentMatchesOrderTotal(1, 249.5)).toBe(false);
    expect(paymentMatchesOrderTotal(300, 249.5)).toBe(false);
  });

  it("rechaza montos ausentes o inválidos", () => {
    expect(paymentMatchesOrderTotal(undefined, 249.5)).toBe(false);
    expect(paymentMatchesOrderTotal(null, 249.5)).toBe(false);
    expect(paymentMatchesOrderTotal("abc", 249.5)).toBe(false);
  });
});
