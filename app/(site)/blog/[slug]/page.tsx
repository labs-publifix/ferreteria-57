import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Eye } from "lucide-react";
import { ArticleBadges } from "@/components/blog/ArticleBadges";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { ArticleFaq } from "@/components/blog/ArticleFaq";
import { ArticleTocBar, ArticleTocSidebar } from "@/components/blog/ArticleToc";
import { AuthorLine } from "@/components/blog/AuthorLine";
import { BlogBreadcrumbs } from "@/components/blog/BlogBreadcrumbs";
import { BlogCardGrid } from "@/components/blog/BlogCard";
import { GuiaClubCta } from "@/components/blog/GuiaClubCta";
import { InlineText } from "@/components/blog/InlineText";
import { JsonLd } from "@/components/blog/JsonLd";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { toCardData } from "@/lib/blog/card";
import { getAllArticles, getArticleBySlug, getMoreInCluster, getRelatedArticles, getVisibleArticles } from "@/lib/blog/content";
import { esOtroDia, formatFechaCorta, formatFechaLarga } from "@/lib/blog/dates";
import { BLOG_ROBOTS, blogAlternates } from "@/lib/blog/metadata";
import { buildBlogBreadcrumbJsonLd, buildBlogPostingJsonLd, buildFaqJsonLd, canonicalUrl, fitTitle } from "@/lib/blog/seo";
import { CLUSTER_THEME } from "@/lib/blog/theme";
import { isPublished, isVisible } from "@/lib/blog/visibility";

// Render por request, como todo app/(site): el layout lee cookies
// (SiteChrome → categorías del header), así que ISR con
// generateStaticParams no aplica aquí — se probó y un slug renderizado bajo
// demanda truena con DYNAMIC_SERVER_USAGE. Por request, la regla de
// visibilidad (publishAt ≤ ahora) se cumple al minuto, sin esperar a una
// revalidación; el contenido va en el bundle, así que no agrega I/O.
export const dynamic = "force-dynamic";

function visibleArticle(slug: string, now: Date) {
  const article = getArticleBySlug(slug);
  return article && isVisible(article, now) ? article : undefined;
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const now = new Date();
  const article = visibleArticle(params.slug, now);
  if (!article) return {};
  const path = `/blog/${article.slug}`;
  const title = fitTitle(article.seoTitle);
  const scheduled = !isPublished(article, now);
  return {
    title: { absolute: title },
    description: article.metaDescription,
    keywords: [article.keyword, ...article.secondaryKeywords],
    alternates: blogAlternates(path),
    // Vista previa de un programado (solo fuera de producción): nunca indexar.
    robots: scheduled ? { index: false, follow: false } : BLOG_ROBOTS,
    authors: [{ name: "Equipo Ferretería 57" }],
    openGraph: {
      type: "article",
      title,
      description: article.metaDescription,
      url: canonicalUrl(path),
      siteName: "Ferretería 57",
      locale: "es_MX",
      publishedTime: article.publishAt,
      modifiedTime: article.updatedAt,
      section: article.clusterInfo.nombre,
      tags: [article.keyword, ...article.secondaryKeywords],
      authors: ["Equipo Ferretería 57"],
    },
    twitter: { card: "summary_large_image", title, description: article.metaDescription },
  };
}

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const now = new Date();
  const article = visibleArticle(params.slug, now);
  if (!article) notFound();

  const scheduled = !isPublished(article, now);
  const visible = getVisibleArticles(now);
  const topicSlugs = Object.fromEntries(getAllArticles().map((item) => [item.topicId, item.slug]));
  const related = getRelatedArticles(article, visible);
  const more = getMoreInCluster(article, visible, related);
  const theme = CLUSTER_THEME[article.clusterInfo.tema];
  const path = `/blog/${article.slug}`;
  const url = canonicalUrl(path);
  const categoryPath = `/blog/categoria/${article.cluster}`;
  const hasInlineCta = article.blocks.some((block) => block.type === "cta");
  const toc = article.faq.length > 0 ? [...article.toc, { id: "preguntas-frecuentes", text: "Preguntas frecuentes" }] : article.toc;
  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: article.clusterInfo.nombre, path: categoryPath },
    { name: article.title, path },
  ];
  const faqJsonLd = buildFaqJsonLd(article.faq);
  const updated = esOtroDia(article.publishAt, article.updatedAt);

  return (
    <main id="contenido" className="bg-white">
      <JsonLd data={buildBlogPostingJsonLd(article)} />
      <JsonLd data={buildBlogBreadcrumbJsonLd(crumbs)} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      {scheduled && (
        <p role="status" className="flex items-center justify-center gap-2 bg-brand-black px-4 py-2.5 text-center font-sans text-sm font-semibold text-white">
          <Eye className="size-4 shrink-0" aria-hidden="true" />
          Vista previa: programado para {formatFechaCorta(article.publishAt)}
        </p>
      )}

      <article className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="pt-6 sm:pt-8">
          <BlogBreadcrumbs items={crumbs} tone="muted" />

          <div className={`mt-5 rounded-3xl px-5 pb-8 pt-5 sm:px-10 sm:pb-12 sm:pt-8 ${theme.block}`}>
            <div className="flex items-start justify-between gap-6">
              <ArticleBadges tema={article.clusterInfo.tema} readingMinutes={article.readingMinutes} />
              <span aria-hidden="true" className="font-display text-6xl leading-[0.8] tabular-nums sm:text-8xl">
                {article.number}
              </span>
            </div>
            <Link
              href={categoryPath}
              className={`mt-8 inline-block rounded font-sans text-xs font-bold uppercase tracking-[0.14em] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 sm:mt-10 ${theme.muted} ${
                article.clusterInfo.tema === "naranja" ? "focus-visible:ring-brand-black" : "focus-visible:ring-white"
              }`}
            >
              {article.clusterInfo.nombre}
            </Link>
            <h1 className="mt-3 max-w-[22ch] font-display text-[1.85rem] uppercase leading-[1.08] [text-wrap:balance] sm:text-5xl">
              {article.title}
            </h1>
          </div>

          <div className="mt-8 max-w-[68ch]">
            <p className="font-sans text-lg leading-[1.65] text-brand-black sm:text-xl">
              <InlineText text={article.intro} topicSlugs={topicSlugs} />
            </p>
            <div className="mt-7 flex flex-col gap-5 border-y border-brand-slate/10 py-5 sm:flex-row sm:items-center sm:justify-between">
              <AuthorLine size="lg">
                Publicado el <time dateTime={article.publishAt}>{formatFechaLarga(article.publishAt)}</time>
                {updated && (
                  <>
                    {" "}
                    · Actualizado el <time dateTime={article.updatedAt}>{formatFechaLarga(article.updatedAt)}</time>
                  </>
                )}
              </AuthorLine>
              <ShareButtons url={url} title={article.title} />
            </div>
          </div>
        </header>

        <div className="mt-2 pb-4">
          <ArticleTocBar toc={toc} contentId="cuerpo-articulo" />
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-20">
            <div id="cuerpo-articulo" className="min-w-0 max-w-[68ch] pt-10 text-[17px] sm:text-[18px]">
              <ArticleBody article={article} topicSlugs={topicSlugs} ctaAnchorId={hasInlineCta ? "guia" : undefined} />
              <ArticleFaq faq={article.faq} topicSlugs={topicSlugs} />
              <p className="mt-12 rounded-xl bg-brand-gray px-5 py-4 font-sans text-sm leading-relaxed text-brand-black/75">
                La información de este artículo es orientativa y no sustituye la asesoría de un profesional para trabajos
                eléctricos, de gas o estructurales. Para medidas, velocidades y usos específicos, consulta siempre el
                empaque del producto y el manual de tu herramienta.
              </p>
            </div>
            <aside aria-label="Índice y guía del artículo" className="hidden pt-10 lg:block">
              <div className="sticky top-8 flex flex-col gap-8">
                <ArticleTocSidebar toc={toc} contentId="cuerpo-articulo" />
                <GuiaClubCta slug={article.slug} guiaTitulo={article.guia.titulo} variant="sidebar" />
              </div>
            </aside>
          </div>
        </div>

        <div className="mt-12 pb-16 sm:mt-16 sm:pb-20">
          <GuiaClubCta slug={article.slug} guiaTitulo={article.guia.titulo} variant="final" anchorId={hasInlineCta ? undefined : "guia"} />
        </div>
      </article>

      {(related.length > 0 || more.length > 0) && (
        <div className="bg-brand-gray pb-16 pt-14 sm:pb-24 sm:pt-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 sm:px-6 lg:px-8">
            {related.length > 0 && (
              <section aria-labelledby="articulos-relacionados">
                <h2 id="articulos-relacionados" className="mb-5 font-display text-lg uppercase text-brand-slate sm:text-xl">
                  Artículos relacionados
                </h2>
                <BlogCardGrid cards={related.map(toCardData)} />
              </section>
            )}
            {more.length > 0 && (
              <section aria-labelledby="mas-en-la-categoria">
                <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
                  <h2 id="mas-en-la-categoria" className="font-display text-lg uppercase text-brand-slate sm:text-xl">
                    Más en {article.clusterInfo.nombre}
                  </h2>
                  <Link href={categoryPath} className="inline-flex min-h-11 items-center gap-1.5 font-sans text-sm font-semibold text-brand-black underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate">
                    Ver todo
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
                <BlogCardGrid cards={more.map(toCardData)} />
              </section>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
