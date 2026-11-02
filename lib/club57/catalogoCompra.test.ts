import { describe, expect, it } from "vitest";
import type { SearchResultItem } from "@/lib/catalog/search";
import { club57CompraDesdeCatalogo } from "./catalogoCompra";

const item = (over: Partial<SearchResultItem>): SearchResultItem => ({
  id: "1",
  slug: "taladro",
  name: "Taladro 1/2 Truper",
  brand: "Truper",
  clave: "101234",
  sku: "TAL-12",
  price: 1299,
  compareAtPrice: null,
  imageUrl: null,
  categoryName: "Herramienta eléctrica",
  inStock: true,
  ...over,
});

describe("club57CompraDesdeCatalogo", () => {
  it("usa nombre, clave y precio", () => {
    expect(club57CompraDesdeCatalogo(item({}))).toEqual({ producto: "Taladro 1/2 Truper", codigo: "101234", monto: "1299.00" });
  });
  it("sin clave usa el SKU", () => {
    expect(club57CompraDesdeCatalogo(item({ clave: null })).codigo).toBe("TAL-12");
    expect(club57CompraDesdeCatalogo(item({ clave: "  " })).codigo).toBe("TAL-12");
  });
  it("sin clave ni SKU deja el código vacío; sin precio, el monto vacío", () => {
    const r = club57CompraDesdeCatalogo(item({ clave: null, sku: null, price: 0 }));
    expect(r.codigo).toBe("");
    expect(r.monto).toBe("");
  });
});
