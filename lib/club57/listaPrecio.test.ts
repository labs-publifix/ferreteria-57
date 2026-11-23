import { describe, expect, it } from "vitest";
import { listaPrecioLabel, parseListaPrecioFiltro } from "./listaPrecio";

describe("listaPrecio", () => {
  it("etiqueta para el personal", () => {
    expect(listaPrecioLabel(null)).toBe("Precio de tienda");
    expect(listaPrecioLabel(3)).toBe("Precio 3");
  });
  it("filtro del listado: valores desconocidos = todas", () => {
    expect(parseListaPrecioFiltro("con")).toBe("con");
    expect(parseListaPrecioFiltro("4")).toBe("4");
    expect(parseListaPrecioFiltro("9")).toBe("todas");
    expect(parseListaPrecioFiltro(undefined)).toBe("todas");
  });
});
