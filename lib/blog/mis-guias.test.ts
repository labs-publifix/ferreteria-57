import { expect, test } from "vitest";
import { buildMisGuias } from "./mis-guias";

const NOW = new Date("2026-10-20T12:00:00-06:00");
const article = (slug: string, topicId: string, publishAt: string) => ({ slug, topicId, title: `Artículo ${topicId}`, publishAt });

test("solo publicados con guía, el más reciente primero, con Nueva/Descargada", () => {
  const list = buildMisGuias(
    [
      article("brocas", "B03", "2026-10-09T08:00:00-06:00"),
      article("taquetes", "B09", "2026-10-13T08:00:00-06:00"),
      article("futuro", "B20", "2026-11-01T08:00:00-06:00"),
      article("sin-guia", "B05", "2026-10-10T08:00:00-06:00"),
    ],
    [
      { slug: "brocas", titulo: "Tabla rápida" },
      { slug: "taquetes", titulo: "Guía de taquetes" },
      { slug: "futuro", titulo: "Aún no" },
    ],
    [
      { slug: "brocas", downloaded_at: "2026-10-15T10:00:00Z" },
      { slug: "brocas", downloaded_at: "2026-10-18T10:00:00Z" },
      { slug: "brocas", downloaded_at: "2026-10-16T10:00:00Z" },
    ],
    NOW
  );
  expect(list.map((guia) => guia.topicId)).toEqual(["B09", "B03"]);
  expect(list[0]).toMatchObject({ titulo: "Guía de taquetes", articuloHref: "/blog/taquetes", descargadaAt: null });
  expect(list[1].descargadaAt).toBe("2026-10-18T10:00:00Z");
});

test("sin publicados: lista vacía", () => {
  expect(buildMisGuias([article("futuro", "B20", "2099-12-31T08:00:00-06:00")], [{ slug: "futuro", titulo: "X" }], [], NOW)).toEqual([]);
});
