import { expect, test } from "vitest";
import { buildArticles } from "./build";
import { linkStatus, linkSummary, topicLinkReport } from "./links";
import type { PlannedLink } from "./sources";
import { fixtureArticle } from "./test-fixtures";

const NOW = new Date("2026-10-15T12:00:00-06:00");
const link = (id: string, origen: string, destino: string): PlannedLink => ({
  id, origen, destino, ancla: "ancla", tipo: "Relacionado", cuando: "", fecha: "2026-10-13", estado: "pendiente",
});
const article = (topicId: string, publishAt: string, intro = "Intro.") =>
  fixtureArticle({ topicId, slug: topicId.toLowerCase(), publishAt, updatedAt: publishAt, intro });

function map(...items: ReturnType<typeof article>[]) {
  return new Map(buildArticles(items.map((a) => ({ file: a.slug as string, article: a }))).map((a) => [a.topicId, a]));
}

test("futuro si falta escribir el origen o el destino", () => {
  expect(linkStatus(link("E1", "B01", "B02"), map(article("B01", "2026-10-09T08:00:00-06:00")), NOW)).toBe("futuro");
});

test("cumplido si el origen ya lleva [[destino]]", () => {
  const articles = map(article("B02", "2026-10-09T08:00:00-06:00"), article("B01", "2026-10-09T08:00:00-06:00", "Ver [[B02|herramientas]]."));
  expect(linkStatus(link("E1", "B01", "B02"), articles, NOW)).toBe("cumplido");
});

test("falta si el destino ya salió; esperando si sale después y no se ha publicado", () => {
  const articles = map(article("B01", "2026-10-09T08:00:00-06:00"), article("B09", "2026-10-13T08:00:00-06:00"), article("B20", "2026-11-07T08:00:00-06:00"));
  expect(linkStatus(link("E1", "B01", "B09"), articles, NOW)).toBe("falta");
  expect(linkStatus(link("E2", "B01", "B20"), articles, NOW)).toBe("esperando");
});

test("reporte por artículo: (a) salientes, (b) ida y vuelta, (c) futuros", () => {
  const articles = map(article("B03", "2026-10-09T08:00:00-06:00"), article("B09", "2026-10-13T08:00:00-06:00"));
  const links = [link("E16", "B03", "B09"), link("E18", "B09", "B03"), link("E60", "B03", "B20")];
  const report = topicLinkReport("B09", links, articles, NOW);
  expect(report.outgoing.map((c) => [c.link.id, c.status])).toEqual([["E18", "falta"]]);
  expect(report.incoming.map((c) => [c.link.id, c.status])).toEqual([["E16", "falta"]]);
  expect(topicLinkReport("B03", links, articles, NOW).future.map((c) => c.link.id)).toEqual(["E60"]);
});

test("resumen global y porcentaje de cumplimiento", () => {
  const articles = map(article("B02", "2026-10-09T08:00:00-06:00"), article("B01", "2026-10-09T08:00:00-06:00", "Ver [[B02|x]]."));
  const summary = linkSummary([link("E1", "B01", "B02"), link("E2", "B02", "B01"), link("E3", "B01", "B05")], articles, NOW);
  expect(summary.byStatus).toEqual({ cumplido: 1, falta: 1, esperando: 0, futuro: 1 });
  expect(summary.compliance).toBe(0.5);
  expect(linkSummary([link("E3", "B01", "B05")], articles, NOW).compliance).toBeNull();
});
