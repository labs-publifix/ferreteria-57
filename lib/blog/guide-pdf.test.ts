import { PDFDocument } from "pdf-lib";
import { describe, expect, test } from "vitest";
import { GUIDE_SOURCES } from "@/content/blog/_guides";
import { guideArticleUrl, guideFileName, renderGuidePdf } from "./guide-pdf";
import { guideSchema } from "./guide-schema";
import { fixtureGuide } from "./test-fixtures";

const B03 = guideSchema.parse(GUIDE_SOURCES.find((source) => source.file === "como-escoger-broca-correcta-para-cada-material")!.guide);

describe("PDF de la guía", () => {
  test("B03: portada + 1 página tipo cartel, carta, sin desborde y en menos de 3 s", async () => {
    const started = performance.now();
    const result = await renderGuidePdf({ guide: B03, articleTitle: "Cómo escoger la broca", articleUrl: guideArticleUrl(B03.slug) });
    expect(performance.now() - started).toBeLessThan(3000);
    expect(result.pageCount).toBe(2);
    expect(result.overflowPages).toBe(0);
    expect(Buffer.from(result.bytes.slice(0, 5)).toString()).toBe("%PDF-");
    const doc = await PDFDocument.load(result.bytes);
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getSize()).toEqual({ width: 612, height: 792 });
    expect(doc.getTitle()).toMatch(/Guía Club 57/);
    expect(doc.getAuthor()).toBe("Equipo Ferretería 57");
  });

  test("contenido que no cabe: sigue en otra hoja (no se corta) y se reporta el desborde", async () => {
    const rows = Array.from({ length: 60 }, (_, i) => [`Material ${i}`, "Una broca con una descripción larga que ocupa varias líneas en la celda"]);
    const guide = guideSchema.parse(fixtureGuide({ paginas: [{ titulo: "Larga", bloques: [{ type: "tabla", columnas: ["Material", "Broca"], filas: rows }] }] }));
    const result = await renderGuidePdf({ guide, articleTitle: "Prueba", articleUrl: guideArticleUrl(guide.slug) });
    expect(result.overflowPages).toBeGreaterThan(0);
    expect(result.pageCount).toBe(2 + result.overflowPages);
  });

  test("nombre del archivo y URL pública del pie", () => {
    expect(guideFileName("tipos-de-taquetes")).toBe("guia-tipos-de-taquetes.pdf");
    expect(guideArticleUrl("tipos-de-taquetes")).toBe("https://ferreteria57.com/blog/tipos-de-taquetes");
  });
});
