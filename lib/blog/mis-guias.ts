import { isPublished } from "./visibility";

// «Mis guías» en /cuenta: las guías de los artículos YA publicados (el
// reloj es getNow()), la más reciente primero, con la última descarga del
// usuario si la hay («Nueva» = nunca descargada). Función pura: la página
// pasa artículos, guías y descargas.

export interface MiGuia {
  slug: string;
  topicId: string;
  titulo: string;
  articuloTitulo: string;
  articuloHref: string;
  publishAt: string;
  /** ISO de la última descarga, o null si nunca la descargó. */
  descargadaAt: string | null;
}

export function buildMisGuias(
  articles: { slug: string; topicId: string; title: string; publishAt: string }[],
  guides: { slug: string; titulo: string }[],
  downloads: { slug: string; downloaded_at: string }[],
  now: Date
): MiGuia[] {
  const guideBySlug = new Map(guides.map((guide) => [guide.slug, guide]));
  const lastDownload = new Map<string, string>();
  for (const row of downloads) {
    const current = lastDownload.get(row.slug);
    if (!current || new Date(row.downloaded_at) > new Date(current)) lastDownload.set(row.slug, row.downloaded_at);
  }
  return articles
    .filter((article) => isPublished(article, now) && guideBySlug.has(article.slug))
    .sort((a, b) => new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime() || a.topicId.localeCompare(b.topicId))
    .map((article) => ({
      slug: article.slug,
      topicId: article.topicId,
      titulo: guideBySlug.get(article.slug)!.titulo,
      articuloTitulo: article.title,
      articuloHref: `/blog/${article.slug}`,
      publishAt: article.publishAt,
      descargadaAt: lastDownload.get(article.slug) ?? null,
    }));
}
