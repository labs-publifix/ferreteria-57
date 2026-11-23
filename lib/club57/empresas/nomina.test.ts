import { describe, expect, it } from "vitest";
import { agruparNominas, fechaNominaCorta, fechaNominaLabel, validarExcepciones, type PortalDescuento } from "./nomina";

const base = (over: Partial<PortalDescuento>): PortalDescuento => ({
  id: Math.random().toString(),
  fecha_nomina: "2026-11-30",
  nomina_estado: "pendiente",
  nomina_confirmada_at: null,
  tacita_at: "2026-12-04T06:00:00Z",
  empleado_id: "e1",
  empleado_nombre: "Rosa",
  empleado_correo: "rosa@x.mx",
  numero_empleado: "7",
  empleado_estado: "activo",
  order_number: "F57-A",
  numero: 1,
  de_total: 2,
  monto: 500,
  monto_aplicado: null,
  estado: "programado",
  ...over,
});

describe("nómina", () => {
  it("agrupa por fecha y empleado, separando por confirmar, próximas e historial", () => {
    const g = agruparNominas(
      [
        base({}),
        base({ order_number: "F57-B", monto: 250.5 }),
        base({ empleado_id: "e2", empleado_nombre: "Ana", monto: 100 }),
        base({ fecha_nomina: "2026-12-15", monto: 500 }),
        base({ fecha_nomina: "2026-11-15", nomina_estado: "tacita", estado: "aplicado", monto_aplicado: 500 }),
        base({ fecha_nomina: "2026-11-30", estado: "cancelado", monto: 999 }),
      ],
      "2026-11-30"
    );
    expect(g.porConfirmar).toHaveLength(1);
    const n = g.porConfirmar[0];
    expect(n.total).toBe(850.5);
    expect(n.empleados.map((e) => e.nombre)).toEqual(["Ana", "Rosa"]);
    expect(n.empleados[1].pedidos).toEqual(["F57-A", "F57-B"]);
    expect(g.proximas.map((x) => x.fecha)).toEqual(["2026-12-15"]);
    expect(g.historial[0]).toMatchObject({ fecha: "2026-11-15", estado: "tacita", aplicado: 500 });
  });

  it("en una nómina pendiente ignora lo cerrado por baja", () => {
    const g = agruparNominas([base({ estado: "baja" })], "2026-12-31");
    expect(g.porConfirmar).toHaveLength(0);
  });

  it("valida excepciones contra lo que tocaba", () => {
    const n = agruparNominas([base({})], "2026-11-30").porConfirmar[0];
    expect(validarExcepciones(n, [{ empleado_id: "e1", monto_aplicado: 300 }])).toBeNull();
    expect(validarExcepciones(n, [{ empleado_id: "e1", monto_aplicado: 0 }])).toBeNull();
    expect(validarExcepciones(n, [{ empleado_id: "e1", monto_aplicado: 600 }])).toMatch(/no puede ser mayor/);
    expect(validarExcepciones(n, [{ empleado_id: "e9", monto_aplicado: 1 }])).toMatch(/no está/);
  });

  it("formatea la fecha de nómina sin corrimiento de zona", () => {
    expect(fechaNominaLabel("2026-11-30")).toBe("lunes, 30 de noviembre");
    expect(fechaNominaCorta("2026-12-15")).toBe("15 dic");
  });
});
