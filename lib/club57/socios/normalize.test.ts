import { describe, expect, it } from "vitest";
import {
  claveNombreCalle,
  esGiroPorDefinir,
  formatoTitulo,
  normalizarCorreo,
  normalizarCp,
  normalizarEstado,
  normalizarSocio,
  normalizarTelefono,
} from "./normalize";
import { AVATAR_PALETTE, partnerAvatarColor, partnerInitials } from "./avatar";

describe("normalizarTelefono", () => {
  it("deja 10 dígitos y quita 52 y 521", () => {
    expect(normalizarTelefono("442 301 5895").value).toBe("4423015895");
    expect(normalizarTelefono("+52 442 301 5895").value).toBe("4423015895");
    expect(normalizarTelefono("5214423015895").value).toBe("4423015895");
    expect(normalizarTelefono("(442) 301-58-95").value).toBe("4423015895");
  });
  it("rechaza lo que no da 10 dígitos y acepta vacío", () => {
    expect(normalizarTelefono("44230158").error).toMatch(/10 dígitos/);
    expect(normalizarTelefono("").value).toBeNull();
  });
});

describe("normalizarCorreo", () => {
  it("pasa a minúsculas y valida", () => {
    expect(normalizarCorreo(" Ventas@Taller.MX ").value).toBe("ventas@taller.mx");
    expect(normalizarCorreo("sin-arroba.com").error).toMatch(/no válido/);
  });
});

describe("normalizarCp y normalizarEstado", () => {
  it("CP de 5 dígitos, también si Excel lo guardó como número", () => {
    expect(normalizarCp("76030").value).toBe("76030");
    expect(normalizarCp("76030.0").value).toBe("76030");
    expect(normalizarCp("7603").error).toMatch(/5 dígitos/);
  });
  it("Querétaro por defecto y homologado", () => {
    expect(normalizarEstado("")).toBe("Querétaro");
    expect(normalizarEstado("queretaro")).toBe("Querétaro");
    expect(normalizarEstado("QRO")).toBe("Querétaro");
  });
});

describe("formatoTitulo", () => {
  it("convierte textos todo en mayúsculas o minúsculas", () => {
    expect(formatoTitulo("TALLER EL GALLO")).toBe("Taller el Gallo");
    expect(formatoTitulo("reforma agraria 5ta sección")).toBe("Reforma Agraria 5ta Sección");
    expect(formatoTitulo("fray juan de san miguel")).toBe("Fray Juan de San Miguel");
  });
  it("respeta siglas y marcas que ya mezclan mayúsculas", () => {
    expect(formatoTitulo("HICA Operaciones")).toBe("HICA Operaciones");
    expect(formatoTitulo("Fix-ride")).toBe("Fix-ride");
    expect(formatoTitulo("VEM Tooling México")).toBe("VEM Tooling México");
  });
});

describe("normalizarSocio", () => {
  it("normaliza una fila completa sin errores", () => {
    const result = normalizarSocio({
      nombre_comercial: "STOP CARS",
      giro: "taller automotriz",
      telefono: "52 442 127 6682",
      correo: "RobertHPach.911@gmail.com",
      calle: "jesús urrueta",
      num_ext: "s/n",
      colonia: "reforma agraria",
      cp: "76086",
      municipio: "querétaro",
      consentimiento: "SI",
    });
    expect(result.errors).toEqual([]);
    expect(result.data).toMatchObject({
      nombre_comercial: "Stop Cars",
      giro: "Taller automotriz",
      telefono: "4421276682",
      correo: "roberthpach.911@gmail.com",
      calle: "Jesús Urrueta",
      num_ext: "S/N",
      municipio: "Querétaro",
      estado: "Querétaro",
      consentimiento: true,
    });
  });

  it("marca error sin nombre, y advertencias con giro por definir o fuera de Querétaro", () => {
    expect(normalizarSocio({ nombre_comercial: "" }).errors).toContain("Falta el nombre comercial.");
    const pendiente = normalizarSocio({ nombre_comercial: "Grupo Vega", giro: "Por definir", estado: "Jalisco" });
    expect(pendiente.data.giro).toBeNull();
    expect(pendiente.warnings.join(" ")).toMatch(/Giro por definir/);
    expect(pendiente.warnings.join(" ")).toMatch(/Querétaro/);
  });

  it("un segundo correo inválido es advertencia y se descarta", () => {
    const result = normalizarSocio({ nombre_comercial: "Grafiqro", correo: "a@b.mx", correo_2: "malo" });
    expect(result.errors).toEqual([]);
    expect(result.data.correo_2).toBeNull();
    expect(result.warnings.join(" ")).toMatch(/segundo correo/);
  });

  it("guarda NOTAS como notas internas y no inventa consentimiento", () => {
    const result = normalizarSocio({ nombre_comercial: "Grafiqro", notas: "Revisar colonia." });
    expect(result.data.notas_internas).toBe("Revisar colonia.");
    expect(result.data.consentimiento).toBeNull();
  });
});

describe("esGiroPorDefinir y claveNombreCalle", () => {
  it("reconoce el giro pendiente", () => {
    expect(esGiroPorDefinir("Por definir")).toBe(true);
    expect(esGiroPorDefinir("")).toBe(true);
    expect(esGiroPorDefinir("Herrería")).toBe(false);
  });
  it("compara nombre + calle sin acentos ni mayúsculas", () => {
    expect(claveNombreCalle("Taller Gudiños", "Plan de Ayala")).toBe(claveNombreCalle("TALLER GUDIÑOS", "plan de ayala"));
    expect(claveNombreCalle("Taller", null)).toBeNull();
  });
});

describe("avatar de iniciales", () => {
  it("toma las iniciales significativas", () => {
    expect(partnerInitials("Taller El Gallo")).toBe("TG");
    expect(partnerInitials("Grafiqro")).toBe("GR");
    expect(partnerInitials("Vidrios y Aluminios García")).toBe("VA");
  });
  it("el color es determinista y siempre de la paleta", () => {
    expect(partnerAvatarColor("Stop Cars")).toBe(partnerAvatarColor("STOP CARS"));
    expect(AVATAR_PALETTE).toContain(partnerAvatarColor("Hotel Crown Victoria"));
  });
});

import { detectarTipoLogo, svgInseguro, validarLogo } from "./logo";

describe("validación de logos", () => {
  const enc = (text: string) => new TextEncoder().encode(text);
  it("detecta el tipo por la firma del archivo, no por la extensión", () => {
    expect(detectarTipoLogo(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectarTipoLogo(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectarTipoLogo(enc("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(detectarTipoLogo(enc('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBe("image/svg+xml");
    expect(detectarTipoLogo(enc("%PDF-1.7"))).toBeNull();
  });
  it("rechaza SVG con scripts o eventos y archivos de más de 2 MB", () => {
    expect(svgInseguro('<svg><script>alert(1)</script></svg>')).toBe(true);
    expect(svgInseguro('<svg onload="x()"></svg>')).toBe(true);
    expect(svgInseguro('<svg><circle r="4"/></svg>')).toBe(false);
    expect(validarLogo(enc('<svg onload="x()"></svg>')).ok).toBe(false);
    const grande = new Uint8Array(2 * 1024 * 1024 + 1);
    grande.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validarLogo(grande)).toEqual({ ok: false, error: "El logotipo pesa más de 2 MB." });
  });
});
