import { describe, expect, it } from "vitest";
import { agruparPorEmpleado, detallePorProducto, fechaCorta, periodoLabel, totalEnvios, type CicloLinea } from "./cortes";

const pedido = (over: Partial<CicloLinea>): CicloLinea => ({
  tipo: "pedido",
  order_id: "o1",
  order_number: "F57-1",
  fecha: "2026-11-10T16:00:00Z",
  empleado_id: "e1",
  empleado_nombre: "Rosa",
  numero_empleado: "7",
  status: "entregado",
  subtotal: 100,
  shipping_cost: 0,
  total: 100,
  items: [{ product_name: "Martillo", variant_label: "Único", sku: "100", quantity: 2, unit_price: 50 }],
  concepto: null,
  ...over,
});

describe("cortes", () => {
  it("agrupa por empleado y suma", () => {
    const g = agruparPorEmpleado([
      pedido({}),
      pedido({ order_number: "F57-2", total: 250.5, shipping_cost: 99 }),
      pedido({ empleado_id: "e2", empleado_nombre: "Ana", total: 10 }),
      { ...pedido({}), tipo: "ajuste", empleado_id: null, empleado_nombre: null, total: -50, concepto: "Saldo a favor" },
    ]);
    expect(g.map((e) => [e.nombre, e.pedidos.length, e.total])).toEqual([
      ["Ana", 1, 10],
      ["Rosa", 2, 350.5],
    ]);
  });

  it("detalle por producto y envíos", () => {
    const lineas = [
      pedido({}),
      pedido({
        shipping_cost: 99,
        items: [
          { product_name: "Martillo", variant_label: "Único", sku: "100", quantity: 1, unit_price: 50 },
          { product_name: "Pinza", variant_label: "8 in", sku: "200", quantity: 3, unit_price: 80 },
        ],
      }),
    ];
    expect(detallePorProducto(lineas)).toEqual([
      { sku: "200", producto: "Pinza (8 in)", cantidad: 3, importe: 240 },
      { sku: "100", producto: "Martillo", cantidad: 3, importe: 150 },
    ]);
    expect(totalEnvios(lineas)).toBe(99);
  });

  it("formatea periodos y fechas sin corrimiento de zona", () => {
    expect(periodoLabel("2026-11-01", "2026-11-30")).toBe("1 nov – 30 nov 2026");
    expect(fechaCorta("2026-12-15")).toBe("15 dic 2026");
  });
});
