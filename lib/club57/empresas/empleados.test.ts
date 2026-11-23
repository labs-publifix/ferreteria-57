import { describe, expect, it } from "vitest";
import { calcularLinea, claveColumna, marcarDuplicados, validarFilaPrecarga } from "./empleados";

describe("calcularLinea", () => {
  it("porcentaje del salario, sin tope del 30 %", () => {
    expect(calcularLinea("porcentaje", 60, 10000)).toEqual({ linea: 6000 });
    expect(calcularLinea("porcentaje", 100, 10000)).toEqual({ linea: 10000 });
  });
  it("nunca más del 100 % del salario", () => {
    expect(calcularLinea("porcentaje", 120, 10000)).toHaveProperty("error");
    expect(calcularLinea("monto", 12000, 10000)).toHaveProperty("error");
  });
  it("monto fijo sin salario es válido; porcentaje sin salario no", () => {
    expect(calcularLinea("monto", 3000, null)).toEqual({ linea: 3000 });
    expect(calcularLinea("porcentaje", 30, null)).toHaveProperty("error");
  });
});

describe("precarga", () => {
  it("lee porcentajes y montos con formato", () => {
    const a = validarFilaPrecarga(2, { correo: "Rosa@Orion.MX", salario: "$12,000", linea: "50 %" }, false);
    expect("ok" in a && a.ok).toMatchObject({ correo: "rosa@orion.mx", linea_tipo: "porcentaje", linea_valor: 50, linea_credito: 6000 });
    const b = validarFilaPrecarga(3, { numero: "E-1", linea: "$3,000" }, false);
    expect("ok" in b && b.ok).toMatchObject({ linea_tipo: "monto", linea_credito: 3000, salario_mensual: null });
  });
  it("reporta errores comprensibles", () => {
    expect(validarFilaPrecarga(2, { linea: "10%" }, false)).toEqual({ error: { fila: 2, motivo: "Falta el correo o el número de empleado." } });
    expect(validarFilaPrecarga(2, { correo: "a@b.mx", linea: "10%" }, true)).toEqual({ error: { fila: 2, motivo: "Falta el número de empleado." } });
    expect(validarFilaPrecarga(2, { correo: "a@b.mx", linea: "" }, false)).toEqual({ error: { fila: 2, motivo: "Falta la línea (porcentaje o monto)." } });
  });
  it("detecta repetidos y normaliza encabezados", () => {
    const fila = (n: number, correo: string) => ({ fila: n, nombre: null, correo, numero_empleado: null, salario_mensual: null, linea_tipo: "monto" as const, linea_valor: 1, linea_credito: 1 });
    const r = marcarDuplicados([fila(2, "a@b.mx"), fila(3, "a@b.mx")]);
    expect(r.validas).toHaveLength(1);
    expect(r.errores[0].fila).toBe(3);
    expect(claveColumna("Número de empleado")).toBe("numero de empleado");
    expect(claveColumna("Salario")).toBe("salario mensual neto");
    expect(claveColumna("Línea")).toBe("linea");
  });
});
