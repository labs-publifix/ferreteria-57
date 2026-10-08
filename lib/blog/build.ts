import { CLUSTERS, type BlogCluster, type ClusterSlug } from "@/content/blog/clusters";
import { articleSchema, formatZodError, type ArticleData } from "./article-schema";
import { assignHeadingIds, type TocEntry } from "./headings";
import { inlineToPlainText, topicRefs } from "./inline";

// Validación y enriquecimiento de los artículos del blog — funciones puras,
// sin importar el índice. Las usan lib/blog/content.ts (al cargar el sitio)
// y scripts/blog-check.ts (reporte por artículo, sin romperse al importar).

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
export function inlineStrings(article: ArticleData): string[] {
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

export function plainTextOf(article: ArticleData): string {
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

export function enrich(data: ArticleData): BlogArticle {
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

  errors.push(...topicLinkIssues(parsed).map((issue) => issue.message));

  if (errors.length > 0) throw new BlogContentError(errors.join("\n"));
  return parsed;
}


// [[Bxx|ancla]]: el destino debe existir y publicarse antes de que el
// enlace pueda verse. Vale si el destino se publica antes o al mismo tiempo
// que el artículo que lo enlaza, o antes de su updatedAt: así un artículo
// anterior puede ganar el enlace de ida y vuelta cuando se actualiza
// después de que el nuevo salió (mapa de enlaces, "Al publicar B09:
// actualizar B03"). Además, InlineText solo pinta el enlace si el destino
// ya es visible, así que nunca lleva a un 404.
export function topicLinkIssues(articles: readonly BlogArticle[]): { topicId: string; message: string }[] {
  const byTopic = new Map(articles.map((article) => [article.topicId, article]));
  const issues: { topicId: string; message: string }[] = [];
  for (const article of articles) {
    const push = (message: string) => issues.push({ topicId: article.topicId, message });
    const latest = Math.max(new Date(article.publishAt).getTime(), new Date(article.updatedAt).getTime());
    for (const text of inlineStrings(article)) {
      for (const ref of topicRefs(text)) {
        const target = byTopic.get(ref);
        if (ref === article.topicId) {
          push(`${article.topicId} (${article.slug}): un artículo no puede enlazarse a sí mismo con [[${ref}|…]]`);
        } else if (!target) {
          push(`${article.topicId} (${article.slug}): [[${ref}|…]] apunta a un artículo que no existe todavía`);
        } else if (new Date(target.publishAt).getTime() > latest) {
          push(
            `${article.topicId} (${article.slug}): [[${ref}|…]] se publica el ${target.publishAt}, después que este artículo (${article.publishAt}) y que su última actualización (${article.updatedAt})`
          );
        }
      }
    }
  }
  return issues;
}
