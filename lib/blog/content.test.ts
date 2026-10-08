import { describe, expect, test } from "vitest";
import { articleSchema } from "./article-schema";
import { buildArticles, getAllArticles } from "./content";
import { fixtureArticle } from "./test-fixtures";

const source = (overrides: Record<string, unknown> = {}) => {
  const article = fixtureArticle(overrides);
  return { file: article.slug as string, article };
};

describe("validación Zod", () => {
  test("acepta un artículo válido", () => {
    expect(articleSchema.safeParse(fixtureArticle()).success).toBe(true);
  });

  test.each([
    ["seoTitle > 60", { seoTitle: "x".repeat(61) }, "seoTitle"],
    ["meta corta", { metaDescription: "corta" }, "metaDescription"],
    ["meta larga", { metaDescription: "x".repeat(156) }, "metaDescription"],
    ["publishAt sin zona", { publishAt: "2026-10-13T08:00:00" }, "publishAt"],
    ["publishAt en UTC", { publishAt: "2026-10-13T14:00:00Z" }, "publishAt"],
    ["cluster desconocido", { cluster: "jardineria" }, "cluster"],
    ["slug con acentos", { slug: "guía" }, "slug"],
    ["slug reservado", { slug: "categoria" }, "slug"],
    ["slug reservado rss", { slug: "rss.xml" }, "slug"],
    ["campo de más", { extra: true }, ""],
    ["updatedAt antes de publishAt", { updatedAt: "2026-10-12T08:00:00-06:00" }, "updatedAt"],
    ["inline mal cerrado", { intro: "**sin cerrar" }, "intro"],
    ["bloque desconocido", { blocks: [{ type: "video", src: "x" }] }, "blocks"],
    ["dos CTA", { blocks: [{ type: "cta" }, { type: "cta" }] }, "blocks"],
    [
      "tabla con fila incompleta",
      { blocks: [{ type: "table", caption: "c", headers: ["a", "b"], rows: [["1"]] }] },
      "blocks.0.rows.0",
    ],
  ])("rechaza: %s", (_name, overrides, path) => {
    const result = articleSchema.safeParse(fixtureArticle(overrides));
    expect(result.success).toBe(false);
    if (!result.success && path) {
      expect(result.error.issues.some((issue) => issue.path.join(".").startsWith(path))).toBe(true);
    }
  });
});

describe("buildArticles", () => {
  test("calcula número, ids, TOC y minutos de lectura", () => {
    const [article] = buildArticles([
      source({
        topicId: "B03",
        blocks: [
          { type: "h2", text: "Madera" },
          { type: "h3", text: "Brocas de punta" },
          { type: "p", text: "palabra ".repeat(450) },
          { type: "h2", text: "Madera" },
        ],
      }),
    ]);
    expect(article.number).toBe("03");
    expect(article.headingIds).toEqual(["madera", "brocas-de-punta", undefined, "madera-2"]);
    expect(article.toc).toEqual([
      { id: "madera", text: "Madera" },
      { id: "madera-2", text: "Madera" },
    ]);
    expect(article.readingMinutes).toBe(3); // ~460 palabras / 200
  });

  test("respeta readingMinutes explícito", () => {
    expect(buildArticles([source({ readingMinutes: 12 })])[0].readingMinutes).toBe(12);
  });

  test("el slug debe coincidir con el archivo", () => {
    expect(() => buildArticles([{ file: "otro-nombre", article: fixtureArticle() }])).toThrow(/no coincide/);
  });

  test("slug y topicId únicos", () => {
    expect(() => buildArticles([source(), source()])).toThrow(/duplicado/);
  });

  describe("[[Bxx|ancla]]", () => {
    const destino = (publishAt: string) =>
      source({ topicId: "B04", slug: "destino", publishAt, updatedAt: publishAt });

    test("válido si el destino existe y se publica antes o igual", () => {
      const articles = buildArticles([source({ intro: "Lee [[B04|el otro]]." }), destino("2026-10-09T08:00:00-06:00")]);
      expect(articles).toHaveLength(2);
    });

    test("falla si el destino no existe", () => {
      expect(() => buildArticles([source({ intro: "Lee [[B04|el otro]]." })])).toThrow(/B04.*no existe/);
    });

    test("falla si el destino se publica después", () => {
      expect(() =>
        buildArticles([source({ intro: "Lee [[B04|el otro]]." }), destino("2026-10-20T08:00:00-06:00")])
      ).toThrow(/después que este artículo/);
    });

    test("válido si el destino sale antes de la última actualización (ida y vuelta)", () => {
      const articles = buildArticles([
        source({ intro: "Lee [[B04|el otro]].", updatedAt: "2026-10-21T08:00:00-06:00" }),
        destino("2026-10-20T08:00:00-06:00"),
      ]);
      expect(articles).toHaveLength(2);
    });

    test("revisa también tablas, listas y FAQ", () => {
      expect(() =>
        buildArticles([source({ faq: [{ q: "¿?", a: "Ver [[B77|otro]]" }] })])
      ).toThrow(/B77/);
      expect(() =>
        buildArticles([
          source({ blocks: [{ type: "table", caption: "c", headers: ["a", "b"], rows: [["x", "[[B78|y]]"]] }] }),
        ])
      ).toThrow(/B78/);
    });
  });
});

test("el contenido real del repo es válido", () => {
  expect(() => getAllArticles()).not.toThrow();
});
