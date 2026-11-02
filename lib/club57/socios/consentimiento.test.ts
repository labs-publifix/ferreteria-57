import { describe, expect, it } from "vitest";
import { esMedioConsentimiento, medioLabel, normalizarMedio } from "./consentimiento";
import { normalizarSocio } from "./normalize";

describe("medio de autorización", () => {
  it("lee los nombres de la plantilla y variantes comunes", () => {
    expect(normalizarMedio("WhatsApp").value).toBe("whatsapp");
    expect(normalizarMedio("Firma en papel").value).toBe("firma");
    expect(normalizarMedio("Correo electrónico").value).toBe("correo");
    expect(normalizarMedio("EMAIL").value).toBe("correo");
    expect(normalizarMedio("Verbal (en persona o por teléfono)").value).toBe("verbal");
    expect(normalizarMedio("Verbal").value).toBe("verbal");
    expect(normalizarMedio("  ").value).toBeNull();
  });

  it("rechaza un medio desconocido con un mensaje claro", () => {
    const result = normalizarMedio("paloma mensajera");
    expect(result.value).toBeNull();
    expect(result.error).toMatch(/no válido/);
  });

  it("valida y etiqueta los valores guardados", () => {
    expect(esMedioConsentimiento("whatsapp")).toBe(true);
    expect(esMedioConsentimiento("fax")).toBe(false);
    expect(esMedioConsentimiento(undefined)).toBe(false);
    expect(medioLabel("firma")).toBe("Firma en papel");
    expect(medioLabel(null)).toBeNull();
  });
});

describe("normalizarSocio con medio de autorización", () => {
  const base = { nombre_comercial: "Taller Uno", giro: "Taller automotriz", telefono: "4421234567", calle: "Centro", colonia: "Centro", municipio: "Querétaro" };

  it("guarda el medio solo cuando hay autorización", () => {
    expect(normalizarSocio({ ...base, consentimiento: "SI", medio_consentimiento: "WhatsApp" }).data.consentimiento_medio).toBe("whatsapp");
    expect(normalizarSocio({ ...base, consentimiento: "NO", medio_consentimiento: "WhatsApp" }).data.consentimiento_medio).toBeNull();
    expect(normalizarSocio({ ...base, consentimiento: "", medio_consentimiento: "WhatsApp" }).data.consentimiento_medio).toBeNull();
  });

  it("avisa cuando una autorización llega sin medio o con uno no válido", () => {
    const sinMedio = normalizarSocio({ ...base, consentimiento: "SI" });
    expect(sinMedio.data.consentimiento).toBe(true);
    expect(sinMedio.warnings.some((w) => w.startsWith("Autorización sin medio"))).toBe(true);
    const invalido = normalizarSocio({ ...base, consentimiento: "SI", medio_consentimiento: "fax" });
    expect(invalido.data.consentimiento_medio).toBeNull();
    expect(invalido.warnings.some((w) => w.includes("Se registra sin medio"))).toBe(true);
  });
});
