import { notFound } from "next/navigation";
import { ARTICLES_PER_PAGE, clustersWithArticles, getVisibleArticles, pageSlice, totalPages } from "@/lib/blog/content";
import { toCardData } from "@/lib/blog/card";
import { BLOG_DESCRIPTION } from "@/lib/blog/metadata";
import { blogPagePath, buildBlogBreadcrumbJsonLd, buildCollectionJsonLd } from "@/lib/blog/seo";
import { isPublished } from "@/lib/blog/visibility";
import { BlogCardGrid } from "./BlogCard";
import { BlogHeroIntro } from "./BlogHero";
import { BlogPagination } from "./BlogPagination";
import { BlogSearch } from "./BlogSearch";
import { CategoryChips } from "./CategoryChips";
import { JsonLd } from "./JsonLd";
import { BlogEmptyState } from "./BlogEmptyState";

// /blog y /blog/pagina/[n]: el mismo listado, 12 por página, del más
// reciente al más antiguo. "Destacados" (artículos pilar) solo en la 1.
export function BlogIndexView({ page }: { page: number }) {
  const now = new Date();
  const visible = getVisibleArticles(now);
  const pages = totalPages(visible.length, ARTICLES_PER_PAGE);
  if (page > pages) notFound();

  const cards = visible.map(toCardData);
  const onPage = pageSlice(cards, page);
  const pillars = page === 1 ? cards.filter((_, i) => visible[i].pillar).slice(0, 3) : [];
  const clusters = clustersWithArticles(visible);
  const path = blogPagePath(page);
  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: "Blog", path: "/blog" },
    ...(page > 1 ? [{ name: `Página ${page}`, path }] : []),
  ];
  // JSON-LD solo con publicados (nunca programados, ni en vista previa).
  const published = pageSlice(visible, page).filter((article) => isPublished(article, now));

  return (
    <main id="contenido" className="pb-16 sm:pb-24">
      <JsonLd
        data={buildCollectionJsonLd(
          { name: page > 1 ? `Blog de Ferretería 57 — página ${page}` : "Blog de Ferretería 57", description: BLOG_DESCRIPTION, path },
          published
        )}
      />
      <JsonLd data={buildBlogBreadcrumbJsonLd(crumbs.map((crumb) => ({ name: crumb.name, path: crumb.path! })))} />

      <BlogSearch
        cards={cards}
        intro={
          <BlogHeroIntro
            crumbs={crumbs}
            title="Guías y consejos de ferretería"
            subtitle="Escritos por el equipo de Ferretería 57 en Querétaro. Léelos aquí y descarga las guías en PDF con Club 57."
          />
        }
      >
        {visible.length === 0 ? (
          <BlogEmptyState />
        ) : (
          <>
            {pillars.length > 0 && (
              <section aria-labelledby="destacados" className="mt-10 sm:mt-12">
                <h2 id="destacados" className="mb-5 font-display text-lg uppercase text-brand-slate sm:text-xl">
                  Destacados
                </h2>
                <BlogCardGrid cards={pillars} />
              </section>
            )}

            <section aria-labelledby="todos" className="mt-12 sm:mt-16">
              <div className="mb-5 flex flex-col gap-4">
                <h2 id="todos" className="font-display text-lg uppercase text-brand-slate sm:text-xl">
                  {page > 1 ? `Todos los artículos · página ${page}` : "Todos los artículos"}
                </h2>
                <CategoryChips clusters={clusters} />
              </div>
              <BlogCardGrid cards={onPage} />
              <BlogPagination page={page} total={pages} />
            </section>
          </>
        )}
      </BlogSearch>
    </main>
  );
}
