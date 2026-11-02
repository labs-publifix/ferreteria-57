import type { ArticleData } from "./article-schema";
import { inlineStrings } from "./build";
import { topicRefs } from "./inline";
import type { PlannedLink } from "./sources";
import { isPublished } from "./visibility";

// Cruce del mapa de enlaces planeados (docs/blog/mapa-enlaces.csv) contra
// los [[Bxx]] reales de los artículos. Solo lee: nunca modifica archivos.

/** Lo que el cruce necesita de un artículo (cualquier ArticleData sirve). */
export type LinkArticle = ArticleData;

/**
 * Estado de un enlace planeado origen → destino:
 * - cumplido: los dos artículos existen y el origen ya lleva [[destino]].
 * - falta: los dos existen, el destino ya es público o sale antes que el
 *   origen, y el enlace no está. Se puede agregar ya.
 * - esperando: los dos existen pero el destino todavía no se publica y sale
 *   después que el origen; se agrega al publicarse (actualizando el origen).
 * - futuro: falta escribir el origen o el destino.
 */
export type LinkStatus = "cumplido" | "falta" | "esperando" | "futuro";

export interface LinkCheck {
  link: PlannedLink;
  status: LinkStatus;
  /** Artículos del par que todavía no existen (solo en "futuro"). */
  missing?: string[];
}

function refsOf(article: LinkArticle): Set<string> {
  return new Set(inlineStrings(article).flatMap(topicRefs));
}

export function linkStatus(link: PlannedLink, articles: Map<string, LinkArticle>, now: Date): LinkStatus {
  const origin = articles.get(link.origen);
  const target = articles.get(link.destino);
  if (!origin || !target) return "futuro";
  if (refsOf(origin).has(link.destino)) return "cumplido";
  const targetFirst = new Date(target.publishAt).getTime() <= new Date(origin.publishAt).getTime();
  return isPublished(target, now) || targetFirst ? "falta" : "esperando";
}

export interface TopicLinkReport {
  topicId: string;
  /** (a) Enlaces que este artículo debe llevar hacia artículos que ya salieron o salen antes. */
  outgoing: LinkCheck[];
  /** (b) Enlaces de ida y vuelta: artículos existentes que deben apuntar a este. */
  incoming: LinkCheck[];
  /** (c) Pendientes futuros: el otro artículo aún no existe (o sale después y no se ha publicado). */
  future: LinkCheck[];
}

export function topicLinkReport(topicId: string, links: PlannedLink[], articles: Map<string, LinkArticle>, now: Date): TopicLinkReport {
  const report: TopicLinkReport = { topicId, outgoing: [], incoming: [], future: [] };
  for (const link of links) {
    if (link.origen !== topicId && link.destino !== topicId) continue;
    const status = linkStatus(link, articles, now);
    const check: LinkCheck =
      status === "futuro" ? { link, status, missing: [link.origen, link.destino].filter((id) => !articles.has(id)) } : { link, status };
    if (check.status === "futuro" || (check.status === "esperando" && link.origen === topicId)) report.future.push(check);
    else if (link.origen === topicId) report.outgoing.push(check);
    else report.incoming.push(check);
  }
  return report;
}

export interface LinkSummary {
  total: number;
  byStatus: Record<LinkStatus, number>;
  /** cumplidos / (cumplidos + faltan), o null si todavía no aplica ninguno. */
  compliance: number | null;
}

export function linkSummary(links: PlannedLink[], articles: Map<string, LinkArticle>, now: Date): LinkSummary {
  const byStatus: Record<LinkStatus, number> = { cumplido: 0, falta: 0, esperando: 0, futuro: 0 };
  for (const link of links) byStatus[linkStatus(link, articles, now)] += 1;
  const applicable = byStatus.cumplido + byStatus.falta;
  return { total: links.length, byStatus, compliance: applicable === 0 ? null : byStatus.cumplido / applicable };
}

/** Enlaces de ida y vuelta que faltan y ya se pueden agregar (advertencias de blog:check). */
export function missingRoundTrip(topicId: string, links: PlannedLink[], articles: Map<string, LinkArticle>, now: Date): LinkCheck[] {
  const report = topicLinkReport(topicId, links, articles, now);
  return [...report.outgoing, ...report.incoming].filter((check) => check.status === "falta");
}
