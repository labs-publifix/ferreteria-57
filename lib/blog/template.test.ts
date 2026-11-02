import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, expect, test } from "vitest";
import { articleSchema } from "./article-schema";
import { checkContent } from "./quality";
import type { BacklogTopic } from "./sources";
import { articleTemplate, clusterSlugFor, PLACEHOLDER_PUBLISH_AT } from "./template";

const B09: BacklogTopic = {
  id: "B09",
  slug: "tipos-de-taquetes-tablaroca-concreto-ladrillo-hueco",
  titulo: "Tipos de taquetes: cuál usar en tablaroca, concreto sólido o ladrillo hueco",
  cluster: "Construcción, fijación y materiales",
  rol: "Satélite",
  tipo: "Fondo",
  keyword: "tipos de taquetes",
  fechaProgramada: "2026-10-13",
  guiaTitulo: "Guía de taquetes por tipo de muro",
};

const dir = mkdtempSync(path.join(__dirname, ".tmp-template-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

async function load(topic: BacklogTopic) {
  const file = path.join(dir, `${topic.slug}.ts`);
  writeFileSync(file, articleTemplate(topic, [{ id: "EN018", origen: "B09", destino: "B03", ancla: "tipos de brocas", tipo: "", cuando: "", fecha: "", estado: "" }]));
  return (await import(file)).default;
}

test("la plantilla pasa el esquema con los datos del backlog", async () => {
  const article = await load(B09);
  expect(articleSchema.safeParse(article).success).toBe(true);
  expect(article).toMatchObject({
    topicId: "B09",
    slug: B09.slug,
    title: B09.titulo,
    cluster: "construccion-fijacion-y-materiales",
    pillar: false,
    keyword: "tipos de taquetes",
    publishAt: "2026-10-13T08:00:00-06:00",
    guia: { titulo: "Guía de taquetes por tipo de muro" },
    relatedTopicIds: ["B03"],
  });
});

test("blog:check no deja publicar el borrador (TODO, h2 y FAQ)", async () => {
  const article = await load(B09);
  const [report] = checkContent([{ file: B09.slug, article }], [B09], [], new Date("2026-10-08T12:00:00-06:00"));
  expect(report.errors.join("\n")).toMatch(/Texto prohibido \(TODO\)/);
  expect(report.errors.join("\n")).toMatch(/mínimo 4/);
  expect(report.errors.join("\n")).toMatch(/FAQ con 0/);
});

test("sin fecha_programada usa el placeholder; pilar según el rol", async () => {
  const article = await load({ ...B09, id: "B57", slug: "reserva-x", fechaProgramada: "", rol: "Pilar" });
  expect(article.publishAt).toBe(PLACEHOLDER_PUBLISH_AT);
  expect(article.pillar).toBe(true);
});

test("clusterSlugFor resuelve el nombre del backlog", () => {
  expect(clusterSlugFor("Plomería y agua")).toBe("plomeria-y-agua");
  expect(clusterSlugFor("Jardinería")).toBeUndefined();
});
