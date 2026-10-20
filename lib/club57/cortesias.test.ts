import { describe, expect, it } from "vitest";
import {
  club57MotivoCortesiaCliente,
  club57MotivoCortesiaTexto,
  esMovimientoCortesia,
  validarOtorgamiento,
} from "./cortesias";
import { club57AnotarCorrecciones } from "./correcciones";

describe("club57MotivoCortesiaTexto", () => {
  it("usa la etiqueta del personal, o la nota cuando el motivo es «Otro»", () => {
    expect(club57MotivoCortesiaTexto("promocion")).toBe("Promoción o dinámica");
    expect(club57MotivoCortesiaTexto("otorgado_por_error")).toBe("Se otorgaron por error");
    expect(club57MotivoCortesiaTexto("otro", "  Rifa del aniversario ")).toBe("Rifa del aniversario");
    expect(club57MotivoCortesiaTexto("otro", null)).toBe("Otro");
    expect(club57MotivoCortesiaTexto(null)).toBeNull();
  });
});

describe("club57MotivoCortesiaCliente", () => {
  it("muestra una etiqueta amable y nunca un motivo «Otro»", () => {
    expect(club57MotivoCortesiaCliente("compensacion")).toBe("Compensación");
    expect(club57MotivoCortesiaCliente("agradecimiento")).toBe("Agradecimiento por tu preferencia");
    expect(club57MotivoCortesiaCliente("otro")).toBeNull();
    expect(club57MotivoCortesiaCliente(undefined)).toBeNull();
  });
});

describe("esMovimientoCortesia", () => {
  it("reconoce el otorgamiento y su anulación", () => {
    expect(esMovimientoCortesia("cortesia")).toBe(true);
    expect(esMovimientoCortesia("anulacion_cortesia")).toBe(true);
    expect(esMovimientoCortesia("compra_manual")).toBe(false);
  });
});

describe("validarOtorgamiento", () => {
  const ok = { puntos: "50", motivo: "promocion", nota: "", max: 500 };

  it("acepta un otorgamiento válido, incluido el máximo exacto", () => {
    expect(validarOtorgamiento(ok)).toBeNull();
    expect(validarOtorgamiento({ ...ok, puntos: "500" })).toBeNull();
  });

  it("exige puntos enteros mayores a 0 y dentro del máximo", () => {
    expect(validarOtorgamiento({ ...ok, puntos: "0" })).toMatch(/mayor a 0/);
    expect(validarOtorgamiento({ ...ok, puntos: "12.5" })).toMatch(/entero/);
    expect(validarOtorgamiento({ ...ok, puntos: "-5" })).toMatch(/entero/);
    expect(validarOtorgamiento({ ...ok, puntos: "" })).toMatch(/entero/);
    expect(validarOtorgamiento({ ...ok, puntos: "501" })).toBe("El máximo por otorgamiento es de 500 puntos.");
  });

  it("exige motivo de la lista y nota con «Otro»", () => {
    expect(validarOtorgamiento({ ...ok, motivo: "" })).toBe("Elige el motivo.");
    expect(validarOtorgamiento({ ...ok, motivo: "producto_danado" })).toBe("Elige el motivo.");
    expect(validarOtorgamiento({ ...ok, motivo: "otro", nota: "  " })).toBe("Escribe el motivo en la nota.");
    expect(validarOtorgamiento({ ...ok, motivo: "otro", nota: "Rifa" })).toBeNull();
    expect(validarOtorgamiento({ ...ok, nota: "x".repeat(301) })).toMatch(/muy larga/);
  });
});

describe("cortesías en club57AnotarCorrecciones", () => {
  it("una cortesía anulada queda marcada y nunca es corregible", () => {
    const rows = [
      { id: "c1", cantidad: 100, tipo: "cortesia", estado: "disponible" as const, created_at: "2026-10-20T15:00:00Z" },
      {
        id: "a1",
        cantidad: -100,
        tipo: "anulacion_cortesia",
        estado: "disponible" as const,
        created_at: "2026-10-20T16:00:00Z",
        anula_a: "c1",
      },
    ];
    const info = club57AnotarCorrecciones(rows, "2026-10-20");
    expect(info.get("c1")?.anulacion?.id).toBe("a1");
    expect(info.get("c1")?.corregible).toBe(false);
    expect(info.get("a1")?.compraAnulada?.id).toBe("c1");
  });
});
