import { notFound } from "next/navigation";
import type { BlogCluster } from "@/content/blog/clusters";
import { toCardData } from "@/lib/blog/card";
import { clusterArticles } from "@/lib/blog/category-page";
import { clustersWithArticles, getVisibleArticles } from "@/lib/blog/content";
import { categoryListing, listingPagePath } from "@/lib/blog/listing";
import { getNow } from "@/lib/blog/now";
import { buildBlogBreadcrumbJsonLd, buildCollectionJsonLd } from "@/lib/blog/seo";
import { isPublished } from "@/lib/blog/visibility";
import { BlogCardGrid } from "./BlogCard";
import { BlogHero } from "./BlogHero";
import { BlogPagination } from "./BlogPagination";
import { CategoryChips } from "./CategoryChips";
import { JsonLd } from "./JsonLd";

// /blog/categoria/[cluster] y …/pagina/[n]: 12 por página.
export function BlogCategoryView({ cluster, page }: { cluster: BlogCluster; page: number }) {
  const now = getNow();
  const articles = clusterArticles(cluster.slug, now);
  // Sin artículos visibles, la categoría no existe todavía.
  if (articles.length === 0) notFound();
  const listing = categoryListing(articles, page);
  if (page > listing.totalPages) notFound();

  const basePath = `/blog/categoria/${cluster.slug}`;
  const path = listingPagePath(basePath, page);
  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: cluster.nombre, path: basePath },
    ...(page > 1 ? [{ name: `Página ${page}`, path }] : []),
  ];

  return (
    <main id="contenido" className="pb-16 sm:pb-24">
      <JsonLd
        data={buildCollectionJsonLd(
          { name: page > 1 ? `${cluster.nombre} — página ${page}` : cluster.nombre, description: cluster.descripcion, path },
          listing.items.filter((article) => isPublished(article, now))
        )}
      />
      <JsonLd data={buildBlogBreadcrumbJsonLd(crumbs)} />

      <BlogHero crumbs={crumbs} title={cluster.nombre} subtitle={cluster.descripcion} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mt-8">
          <CategoryChips clusters={clustersWithArticles(getVisibleArticles(now))} active={cluster.slug} />
        </div>
        <section aria-label={`Artículos de ${cluster.nombre}`} className="mt-8">
          <BlogCardGrid cards={listing.items.map(toCardData)} headingLevel="h2" />
        </section>
        <BlogPagination page={page} total={listing.totalPages} basePath={basePath} />
      </div>
    </main>
  );
}
