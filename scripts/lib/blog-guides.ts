// Carga de artículos y guías para los scripts de guías (blog:pdf, blog:check).
// Usa las fuentes crudas del índice + los esquemas, sin lanzar si un
// borrador todavía no es válido.
import { articleSchema, type ArticleData } from "../../lib/blog/article-schema";
import { guideSchema, type GuideData } from "../../lib/blog/guide-schema";
import { guideArticleUrl, renderGuidePdf, type GuidePdfResult } from "../../lib/blog/guide-pdf";
import { writeBlogIndex } from "./blog-index";

export interface GuidePair {
  article: ArticleData;
  guide: GuideData;
}

export async function loadGuidePairs(): Promise<GuidePair[]> {
  writeBlogIndex();
  const { ARTICLE_SOURCES } = await import("../../content/blog/_index");
  const { GUIDE_SOURCES } = await import("../../content/blog/_guides");
  const guides = new Map<string, GuideData>();
  for (const source of GUIDE_SOURCES) {
    const parsed = guideSchema.safeParse(source.guide);
    if (parsed.success) guides.set(parsed.data.slug, parsed.data);
  }
  const pairs: GuidePair[] = [];
  for (const source of ARTICLE_SOURCES) {
    const parsed = articleSchema.safeParse(source.article);
    const guide = parsed.success ? guides.get(parsed.data.slug) : undefined;
    if (parsed.success && guide) pairs.push({ article: parsed.data, guide });
  }
  return pairs;
}

export function renderPair(pair: GuidePair): Promise<GuidePdfResult> {
  return renderGuidePdf({ guide: pair.guide, articleTitle: pair.article.title, articleUrl: guideArticleUrl(pair.article.slug) });
}
