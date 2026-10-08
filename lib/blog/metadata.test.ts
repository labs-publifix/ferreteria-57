import { expect, test } from "vitest";
import { blogListingRobots } from "./metadata";
import { buildBlogSitemapEntries } from "./sitemap";

const NOW = new Date("2026-10-20T12:00:00-06:00");
const art = (publishAt: string) => ({
  topicId: "B03",
  slug: "broca",
  cluster: "construccion-fijacion-y-materiales",
  publishAt,
  updatedAt: publishAt,
});

test("con 0 publicados: noindex,follow y nada del blog en el sitemap", () => {
  expect(blogListingRobots(0)).toEqual({ index: false, follow: true });
  expect(buildBlogSitemapEntries([art("2099-12-31T08:00:00-06:00")], NOW, "https://ferreteria57.com")).toEqual([]);
});

test("con 1 publicado: indexable y entra al sitemap", () => {
  expect(blogListingRobots(1)).toMatchObject({ index: true, follow: true });
  const urls = buildBlogSitemapEntries([art("2026-10-09T08:00:00-06:00")], NOW, "https://ferreteria57.com").map((e) => e.url);
  expect(urls).toContain("https://ferreteria57.com/blog");
});
