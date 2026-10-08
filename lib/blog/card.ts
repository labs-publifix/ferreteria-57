import type { ClusterTema } from "@/content/blog/clusters";
import type { BlogArticle } from "./content";
import { formatFechaLarga } from "./dates";

// Lo mínimo que necesita una tarjeta del blog. Las fechas ya van
// formateadas desde el servidor (America/Mexico_City) para que el buscador,
// que pinta tarjetas en el cliente, no dependa de la zona del navegador ni
// provoque diferencias de hidratación.
export interface BlogCardData {
  slug: string;
  topicId: string;
  number: string;
  title: string;
  /** Resumen (la meta description del artículo), para la tarjeta destacada. */
  excerpt: string;
  keyword: string;
  cluster: string;
  clusterNombre: string;
  tema: ClusterTema;
  readingMinutes: number;
  publishAt: string;
  fechaLarga: string;
}

export function toCardData(article: BlogArticle): BlogCardData {
  return {
    slug: article.slug,
    topicId: article.topicId,
    number: article.number,
    title: article.title,
    excerpt: article.metaDescription,
    keyword: article.keyword,
    cluster: article.cluster,
    clusterNombre: article.clusterInfo.nombre,
    tema: article.clusterInfo.tema,
    readingMinutes: article.readingMinutes,
    publishAt: article.publishAt,
    fechaLarga: formatFechaLarga(article.publishAt),
  };
}
