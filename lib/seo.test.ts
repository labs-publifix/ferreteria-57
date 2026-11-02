import { describe, expect, test } from "vitest";
import { buildPriceValidUntil, buildProductJsonLd } from "./seo";
import { buildMerchantReturnPolicy } from "./seoPolicies";
import type { Product } from "@/types/catalog";

const product: Product = {
  id: "p1",
  slug: "martillo",
  name: "Martillo",
  brand: "Truper",
  categoryId: "herramienta",
  shortDescription: "Martillo de uña.",
  technicalSpecs: [],
  images: [],
  variants: [{ id: "v1", sku: "M-1", label: "Único", price: 299, stock: 3 }],
  rating: 0,
  createdAt: "2026-09-10T00:00:00-06:00",
};

describe("datos estructurados de producto (Fichas de comerciantes)", () => {
  test("priceValidUntil: 31 de diciembre del año siguiente, en hora de Querétaro", () => {
    expect(buildPriceValidUntil(new Date("2026-10-12T12:00:00-06:00"))).toBe("2027-12-31");
    // 31 dic 2026 a las 23:00 en Querétaro ya es 1 ene 2027 en UTC: cuenta el año local.
    expect(buildPriceValidUntil(new Date("2027-01-01T05:00:00Z"))).toBe("2027-12-31");
    expect(buildPriceValidUntil(new Date("2027-01-01T06:30:00Z"))).toBe("2028-12-31");
  });

  test("el Offer lleva priceValidUntil y la política de devolución no exige un monto fijo", () => {
    const offer = buildProductJsonLd(product).offers;
    expect(offer.priceValidUntil).toMatch(/^\d{4}-12-31$/);
    expect(offer.hasMerchantReturnPolicy.returnFees).toBe("https://schema.org/ReturnFeesCustomerResponsibility");
    expect(buildMerchantReturnPolicy("https://ferreteria57.com")).not.toHaveProperty("returnShippingFeesAmount");
  });
});
