import { SITE_URL } from "@/lib/seo";
import type { BlogCluster } from "@/content/blog/clusters";
import { inlineToPlainText } from "./inline";

// SEO del blog: títulos, canonical y JSON-LD. Funciones puras (reciben la
// URL base como parámetro opcional para poder probarlas).

export const TITLE_MAX = 60;
export const TITLE_SUFFIX = " | Ferretería 57";
export const BLOG_AUTHOR = "Equipo Ferretería 57";

// Título ≤ 60 caracteres: con el sufijo de marca si cabe; si no, el título
// solo; y si el título solo tampoco cabe (no debería: Zod limita seoTitle a
// 60), se recorta en la última palabra completa con "…".
export function fitTitle(title: string, suffix: string = TITLE_SUFFIX, max: number = TITLE_MAX): string {
  const clean = title.trim().replace(/\s+/g, " ");
  if (clean.length + suffix.length <= max) return `${clean}${suffix}`;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "")}…`;
}

// Meta description ≤ 155: oraciones completas mientras quepan; si ni la
// primera cabe, se corta en la última palabra con "…".
export function fitDescription(text: string, max = 155): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+/g) ?? [];
  let out = "";
  for (const sentence of sentences) {
    const next = `${out}${sentence}`.trim();
    if (next.length > max) break;
    out = `${next} `;
  }
  if (out.trim()) return out.trim();
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 1)).replace(/[\s,;:.-]+$/, "")}…`;
}

// Canonical siempre sin "www." (el dominio canónico es ferreteria57.com).
export function canonicalBase(siteUrl: string = SITE_URL): string {
  return siteUrl.replace(/\/$/, "").replace(/^(https?:\/\/)www\./i, "$1");
}

export function canonicalUrl(path: string, siteUrl: string = SITE_URL): string {
  const base = canonicalBase(siteUrl);
  return path === "/" ? base : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function blogPagePath(page: number): string {
  return page <= 1 ? "/blog" : `/blog/pagina/${page}`;
}

// JSON dentro de <script type="application/ld+json">: escapar "<" evita que
// un "</script>" dentro de un texto cierre la etiqueta antes de tiempo.
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function publisher(siteUrl: string) {
  const base = canonicalBase(siteUrl);
  return {
    "@type": "Organization",
    name: "Ferretería 57",
    url: base,
    logo: { "@type": "ImageObject", url: `${base}/brand/logo-naranja.png`, width: 983, height: 302 },
  };
}

export interface JsonLdArticle {
  slug: string;
  title: string;
  metaDescription: string;
  publishAt: string;
  updatedAt: string;
  keyword: string;
  secondaryKeywords: string[];
  wordCount: number;
  clusterInfo: BlogCluster;
  faq: { q: string; a: string }[];
}

export function buildBlogPostingJsonLd(article: JsonLdArticle, siteUrl: string = SITE_URL) {
  const url = canonicalUrl(`/blog/${article.slug}`, siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: BLOG_AUTHOR, url: canonicalUrl("/blog", siteUrl) },
    publisher: publisher(siteUrl),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    articleSection: article.clusterInfo.nombre,
    keywords: [article.keyword, ...article.secondaryKeywords].join(", "),
    inLanguage: "es-MX",
    wordCount: article.wordCount,
    isAccessibleForFree: true,
  };
}

export function buildFaqJsonLd(faq: { q: string; a: string }[]) {
  if (faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: inlineToPlainText(item.a) },
    })),
  };
}

export function buildBlogBreadcrumbJsonLd(items: { name: string; path: string }[], siteUrl: string = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path, siteUrl),
    })),
  };
}

export function buildCollectionJsonLd(
  page: { name: string; description: string; path: string },
  articles: { slug: string; title: string }[],
  siteUrl: string = SITE_URL
) {
  const url = canonicalUrl(page.path, siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.name,
    description: page.description,
    url,
    inLanguage: "es-MX",
    isPartOf: { "@type": "WebSite", name: "Ferretería 57", url: canonicalBase(siteUrl) },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: canonicalUrl(`/blog/${article.slug}`, siteUrl),
        name: article.title,
      })),
    },
  };
}
