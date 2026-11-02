import { describe, expect, test } from "vitest";
import { CLUSTERS } from "@/content/blog/clusters";
import {
  buildBlogBreadcrumbJsonLd,
  buildBlogPostingJsonLd,
  buildCollectionJsonLd,
  buildFaqJsonLd,
  canonicalUrl,
  fitDescription,
  fitTitle,
  serializeJsonLd,
} from "./seo";

describe("fitTitle", () => {
  test("agrega el sufijo si cabe", () => {
    expect(fitTitle("Tipos de brocas")).toBe("Tipos de brocas | Ferretería 57");
  });
  test("quita el sufijo si no cabe", () => {
    const title = "Cómo escoger la broca correcta según el material"; // 48
    expect(fitTitle(title)).toBe(title);
  });
  test("exactamente 60 con sufijo", () => {
    const title = "x".repeat(44);
    expect(fitTitle(title)).toHaveLength(60);
    expect(fitTitle(title).endsWith(" | Ferretería 57")).toBe(true);
  });
  test("nunca pasa de 60", () => {
    const long = "Una guía muy larga de herramientas que no cabe en el título del buscador";
    const result = fitTitle(long);
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.endsWith("…")).toBe(true);
  });
});

test("canonical sin www y sin barra final", () => {
  expect(canonicalUrl("/blog", "https://www.ferreteria57.com/")).toBe("https://ferreteria57.com/blog");
  expect(canonicalUrl("/", "https://ferreteria57.com")).toBe("https://ferreteria57.com");
});

test("serializeJsonLd escapa < para no cerrar el script", () => {
  const out = serializeJsonLd({ text: "</script><script>alert(1)</script>" });
  expect(out).not.toContain("<");
  expect(JSON.parse(out).text).toBe("</script><script>alert(1)</script>");
});

const article = {
  slug: "como-escoger-broca",
  title: "Cómo escoger la broca",
  metaDescription: "Descripción",
  publishAt: "2026-10-09T08:00:00-06:00",
  updatedAt: "2026-10-10T08:00:00-06:00",
  keyword: "tipos de brocas",
  secondaryKeywords: ["broca para pared"],
  wordCount: 2100,
  clusterInfo: CLUSTERS["construccion-fijacion-y-materiales"],
  faq: [{ q: "¿Qué broca?", a: "La de **carburo**." }],
};

test("BlogPosting completo", () => {
  const json = buildBlogPostingJsonLd(article, "https://www.ferreteria57.com");
  expect(json["@type"]).toBe("BlogPosting");
  expect(json.mainEntityOfPage["@id"]).toBe("https://ferreteria57.com/blog/como-escoger-broca");
  expect(json).toMatchObject({
    headline: "Cómo escoger la broca",
    datePublished: "2026-10-09T08:00:00-06:00",
    dateModified: "2026-10-10T08:00:00-06:00",
    articleSection: "Construcción, fijación y materiales",
    keywords: "tipos de brocas, broca para pared",
    inLanguage: "es-MX",
    wordCount: 2100,
    isAccessibleForFree: true,
    author: { name: "Equipo Ferretería 57" },
  });
  expect(json.publisher.logo.url).toBe("https://ferreteria57.com/brand/logo-naranja.png");
});

test("FAQPage en texto plano; null sin preguntas", () => {
  expect(buildFaqJsonLd(article.faq)?.mainEntity[0].acceptedAnswer.text).toBe("La de carburo.");
  expect(buildFaqJsonLd([])).toBeNull();
});

test("BreadcrumbList y CollectionPage", () => {
  const crumbs = buildBlogBreadcrumbJsonLd(
    [
      { name: "Inicio", path: "/" },
      { name: "Blog", path: "/blog" },
    ],
    "https://ferreteria57.com"
  );
  expect(crumbs.itemListElement[1]).toEqual({ "@type": "ListItem", position: 2, name: "Blog", item: "https://ferreteria57.com/blog" });

  const collection = buildCollectionJsonLd({ name: "Blog", description: "d", path: "/blog" }, [article], "https://ferreteria57.com");
  expect(collection["@type"]).toBe("CollectionPage");
  expect(collection.mainEntity.itemListElement[0].url).toBe("https://ferreteria57.com/blog/como-escoger-broca");
});

test("fitDescription corta en oraciones completas y nunca pasa de 155", () => {
  expect(fitDescription("Corta.")).toBe("Corta.");
  const two = `${"a".repeat(100)}. ${"b".repeat(80)}.`;
  expect(fitDescription(two)).toBe(`${"a".repeat(100)}.`);
  const result = fitDescription("palabra ".repeat(40));
  expect(result.length).toBeLessThanOrEqual(155);
  expect(result.endsWith("…")).toBe(true);
});
