import { describe, expect, it } from "vitest";
import {
  club57AnotarCorrecciones,
  club57MotivoTexto,
  diasNaturalesEntre,
  fechaLocalTienda,
  type Club57LedgerMovimiento,
} from "./correcciones";

describe("fechaLocalTienda", () => {
  it("usa el huso de Querétaro, no UTC", () => {
    // 3 oct 2026, 02:30 UTC = 2 oct 2026, 20:30 en Querétaro (UTC-6).
    expect(fechaLocalTienda("2026-10-03T02:30:00Z")).toBe("2026-10-02");
    expect(fechaLocalTienda("2026-10-03T07:00:00Z")).toBe("2026-10-03");
  });
});

describe("diasNaturalesEntre", () => {
  it("cuenta días de calendario", () => {
    expect(diasNaturalesEntre("2026-10-01", "2026-10-01")).toBe(0);
    expect(diasNaturalesEntre("2026-10-01", "2026-10-08")).toBe(7);
    expect(diasNaturalesEntre("2026-09-28", "2026-10-06")).toBe(8);
  });
});

describe("club57MotivoTexto", () => {
  it("usa la etiqueta, o la nota cuando el motivo es «Otro»", () => {
    expect(club57MotivoTexto("producto_danado", null)).toBe("Producto dañado");
    expect(club57MotivoTexto("otro", "  Cambió de proveedor ")).toBe("Cambió de proveedor");
    expect(club57MotivoTexto("otro", "")).toBe("Otro");
    expect(club57MotivoTexto(null, null)).toBeNull();
  });
});

describe("club57AnotarCorrecciones", () => {
  const base = (row: Partial<Club57LedgerMovimiento> & { id: string }): Club57LedgerMovimiento => ({
    cantidad: 10,
    tipo: "compra_manual",
    estado: "disponible",
    created_at: "2026-10-01T18:00:00Z",
    ...row,
  });

  it("compra sin cambios: corregible dentro del plazo (día 7 incluido)", () => {
    const info = club57AnotarCorrecciones([base({ id: "a" })], "2026-10-08").get("a")!;
    expect(info.corregible).toBe(true);
    expect(info.dentroDePlazo).toBe(true);
    expect(info.estadoCompra).toBeNull();
  });

  it("día 8: fuera del plazo", () => {
    const info = club57AnotarCorrecciones([base({ id: "a" })], "2026-10-09").get("a")!;
    expect(info.diasDesdeCompra).toBe(8);
    expect(info.dentroDePlazo).toBe(false);
  });

  it("compra cancelada: ya no es corregible y queda ligada a su compensatorio", () => {
    const rows = [
      base({ id: "a" }),
      base({ id: "x", tipo: "cancelacion_compra", cantidad: -10, anula_a: "a", motivo: "producto_danado" }),
    ];
    const info = club57AnotarCorrecciones(rows, "2026-10-02");
    expect(info.get("a")!.estadoCompra).toBe("cancelada");
    expect(info.get("a")!.corregible).toBe(false);
    expect(info.get("x")!.compraAnulada?.id).toBe("a");
    expect(info.get("x")!.corregible).toBe(false);
  });

  it("compra corregida: el reemplazo cuenta el plazo desde la compra original", () => {
    const rows = [
      base({ id: "a" }),
      base({ id: "x", tipo: "cancelacion_compra", cantidad: -10, anula_a: "a", created_at: "2026-10-05T18:00:00Z" }),
      base({ id: "b", cantidad: 5, corrige_a: "a", created_at: "2026-10-05T18:00:00Z" }),
    ];
    const info = club57AnotarCorrecciones(rows, "2026-10-09");
    expect(info.get("a")!.estadoCompra).toBe("corregida");
    expect(info.get("a")!.reemplazo?.id).toBe("b");
    expect(info.get("b")!.original?.id).toBe("a");
    expect(info.get("b")!.corregible).toBe(true);
    expect(info.get("b")!.fechaCompraRaiz).toBe("2026-10-01T18:00:00Z");
    expect(info.get("b")!.dentroDePlazo).toBe(false);
  });

  it("solo las compras en tienda son corregibles", () => {
    const rows = [base({ id: "o", tipo: "compra_online" }), base({ id: "r", tipo: "referido_bono" })];
    const info = club57AnotarCorrecciones(rows, "2026-10-02");
    expect(info.get("o")!.corregible).toBe(false);
    expect(info.get("r")!.corregible).toBe(false);
  });
});
