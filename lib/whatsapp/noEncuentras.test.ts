import { describe, expect, it } from "vitest";
import { mensajeNoEncuentras, noEncuentrasWhatsAppUrl } from "./noEncuentras";

describe("¿No encuentras tu producto?", () => {
  it("incluye lo que buscó la persona", () => {
    expect(mensajeNoEncuentras({ busqueda: "  taladro   inalámbrico " })).toBe(
      "Hola, no encuentro un producto en la tienda en línea. Busqué: «taladro inalámbrico». ¿Me ayudan a conseguirlo?"
    );
  });

  it("usa la categoría si no hay búsqueda y agrega la empresa del colaborador", () => {
    expect(mensajeNoEncuentras({ categoria: "Herramienta", empresa: "Constructora Orión" })).toBe(
      "Hola, no encuentro un producto en la tienda en línea. Estaba viendo la categoría Herramienta. Soy colaborador de Constructora Orión (Club 57 Empresarial). ¿Me ayudan a conseguirlo?"
    );
  });

  it("arma el enlace al número de la tienda", () => {
    const url = noEncuentrasWhatsAppUrl({ busqueda: "pinzas" });
    expect(url.startsWith("https://wa.me/524427782708?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toContain("«pinzas»");
  });
});
