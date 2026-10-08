import type { MetadataRoute } from "next";
import { CLUSTERS } from "@/content/blog/clusters";
import { ARTICLES_PER_PAGE, byPublishDesc, totalPages } from "./content";
import { hubTotalPages, listingPagePath } from "./listing";
import { blogPagePath, canonicalUrl } from "./seo";
import { isPublished } from "./visibility";

interface SitemapArticle {
  topicId: string;
  slug: string;
  cluster: string;
  publishAt: string;
  updatedAt: string;
}

// Entradas del blog para app/sitemap.ts. Solo artículos PUBLICADOS (nunca
// los programados, ni con BLOG_SHOW_SCHEDULED): el sitemap es para
// buscadores y no debe anunciar URLs que hoy dan 404 en producción.
export function buildBlogSitemapEntries(articles: SitemapArticle[], now: Date, siteUrl?: string): MetadataRoute.Sitemap {
  const published = articles.filter((article) => isPublished(article, now)).sort(byPublishDesc);
  if (published.length === 0) return [];

  const latest = new Date(published[0].updatedAt);
  const entries: MetadataRoute.Sitemap = [
    { url: canonicalUrl("/blog", siteUrl), lastModified: latest, changeFrequency: "weekly", priority: 0.6 },
  ];

  // Mismo reparto que la página: destacado + 12 en la 1, 12 en las demás.
  for (let page = 2; page <= hubTotalPages(published.length); page += 1) {
    entries.push({ url: canonicalUrl(blogPagePath(page), siteUrl), changeFrequency: "weekly", priority: 0.3 });
  }

  for (const cluster of Object.values(CLUSTERS)) {
    const inCluster = published.filter((article) => article.cluster === cluster.slug);
    if (inCluster.length === 0) continue;
    entries.push({
      url: canonicalUrl(`/blog/categoria/${cluster.slug}`, siteUrl),
      lastModified: new Date(inCluster[0].updatedAt),
      changeFrequency: "weekly",
      priority: 0.5,
    });
    const base = `/blog/categoria/${cluster.slug}`;
    for (let page = 2; page <= totalPages(inCluster.length, ARTICLES_PER_PAGE); page += 1) {
      entries.push({ url: canonicalUrl(listingPagePath(base, page), siteUrl), changeFrequency: "weekly", priority: 0.3 });
    }
  }

  for (const article of published) {
    entries.push({
      url: canonicalUrl(`/blog/${article.slug}`, siteUrl),
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }
  return entries;
}
