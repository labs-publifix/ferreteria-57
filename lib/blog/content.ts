import { ARTICLE_SOURCES } from "@/content/blog/_index";
import { CLUSTERS, type BlogCluster } from "@/content/blog/clusters";
import { buildArticles, type BlogArticle } from "./build";
import { getNow } from "./now";
import { isVisible } from "./visibility";

// Carga y valida TODOS los artículos del blog al importar el módulo. Como
// cada página del blog lo importa, un artículo inválido rompe `next build`
// con el detalle exacto (antes, en prebuild, ya lo frenan
// scripts/blog-build-index.ts y scripts/blog-check.ts).
export { BlogContentError, buildArticles, countWords } from "./build";
export type { ArticleSource, BlogArticle } from "./build";

const ARTICLES: BlogArticle[] = buildArticles(ARTICLE_SOURCES);

export function byPublishDesc(a: { publishAt: string; topicId: string }, b: { publishAt: string; topicId: string }): number {
  const diff = new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime();
  return diff !== 0 ? diff : a.topicId.localeCompare(b.topicId);
}

export function getAllArticles(): BlogArticle[] {
  return ARTICLES;
}

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}

export function getArticleByTopicId(topicId: string): BlogArticle | undefined {
  return ARTICLES.find((article) => article.topicId === topicId);
}

/** Artículos que el visitante puede ver ahora, del más reciente al más antiguo. */
export function getVisibleArticles(now: Date = getNow()): BlogArticle[] {
  return ARTICLES.filter((article) => isVisible(article, now)).sort(byPublishDesc);
}

export function getRelatedArticles(article: BlogArticle, visible: BlogArticle[], limit = 3): BlogArticle[] {
  return article.relatedTopicIds
    .map((id) => visible.find((candidate) => candidate.topicId === id))
    .filter((candidate): candidate is BlogArticle => candidate !== undefined && candidate.slug !== article.slug)
    .slice(0, limit);
}

export function getMoreInCluster(article: BlogArticle, visible: BlogArticle[], exclude: BlogArticle[] = [], limit = 3): BlogArticle[] {
  const skip = new Set([article.slug, ...exclude.map((item) => item.slug)]);
  return visible.filter((candidate) => candidate.cluster === article.cluster && !skip.has(candidate.slug)).slice(0, limit);
}

/** Clústeres con al menos un artículo en la lista, en el orden de CLUSTER_LIST. */
export function clustersWithArticles(articles: BlogArticle[]): BlogCluster[] {
  const present = new Set(articles.map((article) => article.cluster));
  return Object.values(CLUSTERS).filter((cluster) => present.has(cluster.slug));
}

export const ARTICLES_PER_PAGE = 12;

export function totalPages(count: number, perPage = ARTICLES_PER_PAGE): number {
  return Math.max(1, Math.ceil(count / perPage));
}

export function pageSlice<T>(items: T[], page: number, perPage = ARTICLES_PER_PAGE): T[] {
  return items.slice((page - 1) * perPage, page * perPage);
}

export function articlePath(slug: string): string {
  return `/blog/${slug}`;
}
