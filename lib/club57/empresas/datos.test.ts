import { describe, expect, it } from "vitest";
import { diaCorteLabel, nominaLabel, validarConvenio, validarDatosEmpresa } from "./datos";

const base = {
  razon_social: " Acme  Construcciones SA de CV ",
  nombre_comercial: "Acme",
  rfc: "acm-010101-ab1",
  giro: "Construcción",
  num_empleados: "120",
  regimen_fiscal: "601 General de Ley",
  cp_fiscal: "76030",
  uso_cfdi: "G03 Gastos en general",
  correo_facturas: "Facturas@Acme.mx",
  domicilio_entrega: "",
  responsable_nombre: "Ana Ruiz",
  responsable_puesto: "Recursos Humanos",
  responsable_correo: "ana@acme.mx",
  responsable_telefono: "+52 442 123 4567",
};

describe("validarDatosEmpresa", () => {
  it("normaliza RFC, teléfono, correos y espacios", () => {
    const r = validarDatosEmpresa(base, { estricto: true });
    expect("datos" in r && r.datos).toMatchObject({
      razon_social: "Acme Construcciones SA de CV",
      rfc: "ACM010101AB1",
      responsable_telefono: "4421234567",
      correo_facturas: "facturas@acme.mx",
      num_empleados: 120,
      domicilio_entrega: null,
    });
  });

  it("en el formulario público exige los datos fiscales", () => {
    const r = validarDatosEmpresa({ ...base, rfc: "", regimen_fiscal: "", responsable_telefono: "123" }, { estricto: true });
    expect("errores" in r && Object.keys(r.errores).sort()).toEqual(["regimen_fiscal", "responsable_telefono", "rfc"]);
  });

  it("en el panel los datos fiscales son opcionales, pero si vienen se validan", () => {
    const min = { razon_social: "Acme SA", nombre_comercial: "Acme", responsable_nombre: "Ana", responsable_correo: "ana@acme.mx" };
    expect("datos" in validarDatosEmpresa(min, { estricto: false })).toBe(true);
    const r = validarDatosEmpresa({ ...min, rfc: "XX" }, { estricto: false });
    expect("errores" in r && r.errores.rfc).toBeTruthy();
  });
});

describe("validarConvenio", () => {
  it("acepta un convenio completo y limpia los días que no aplican", () => {
    const r = validarConvenio({
      limite_credito: "50,000",
      dia_corte: "0",
      plazo_pago_dias: "15",
      plazo_autorizacion_dias: "5",
      nomina_frecuencia: "quincenal",
      nomina_dia_semana: "5",
      nomina_dia_mes: "10",
      descuentos_por_compra: "4",
      politica_porcentaje: "60",
    });
    expect("convenio" in r && r.convenio).toMatchObject({
      limite_credito: 50000,
      dia_corte: 0,
      nomina_dia_semana: null,
      nomina_dia_mes: null,
      descuentos_por_compra: 4,
      politica_porcentaje: 60,
    });
  });

  it("rechaza valores fuera de rango", () => {
    const r = validarConvenio({ dia_corte: "31", descuentos_por_compra: "0", politica_porcentaje: "150", nomina_frecuencia: "semanal" });
    expect("errores" in r && Object.keys(r.errores).sort()).toEqual([
      "descuentos_por_compra",
      "dia_corte",
      "nomina_dia_semana",
      "politica_porcentaje",
    ]);
  });
});

describe("etiquetas", () => {
  it("describe corte y nómina", () => {
    expect(diaCorteLabel(0)).toBe("Último día del mes");
    expect(diaCorteLabel(15)).toBe("Día 15 de cada mes");
    expect(nominaLabel("semanal", 5, null)).toBe("Semanal · cada viernes");
    expect(nominaLabel("mensual", null, 0)).toBe("Mensual · último día del mes");
    expect(nominaLabel(null, null, null)).toBe("Sin definir");
  });
});

import { describirCambiosConvenio } from "./cambios";

describe("describirCambiosConvenio", () => {
  it("lista solo lo que cambió, en lenguaje claro", () => {
    const antes = {
      limite_credito: 50000, dia_corte: 0, plazo_pago_dias: 15, plazo_autorizacion_dias: 5, exige_numero_empleado: false,
      nomina_frecuencia: "quincenal" as const, nomina_dia_semana: null, nomina_dia_mes: null, descuentos_por_compra: 1, politica_porcentaje: null,
    };
    expect(describirCambiosConvenio(antes, { ...antes })).toEqual([]);
    expect(describirCambiosConvenio(antes, { ...antes, limite_credito: 80000, descuentos_por_compra: 4 })).toEqual([
      "Límite de crédito: $50,000.00 → $80,000.00",
      "Descuentos por compra: 1 → 4",
    ]);
  });
});
