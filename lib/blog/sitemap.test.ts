import { expect, test } from "vitest";
import { buildBlogSitemapEntries } from "./sitemap";

const NOW = new Date("2026-10-20T12:00:00-06:00");
const art = (topicId: string, slug: string, cluster: string, publishAt: string) => ({
  topicId,
  slug,
  cluster,
  publishAt,
  updatedAt: publishAt,
});

test("sin publicados no agrega nada (ni /blog)", () => {
  expect(buildBlogSitemapEntries([art("B03", "broca", "construccion-fijacion-y-materiales", "2099-12-31T08:00:00-06:00")], NOW, "https://ferreteria57.com")).toEqual([]);
});

test("incluye /blog, categorías con publicados y artículos publicados; nunca programados", () => {
  const urls = buildBlogSitemapEntries(
    [
      art("B03", "broca", "construccion-fijacion-y-materiales", "2026-10-09T08:00:00-06:00"),
      art("B04", "tuberia", "plomeria-y-agua", "2026-10-13T08:00:00-06:00"),
      art("B05", "programado", "electricidad-e-iluminacion", "2099-12-31T08:00:00-06:00"),
    ],
    NOW,
    "https://www.ferreteria57.com"
  ).map((entry) => entry.url);
  expect(urls).toEqual([
    "https://ferreteria57.com/blog",
    "https://ferreteria57.com/blog/categoria/plomeria-y-agua",
    "https://ferreteria57.com/blog/categoria/construccion-fijacion-y-materiales",
    "https://ferreteria57.com/blog/tuberia",
    "https://ferreteria57.com/blog/broca",
  ]);
});

test("páginas /blog/pagina/n solo desde n = 2", () => {
  const many = Array.from({ length: 25 }, (_, i) =>
    art(`B${String(i + 10)}`, `a${i}`, "plomeria-y-agua", `2026-10-${String((i % 9) + 10)}T08:00:00-06:00`)
  );
  const urls = buildBlogSitemapEntries(many, NOW, "https://ferreteria57.com").map((entry) => entry.url);
  expect(urls).toContain("https://ferreteria57.com/blog/pagina/2");
  expect(urls).toContain("https://ferreteria57.com/blog/pagina/3");
  expect(urls).not.toContain("https://ferreteria57.com/blog/pagina/1");
  expect(urls).not.toContain("https://ferreteria57.com/blog/pagina/4");
});

test("lastmod = updatedAt del artículo", () => {
  const [, , entry] = buildBlogSitemapEntries(
    [{ ...art("B03", "broca", "construccion-fijacion-y-materiales", "2026-10-09T08:00:00-06:00"), updatedAt: "2026-10-15T09:00:00-06:00" }],
    NOW,
    "https://ferreteria57.com"
  );
  expect(entry.url).toBe("https://ferreteria57.com/blog/broca");
  expect(entry.lastModified).toEqual(new Date("2026-10-15T09:00:00-06:00"));
});
