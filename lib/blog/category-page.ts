import type { Metadata } from "next";
import { CLUSTERS, CLUSTER_SLUGS, type ClusterSlug } from "@/content/blog/clusters";
import { getVisibleArticles, type BlogArticle } from "./content";
import { listingPagePath } from "./listing";
import { blogAlternates, blogListingRobots } from "./metadata";
import { getNow } from "./now";
import { canonicalUrl, fitDescription, fitTitle } from "./seo";
import { isPublished } from "./visibility";

// Compartido por /blog/categoria/[cluster] y …/pagina/[n].

/** Artículos visibles de un clúster: primero los pilares, luego el resto del más reciente al más antiguo. */
export function clusterArticles(slug: string, now: Date = getNow()): BlogArticle[] {
  const visible = getVisibleArticles(now).filter((article) => article.cluster === slug);
  return [...visible.filter((article) => article.pillar), ...visible.filter((article) => !article.pillar)];
}
export function clusterFrom(slug: string) {
  return (CLUSTER_SLUGS as readonly string[]).includes(slug) ? CLUSTERS[slug as ClusterSlug] : undefined;
}

export function categoryMetadata(slug: string, page: number): Metadata {
  const cluster = clusterFrom(slug);
  if (!cluster || clusterArticles(cluster.slug).length === 0) return {};
  const path = listingPagePath(`/blog/categoria/${cluster.slug}`, page);
  const title = fitTitle(page > 1 ? `${cluster.nombre}: guías y consejos — página ${page}` : `${cluster.nombre}: guías y consejos`);
  const description = fitDescription(cluster.descripcion);
  return {
    title: { absolute: title },
    description,
    alternates: blogAlternates(path),
    robots: blogListingRobots(clusterArticles(cluster.slug).filter((article) => isPublished(article, getNow())).length),
    openGraph: { type: "website", title, description, url: canonicalUrl(path), siteName: "Ferretería 57", locale: "es_MX" },
    twitter: { card: "summary_large_image", title, description },
  };
}
