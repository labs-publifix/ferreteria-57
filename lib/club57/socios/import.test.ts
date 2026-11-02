import { describe, expect, it } from "vitest";
import { camposParaActualizar, clasificarFilas, reporteCsv, type ExistingPartner } from "./import";

const existente: ExistingPartner = {
  id: "11111111-1111-1111-1111-111111111111",
  nombre_comercial: "Stop Cars",
  telefono: "4421276682",
  correo: "roberthpach.911@gmail.com",
  correo_2: null,
  calle: "Jesús Urrueta",
  clave_origen: "1047DA",
};

describe("clasificarFilas", () => {
  it("clasifica válida, con advertencia y con error, con su motivo", () => {
    const { rows, summary } = clasificarFilas(
      [
        { rowNumber: 2, input: { nombre_comercial: "Taller Nuevo", giro: "Taller automotriz", telefono: "4420000001", correo: "a@taller.mx", calle: "Uno", colonia: "Centro", municipio: "Querétaro" } },
        { rowNumber: 3, input: { nombre_comercial: "Sin Giro", giro: "Por definir", telefono: "4420000002", calle: "Dos", colonia: "Centro", municipio: "Querétaro" } },
        { rowNumber: 4, input: { nombre_comercial: "", telefono: "4420000003" } },
        { rowNumber: 5, input: { nombre_comercial: "Teléfono Malo", telefono: "123" } },
      ],
      [],
      ["Taller automotriz"]
    );
    expect(rows.map((row) => row.estado)).toEqual(["valida", "advertencia", "error", "error"]);
    expect(rows[1].warnings.join(" ")).toMatch(/Giro por definir/);
    expect(rows[2].errors).toContain("Falta el nombre comercial.");
    expect(rows[3].errors.join(" ")).toMatch(/10 dígitos/);
    expect(summary).toMatchObject({ total: 4, validas: 1, advertencias: 1, errores: 2 });
  });

  it("detecta duplicados contra el directorio por clave, teléfono/correo o nombre + calle", () => {
    const { rows, summary } = clasificarFilas(
      [
        { rowNumber: 2, input: { nombre_comercial: "Stop Cars", clave_origen: "1047DA" } },
        { rowNumber: 3, input: { nombre_comercial: "Otro Nombre", telefono: "52 442 127 6682" } },
        { rowNumber: 4, input: { nombre_comercial: "STOP CARS", calle: "jesus urrueta" } },
      ],
      [existente],
      []
    );
    expect(rows.map((row) => row.duplicado?.motivo)).toEqual([
      "misma clave de origen",
      "mismo teléfono o correo",
      "mismo nombre comercial y calle",
    ]);
    expect(rows.every((row) => row.estado === "advertencia")).toBe(true);
    expect(summary.duplicados).toBe(3);
  });

  it("marca como error una fila repetida dentro del mismo archivo", () => {
    const { rows } = clasificarFilas(
      [
        { rowNumber: 2, input: { nombre_comercial: "Grafiqro", correo: "impresionez@yahoo.com.mx" } },
        { rowNumber: 7, input: { nombre_comercial: "Grafiqro Dos", correo: "IMPRESIONEZ@yahoo.com.mx" } },
      ],
      [],
      []
    );
    expect(rows[1].estado).toBe("error");
    expect(rows[1].errors[0]).toMatch(/fila 2/);
  });

  it("avisa los giros que se van a crear", () => {
    const { summary, rows } = clasificarFilas(
      [{ rowNumber: 2, input: { nombre_comercial: "Plomería Juárez", giro: "plomería", telefono: "4420000009" } }],
      [],
      ["Herrería"]
    );
    expect(rows[0].giroNuevo).toBe(true);
    expect(summary.girosNuevos).toEqual(["Plomería"]);
  });
});

describe("camposParaActualizar y reporteCsv", () => {
  it("solo actualiza lo que la fila trae, nunca borra con vacíos", () => {
    const { rows } = clasificarFilas([{ rowNumber: 2, input: { nombre_comercial: "Stop Cars", correo: "nuevo@stop.mx" } }], [], []);
    const campos = camposParaActualizar(rows[0].data);
    expect(campos).toMatchObject({ nombre_comercial: "Stop Cars", correo: "nuevo@stop.mx", estado: "Querétaro" });
    expect(campos).not.toHaveProperty("telefono");
  });
  it("arma el CSV con BOM y separador ; escapando comillas", () => {
    const csv = reporteCsv([{ rowNumber: 4, nombre: 'Taller "El Gallo"', estado: "Error", motivo: "Falta el nombre." }]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain('"4";"Taller ""El Gallo""";"Error";"Falta el nombre."');
  });
});

describe("duplicados que se actualizan", () => {
  it("no avisan datos faltantes: una celda vacía no borra lo guardado", () => {
    const { rows } = clasificarFilas([{ rowNumber: 2, input: { nombre_comercial: "Stop Cars", telefono: "4421276682" } }], [existente], []);
    expect(rows[0].warnings).toEqual(["Ya existe «Stop Cars» (mismo teléfono o correo)."]);
  });
});
