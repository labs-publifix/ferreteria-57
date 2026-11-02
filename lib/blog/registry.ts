import { getArticleByTopicId } from "./content";
import type { RegistryEntry } from "./types";

// Registro de artículos reales del blog: une un tema del backlog
// (blog_topics.id) con su archivo en content/blog/articles. El estado que
// muestra /admin/blog (programado / publicado) sale de aquí: con artículo y
// publishAt en el futuro → programado; ya pasado → publicado.
export function getRegistryEntry(topicId: string): RegistryEntry | undefined {
  const article = getArticleByTopicId(topicId);
  return article ? { slug: article.slug, publishAt: article.publishAt } : undefined;
}
