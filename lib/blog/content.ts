import { ARTICLE_SOURCES } from "@/content/blog/_index";
import { CLUSTERS, type BlogCluster, type ClusterSlug } from "@/content/blog/clusters";
import { articleSchema, formatZodError, type ArticleData } from "./article-schema";
import { assignHeadingIds, type TocEntry } from "./headings";
import { inlineToPlainText, topicRefs } from "./inline";
import { isVisible } from "./visibility";

// Carga y valida TODOS los artículos del blog al importar el módulo. Como
// cada página del blog lo importa, un artículo inválido rompe `next build`
// con el detalle exacto (y antes, scripts/blog-build-index.ts corre la
// misma validación en predev/prebuild).

export interface BlogArticle extends ArticleData {
  /** Número del tema para mostrar: "B03" → "03". */
  number: string;
  readingMinutes: number;
  wordCount: number;
  /** Id de ancla de cada bloque h2/h3 (undefined para los demás), alineado con `blocks`. */
  headingIds: (string | undefined)[];
  /** "En este artículo": los h2 en orden. */
  toc: TocEntry[];
  clusterInfo: BlogCluster;
}

export interface ArticleSource {
  /** Nombre del archivo sin extensión (debe coincidir con el slug). */
  file: string;
  article: unknown;
}

export class BlogContentError extends Error {
  constructor(message: string) {
    super(`\n[blog] Contenido inválido:\n${message}\n`);
    this.name = "BlogContentError";
  }
}

const WORDS_PER_MINUTE = 200;

// Todos los textos con sintaxis en línea del artículo (para validar los
// [[Bxx]] y contar palabras).
function inlineStrings(article: ArticleData): string[] {
  const out: string[] = [article.intro];
  for (const block of article.blocks) {
    switch (block.type) {
      case "p":
        out.push(block.text);
        break;
      case "ul":
      case "ol":
        out.push(...block.items);
        break;
      case "table":
        out.push(...block.rows.flat());
        break;
      case "callout":
        out.push(block.text);
        break;
      case "steps":
        out.push(...block.items.map((item) => item.text));
        break;
      default:
        break;
    }
  }
  out.push(...article.faq.map((item) => item.a));
  return out;
}

function plainTextOf(article: ArticleData): string {
  const parts = inlineStrings(article).map(inlineToPlainText);
  for (const block of article.blocks) {
    if (block.type === "h2" || block.type === "h3") parts.push(block.text);
    if (block.type === "table") parts.push(block.caption, ...block.headers);
    if (block.type === "callout" && block.title) parts.push(block.title);
    if (block.type === "steps") parts.push(...block.items.map((item) => item.title));
  }
  parts.push(...article.faq.map((item) => item.q));
  return parts.join(" ");
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

function enrich(data: ArticleData): BlogArticle {
  const headingBlocks = data.blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => block.type === "h2" || block.type === "h3");
  const ids = assignHeadingIds(headingBlocks.map(({ block }) => (block as { text: string }).text));
  const headingIds: (string | undefined)[] = data.blocks.map(() => undefined);
  headingBlocks.forEach(({ index }, i) => {
    headingIds[index] = ids[i];
  });
  const toc: TocEntry[] = data.blocks.flatMap((block, index) =>
    block.type === "h2" ? [{ id: headingIds[index]!, text: block.text }] : []
  );
  const wordCount = countWords(plainTextOf(data));
  return {
    ...data,
    number: data.topicId.replace(/^B0*(\d)/, "$1").padStart(2, "0"),
    readingMinutes: data.readingMinutes ?? Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)),
    wordCount,
    headingIds,
    toc,
    clusterInfo: CLUSTERS[data.cluster as ClusterSlug],
  };
}

// Valida una lista de artículos fuente y devuelve los artículos listos para
// pintar. Junta todos los errores antes de fallar, para corregirlos de una.
export function buildArticles(sources: readonly ArticleSource[]): BlogArticle[] {
  const errors: string[] = [];
  const parsed: BlogArticle[] = [];

  for (const source of sources) {
    const result = articleSchema.safeParse(source.article);
    if (!result.success) {
      errors.push(`content/blog/articles/${source.file}.ts:\n${formatZodError(result.error)}`);
      continue;
    }
    if (result.data.slug !== source.file) {
      errors.push(`content/blog/articles/${source.file}.ts: el slug "${result.data.slug}" no coincide con el nombre del archivo`);
      continue;
    }
    parsed.push(enrich(result.data));
  }

  const bySlug = new Map<string, BlogArticle>();
  const byTopic = new Map<string, BlogArticle>();
  for (const article of parsed) {
    if (bySlug.has(article.slug)) errors.push(`Slug duplicado: "${article.slug}"`);
    if (byTopic.has(article.topicId)) errors.push(`topicId duplicado: ${article.topicId} (${byTopic.get(article.topicId)!.slug} y ${article.slug})`);
    bySlug.set(article.slug, article);
    byTopic.set(article.topicId, article);
  }

  // [[Bxx|ancla]]: el destino debe existir y publicarse antes o al mismo
  // tiempo que el artículo que lo enlaza — así un artículo publicado nunca
  // apunta a uno que todavía da 404.
  for (const article of parsed) {
    for (const text of inlineStrings(article)) {
      for (const ref of topicRefs(text)) {
        const target = byTopic.get(ref);
        if (!target) {
          errors.push(`${article.topicId} (${article.slug}): [[${ref}|…]] apunta a un artículo que no existe todavía`);
        } else if (new Date(target.publishAt).getTime() > new Date(article.publishAt).getTime()) {
          errors.push(
            `${article.topicId} (${article.slug}): [[${ref}|…]] se publica el ${target.publishAt}, después que este artículo (${article.publishAt})`
          );
        } else if (ref === article.topicId) {
          errors.push(`${article.topicId} (${article.slug}): un artículo no puede enlazarse a sí mismo con [[${ref}|…]]`);
        }
      }
    }
  }

  if (errors.length > 0) throw new BlogContentError(errors.join("\n"));
  return parsed;
}

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
export function getVisibleArticles(now: Date = new Date()): BlogArticle[] {
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
