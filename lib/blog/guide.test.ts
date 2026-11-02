import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, test } from "vitest";
import { BlogContentError } from "./build";
import { buildGuides, guideSchema, guideStrings } from "./guide-schema";
import { checkContent } from "./quality";
import type { BacklogTopic } from "./sources";
import { guideTemplate } from "./template";
import { fixtureArticle, fixtureGuide } from "./test-fixtures";
import { GUIDE_SOURCES } from "@/content/blog/_guides";
import { ARTICLE_SOURCES } from "@/content/blog/_index";

const NOW = new Date("2026-10-08T12:00:00-06:00");
const TOPIC: BacklogTopic = {
  id: "B90", slug: "articulo-de-prueba", titulo: "Artículo de prueba", cluster: "Herramientas y mantenimiento", rol: "Satélite",
  tipo: "Corto", keyword: "prueba", fechaProgramada: "2026-10-13", guiaTitulo: "Guía de prueba",
};

function check(guides: { file: string; guide: unknown }[], article = fixtureArticle()) {
  return checkContent([{ file: "articulo-de-prueba", article }], [TOPIC], [], NOW, undefined, guides);
}

describe("esquema de la guía", () => {
  test("la guía mínima es válida", () => {
    expect(guideSchema.safeParse(fixtureGuide()).success).toBe(true);
  });

  test("de 1 a 3 páginas de contenido (2 a 4 con la portada)", () => {
    const page = fixtureGuide().paginas[0];
    expect(guideSchema.safeParse(fixtureGuide({ paginas: [] })).success).toBe(false);
    expect(guideSchema.safeParse(fixtureGuide({ paginas: [page, page, page] })).success).toBe(true);
    const tooMany = guideSchema.safeParse(fixtureGuide({ paginas: [page, page, page, page] }));
    expect(tooMany.success).toBe(false);
    expect(JSON.stringify(tooMany.error?.issues)).toMatch(/4 con la portada/);
  });

  test("filas de tabla, anchos y callout vacío se validan", () => {
    const bad = (bloque: unknown) => guideSchema.safeParse(fixtureGuide({ paginas: [{ titulo: "P", bloques: [bloque] }] })).success;
    expect(bad({ type: "tabla", columnas: ["A", "B"], filas: [["solo una"]] })).toBe(false);
    expect(bad({ type: "tabla", columnas: ["A", "B"], filas: [["a", "b"]], anchos: [1] })).toBe(false);
    expect(bad({ type: "callout", variante: "nota", titulo: "Sin cuerpo" })).toBe(false);
    expect(bad({ type: "pasos", items: [{ titulo: "Uno", texto: "a" }] })).toBe(false);
    expect(bad({ type: "foto", src: "x.jpg" })).toBe(false);
    expect(bad({ type: "consejo", texto: "Bien" })).toBe(true);
  });

  test("buildGuides rompe el build con una guía inválida o con slug distinto del archivo", () => {
    expect(() => buildGuides([{ file: "x", guide: { titulo: "" } }])).toThrow(BlogContentError);
    expect(() => buildGuides([{ file: "otro", guide: fixtureGuide() }])).toThrow(/no coincide con el nombre del archivo/);
    expect(buildGuides([{ file: "articulo-de-prueba", guide: fixtureGuide() }])).toHaveLength(1);
  });

  test("guideStrings recorre todos los textos", () => {
    const texts = guideStrings(guideSchema.parse(fixtureGuide()));
    expect(texts).toEqual(expect.arrayContaining(["Guía de prueba", "Material", "De punta", "Antes de taladrar", "Marca el punto."]));
  });
});

describe("blog:check con guías", () => {
  test("sin guía: ERROR del artículo", () => {
    const [report] = check([]);
    expect(report.errors.join("\n")).toMatch(/Falta la guía PDF content\/blog\/guides\/articulo-de-prueba.ts/);
  });

  test("guía con esquema inválido: ERROR", () => {
    const [report] = check([{ file: "articulo-de-prueba", guide: fixtureGuide({ paginas: [] }) }]);
    expect(report.errors.join("\n")).toMatch(/Guía con esquema inválido/);
  });

  test("texto prohibido en la guía: ERROR", () => {
    const guide = fixtureGuide({ subtitulo: "TODO pendiente" });
    const withPrice = fixtureGuide({ paginas: [{ titulo: "P", bloques: [{ type: "consejo", texto: "Cuesta $ 99" }] }] });
    expect(check([{ file: "articulo-de-prueba", guide }])[0].errors.join("\n")).toMatch(/Guía: Texto prohibido \(TODO\)/);
    expect(check([{ file: "articulo-de-prueba", guide: withPrice }])[0].errors.join("\n")).toMatch(/Guía: Texto prohibido \(precio/);
  });

  test("título, slug y topicId deben coincidir con el artículo", () => {
    const errors = check([{ file: "articulo-de-prueba", guide: fixtureGuide({ titulo: "Otra", topicId: "B91" }) }])[0].errors.join("\n");
    expect(errors).toMatch(/no coincide con guia.titulo/);
    expect(errors).toMatch(/topicId B91/);
  });

  test("guía válida: sin errores de guía; guía sin artículo: ERROR propio", () => {
    const reports = check([
      { file: "articulo-de-prueba", guide: fixtureGuide() },
      { file: "huerfana", guide: fixtureGuide({ slug: "huerfana" }) },
    ]);
    expect(reports[0].errors.filter((e) => /[Gg]uía/.test(e))).toEqual([]);
    expect(reports[1]).toMatchObject({ file: "guides/huerfana" });
    expect(reports[1].errors[0]).toMatch(/no tiene artículo/);
  });

  test("el contenido real del repo: cada artículo tiene guía válida", () => {
    const reports = checkContent(ARTICLE_SOURCES, [], [], NOW, undefined, GUIDE_SOURCES);
    const guideErrors = reports.flatMap((r) => r.errors.filter((e) => /[Gg]uía/.test(e)));
    expect(guideErrors).toEqual([]);
    expect(GUIDE_SOURCES.length).toBe(ARTICLE_SOURCES.length);
  });
});

describe("plantilla de guía (blog:new)", () => {
  const dir = mkdtempSync(path.join(__dirname, ".tmp-guide-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  test("pasa el esquema, pero blog:check la frena por los TODO", async () => {
    const file = path.join(dir, "articulo-de-prueba.ts");
    writeFileSync(file, guideTemplate(TOPIC));
    const guide = (await import(file)).default;
    expect(guideSchema.safeParse(guide).success).toBe(true);
    expect(guide).toMatchObject({ topicId: "B90", slug: "articulo-de-prueba", titulo: "Guía de prueba" });
    const errors = check([{ file: "articulo-de-prueba", guide }])[0].errors.join("\n");
    expect(errors).toMatch(/Guía: Texto prohibido \(TODO\)/);
  });
});
