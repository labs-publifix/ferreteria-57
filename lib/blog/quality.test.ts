import { describe, expect, test } from "vitest";
import { checkContent, containsKeyword } from "./quality";
import type { BacklogTopic, PlannedLink } from "./sources";
import { fixtureArticle } from "./test-fixtures";

const NOW = new Date("2026-10-08T12:00:00-06:00");

const topic = (overrides: Partial<BacklogTopic> = {}): BacklogTopic => ({
  id: "B90",
  slug: "articulo-de-prueba",
  titulo: "Artículo de prueba",
  cluster: "Herramientas y mantenimiento",
  rol: "Satélite",
  tipo: "Corto",
  keyword: "llave inglesa",
  fechaProgramada: "2026-10-13",
  guiaTitulo: "Guía",
  ...overrides,
});

// Artículo que cumple todas las reglas de ERROR.
function good(overrides: Record<string, unknown> = {}) {
  return fixtureArticle({
    title: "Cómo usar una llave inglesa sin dañar tuercas",
    intro: "La llave inglesa es la herramienta más versátil de la caja.",
    blocks: [
      { type: "h2", text: "Qué es una llave inglesa" },
      { type: "p", text: "Texto." },
      { type: "h2", text: "Tamaños" },
      { type: "h2", text: "Cómo ajustarla" },
      { type: "h2", text: "Errores comunes" },
      { type: "cta" },
    ],
    faq: [
      { q: "¿Uno?", a: "Sí." },
      { q: "¿Dos?", a: "Sí." },
      { q: "¿Tres?", a: "Sí." },
    ],
    ...overrides,
  });
}

const run = (article: Record<string, unknown>, backlog = [topic()], links: PlannedLink[] = [], extra: Record<string, unknown>[] = []) =>
  checkContent(
    [article, ...extra].map((a) => ({ file: a.slug as string, article: a })),
    backlog,
    links,
    NOW
  );

describe("containsKeyword", () => {
  test("ignora acentos, mayúsculas y plurales", () => {
    expect(containsKeyword("Cómo escoger el tamaño y tipo de broca correcto", "tipos de brocas")).toBe(true);
    expect(containsKeyword("TIPOS DE BROCAS por material", "tipos de brocas")).toBe(true);
    expect(containsKeyword("Calibre de cables", "calibre de cable")).toBe(true);
  });
  test("exige la frase completa y en orden", () => {
    expect(containsKeyword("brocas de varios tipos", "tipos de brocas")).toBe(false);
    expect(containsKeyword("tipos de taquetes", "tipos de brocas")).toBe(false);
  });
});

describe("blog:check — errores", () => {
  test("un artículo bueno no tiene errores", () => {
    const [report] = run(good());
    expect(report.errors).toEqual([]);
  });

  test.each([
    ["esquema Zod", { seoTitle: "x".repeat(61) }, /Esquema inválido/],
    ["topicId fuera del backlog", { topicId: "B99" }, /no existe en supabase\/seed\/blog-backlog\.csv/],
    ["menos de 4 h2", { blocks: [{ type: "h2", text: "Qué es una llave inglesa" }, { type: "p", text: "x" }] }, /mínimo 4/],
    ["FAQ con menos de 3", { faq: [{ q: "¿?", a: "x" }] }, /FAQ con 1/],
    ["keyword fuera del título", { title: "Cómo apretar tuercas", seoTitle: "Apretar tuercas" }, /no aparece en title/],
    ["keyword fuera de la intro", { intro: "Una herramienta muy útil." }, /no aparece en la intro/],
    ["[VERIFICAR]", { intro: "La llave inglesa [VERIFICAR] dato." }, /\[VERIFICAR\]/],
    ["TODO", { intro: "La llave inglesa. TODO: revisar" }, /TODO/],
    ["lorem", { intro: "La llave inglesa lorem ipsum." }, /lorem/],
    ["norma NOM", { intro: "La llave inglesa cumple la NOM-001." }, /norma/],
    ["NMX", { intro: "La llave inglesa y la NMX-J-123." }, /norma/],
    ["IPESA", { intro: "La llave inglesa de IPESA." }, /IPESA/],
    ["Resend", { intro: "La llave inglesa y Resend." }, /Resend/],
    ["precio", { intro: "La llave inglesa cuesta $250." }, /precio/],
    ["categoría inexistente", { intro: "La llave inglesa en [herramientas](/categoria/llaves)." }, /categoría que no existe/],
    ["[[Bxx]] inexistente", { intro: "La llave inglesa y [[B77|otra]]." }, /no existe todavía/],
  ])("%s", (_name, overrides, message) => {
    const [report] = run(good(overrides));
    expect(report.errors.join("\n")).toMatch(message);
  });

  test("slug distinto del backlog", () => {
    const [report] = run(good(), [topic({ slug: "otro-slug" })]);
    expect(report.errors.join("\n")).toMatch(/no coincide con el del backlog/);
  });

  test("'todo' en minúsculas (palabra normal en español) no es error", () => {
    const [report] = run(good({ intro: "La llave inglesa sirve para todo tipo de tuercas." }));
    expect(report.errors).toEqual([]);
  });

  test("una categoría real del catálogo es válida", () => {
    const [report] = run(good({ intro: "La llave inglesa en [herramienta](/categoria/herramienta)." }));
    expect(report.errors).toEqual([]);
  });
});

describe("blog:check — advertencias", () => {
  test("publishAt distinto de la fecha del backlog muestra ambas", () => {
    const [report] = run(good({ publishAt: "2026-10-20T08:00:00-06:00", updatedAt: "2026-10-20T08:00:00-06:00" }));
    expect(report.warnings.join("\n")).toMatch(/20\/10\/2026.*13\/10\/2026/);
  });

  test("palabras fuera del rango del tipo (con 15 % de tolerancia)", () => {
    const [report] = run(good(), [topic({ tipo: "Pilar" })]);
    expect(report.warnings.join("\n")).toMatch(/se espera 2000–2500 \(con tolerancia: 1700–2875\)/);
  });

  test("Pilar o Fondo sin tabla, callout o CTA", () => {
    const [report] = run(good(), [topic({ tipo: "Fondo" })]);
    expect(report.warnings.join("\n")).toMatch(/Fondo sin tabla, callout/);
  });

  test("más de 12 enlaces internos", () => {
    const many = Array.from({ length: 13 }, (_, i) => `[enlace ${i}](/categoria/herramienta)`).join(" ");
    const [report] = run(good({ intro: `La llave inglesa. ${many}` }));
    expect(report.warnings.join("\n")).toMatch(/13 enlaces internos/);
  });

  test("menos de 2 relacionados publicados", () => {
    const [report] = run(good({ relatedTopicIds: ["B10", "B11"] }));
    expect(report.warnings.join("\n")).toMatch(/0 de 2 relatedTopicIds/);
  });

  test("falta un enlace de ida y vuelta del mapa (advertencia, no error)", () => {
    const other = fixtureArticle({ topicId: "B91", slug: "otro", publishAt: "2026-10-01T08:00:00-06:00", updatedAt: "2026-10-01T08:00:00-06:00" });
    const link: PlannedLink = { id: "EN900", origen: "B90", destino: "B91", ancla: "otro tema", tipo: "Relacionado", cuando: "Al redactar B90", fecha: "2026-10-13", estado: "pendiente" };
    const [report] = run(good(), [topic(), topic({ id: "B91", slug: "otro" })], [link], [other]);
    expect(report.errors).toEqual([]);
    expect(report.warnings.join("\n")).toMatch(/Falta el enlace a B91 .*\[\[B91\|otro tema\]\]/);
  });
});
