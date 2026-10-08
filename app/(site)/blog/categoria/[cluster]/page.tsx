import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CLUSTERS, CLUSTER_SLUGS, type ClusterSlug } from "@/content/blog/clusters";
import { BlogCardGrid } from "@/components/blog/BlogCard";
import { BlogHero } from "@/components/blog/BlogHero";
import { CategoryChips } from "@/components/blog/CategoryChips";
import { JsonLd } from "@/components/blog/JsonLd";
import { toCardData } from "@/lib/blog/card";
import { clustersWithArticles, getVisibleArticles } from "@/lib/blog/content";
import { blogAlternates, blogListingRobots } from "@/lib/blog/metadata";
import { getNow } from "@/lib/blog/now";
import { buildBlogBreadcrumbJsonLd, buildCollectionJsonLd, canonicalUrl, fitDescription, fitTitle } from "@/lib/blog/seo";
import { isPublished } from "@/lib/blog/visibility";

// Render por request (ver app/(site)/blog/[slug]/page.tsx).
export const dynamic = "force-dynamic";

function clusterFrom(slug: string) {
  return (CLUSTER_SLUGS as readonly string[]).includes(slug) ? CLUSTERS[slug as ClusterSlug] : undefined;
}

// Artículos visibles del clúster: primero los pilares, luego el resto del
// más reciente al más antiguo.
function articlesOf(slug: string) {
  const visible = getVisibleArticles().filter((article) => article.cluster === slug);
  return [...visible.filter((article) => article.pillar), ...visible.filter((article) => !article.pillar)];
}

export function generateMetadata({ params }: { params: { cluster: string } }): Metadata {
  const cluster = clusterFrom(params.cluster);
  if (!cluster || articlesOf(cluster.slug).length === 0) return {};
  const path = `/blog/categoria/${cluster.slug}`;
  const title = fitTitle(`${cluster.nombre}: guías y consejos`);
  const description = fitDescription(cluster.descripcion);
  return {
    title: { absolute: title },
    description,
    alternates: blogAlternates(path),
    robots: blogListingRobots(articlesOf(cluster.slug).filter((article) => isPublished(article, getNow())).length),
    openGraph: { type: "website", title, description, url: canonicalUrl(path), siteName: "Ferretería 57", locale: "es_MX" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function BlogCategoriaPage({ params }: { params: { cluster: string } }) {
  const cluster = clusterFrom(params.cluster);
  if (!cluster) notFound();
  const articles = articlesOf(cluster.slug);
  // Sin artículos publicados, la categoría no existe todavía.
  if (articles.length === 0) notFound();

  const now = getNow();
  const path = `/blog/categoria/${cluster.slug}`;
  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: cluster.nombre, path },
  ];

  return (
    <main id="contenido" className="pb-16 sm:pb-24">
      <JsonLd
        data={buildCollectionJsonLd(
          { name: cluster.nombre, description: cluster.descripcion, path },
          articles.filter((article) => isPublished(article, now))
        )}
      />
      <JsonLd data={buildBlogBreadcrumbJsonLd(crumbs)} />

      <BlogHero crumbs={crumbs} eyebrow="Blog · Categoría" title={cluster.nombre} subtitle={cluster.descripcion} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mt-8">
          <CategoryChips clusters={clustersWithArticles(getVisibleArticles())} active={cluster.slug} />
        </div>
        <section aria-label={`Artículos de ${cluster.nombre}`} className="mt-8">
          <BlogCardGrid cards={articles.map(toCardData)} headingLevel="h2" />
        </section>
      </div>
    </main>
  );
}
