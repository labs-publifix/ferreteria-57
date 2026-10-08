import { notFound } from "next/navigation";
import { clustersWithArticles, getVisibleArticles } from "@/lib/blog/content";
import { toCardData } from "@/lib/blog/card";
import { hubListing, listingPagePath } from "@/lib/blog/listing";
import { BLOG_DESCRIPTION } from "@/lib/blog/metadata";
import { buildBlogBreadcrumbJsonLd, buildCollectionJsonLd } from "@/lib/blog/seo";
import { getNow } from "@/lib/blog/now";
import { isPublished } from "@/lib/blog/visibility";
import { BlogCardGrid } from "./BlogCard";
import { BlogHeroIntro } from "./BlogHero";
import { BlogLeadCard } from "./BlogLeadCard";
import { BlogPagination } from "./BlogPagination";
import { BlogSearch } from "./BlogSearch";
import { CategoryChips } from "./CategoryChips";
import { JsonLd } from "./JsonLd";
import { BlogEmptyState } from "./BlogEmptyState";

// /blog y /blog/pagina/[n], del más reciente al más antiguo. La página 1
// abre con el artículo más reciente en grande y debajo los siguientes 12;
// las demás páginas, 12 cada una (lib/blog/listing.ts). Ningún artículo se
// repite en la misma página.
export function BlogIndexView({ page }: { page: number }) {
  const now = getNow();
  const visible = getVisibleArticles(now);
  const listing = hubListing(visible, page);
  if (page > listing.totalPages) notFound();

  const cards = visible.map(toCardData);
  const clusters = clustersWithArticles(visible);
  const path = listingPagePath("/blog", page);
  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: "Blog", path: "/blog" },
    ...(page > 1 ? [{ name: `Página ${page}`, path }] : []),
  ];
  // JSON-LD solo con publicados (nunca programados, ni en vista previa).
  const onPage = [...(listing.lead ? [listing.lead] : []), ...listing.items];
  const published = onPage.filter((article) => isPublished(article, now));

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
            <div className="mt-8 sm:mt-10">
              <CategoryChips clusters={clusters} />
            </div>

            {listing.lead && (
              <section aria-labelledby="reciente" className="mt-8 sm:mt-10">
                <h2 id="reciente" className="mb-5 font-display text-lg uppercase text-brand-slate sm:text-xl">
                  Lo más reciente
                </h2>
                <BlogLeadCard card={toCardData(listing.lead)} />
              </section>
            )}

            {listing.items.length > 0 && (
              <section aria-labelledby="mas" className={listing.lead ? "mt-12 sm:mt-16" : "mt-8 sm:mt-10"}>
                <h2 id="mas" className="mb-5 font-display text-lg uppercase text-brand-slate sm:text-xl">
                  {page > 1 ? `Más artículos · página ${page}` : "Más artículos"}
                </h2>
                <BlogCardGrid cards={listing.items.map(toCardData)} />
              </section>
            )}
            <BlogPagination page={page} total={listing.totalPages} />
          </>
        )}
      </BlogSearch>
    </main>
  );
}
