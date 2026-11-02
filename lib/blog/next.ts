import { normalizeText } from "@/lib/normalizeText";
import type { ArticleData } from "./article-schema";
import type { ExcelTopic } from "./excel";
import type { BacklogTopic } from "./sources";

// Siguiente artículo a redactar (npm run blog:next). Regla: el tema con la
// fecha más próxima que todavía no tiene archivo en content/blog/articles,
// saltando los que el Excel marca como Descartado. Empates de fecha (los
// 8 de Lanzamiento salen el mismo día): por número de ID, B01 a B08.

function idNumber(id: string): number {
  return Number(id.replace(/\D/g, "")) || 0;
}

export function isDiscarded(topic: ExcelTopic): boolean {
  return normalizeText(topic.estado) === "descartado";
}

export function nextTopics(topics: ExcelTopic[], writtenTopicIds: ReadonlySet<string>, limit = 1): ExcelTopic[] {
  return topics
    .filter((topic) => !isDiscarded(topic) && !writtenTopicIds.has(topic.id))
    .sort((a, b) => {
      // Sin fecha va al final.
      if (a.fecha !== b.fecha) return !a.fecha ? 1 : !b.fecha ? -1 : a.fecha < b.fecha ? -1 : 1;
      return idNumber(a.id) - idNumber(b.id);
    })
    .slice(0, Math.max(0, limit));
}

/**
 * El tema como si ya estuviera escrito (vacío, en su fecha del Excel) para
 * cruzarlo con el mapa de enlaces: así blog:next dice qué enlaces debe
 * llevar y en qué artículos existentes hay que agregar la ida y vuelta.
 */
export function plannedArticle(topic: ExcelTopic): ArticleData {
  const publishAt = `${topic.fecha || "2099-12-31"}T08:00:00-06:00`;
  return { topicId: topic.id, publishAt, updatedAt: publishAt, intro: "", blocks: [], faq: [] } as unknown as ArticleData;
}

/** Diferencias entre el Excel y supabase/seed/blog-backlog.csv (fecha y slug). */
export function crossCheck(topic: ExcelTopic, csv: BacklogTopic | undefined): string[] {
  if (!csv) return [`${topic.id} está en el Excel pero no en supabase/seed/blog-backlog.csv`];
  const warnings: string[] = [];
  if (topic.fecha !== csv.fechaProgramada) {
    warnings.push(`${topic.id}: la fecha del Excel (${topic.fecha || "sin fecha"}) no coincide con la del CSV (${csv.fechaProgramada || "sin fecha"})`);
  }
  const slug = topic.brief?.slug ?? "";
  if (slug !== csv.slug) {
    warnings.push(`${topic.id}: el slug del Excel («${slug || "sin slug"}») no coincide con el del CSV («${csv.slug || "sin slug"}»)`);
  }
  return warnings;
}

function fmtDate(date: string): string {
  if (!date) return "sin fecha";
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

function list(items: string[], numbered = false): string[] {
  if (items.length === 0) return ["    — (vacío en el Excel)"];
  return items.map((item, i) => `    ${numbered ? `${i + 1}.` : "•"} ${item}`);
}

function field(label: string, value: string): string {
  return `  ${label}: ${value || "— (vacío en el Excel)"}`;
}

/** Ficha completa del tema: datos, brief SEO y guía PDF. */
export function formatNextTopic(topic: ExcelTopic): string {
  const out = [
    `\nSiguiente artículo: ${topic.id} · publica el ${fmtDate(topic.fecha)}`,
    `\n  H1:       ${topic.titulo}`,
    `  Keyword:  ${topic.keyword}`,
    `  Clúster:  ${topic.cluster} (${topic.rol})`,
    `  Tipo:     ${topic.tipo}`,
    `  Estado:   ${topic.estado || "—"}`,
    `  Ángulo:   ${topic.angulo || "—"}`,
  ];

  const brief = topic.brief;
  out.push("\nBrief SEO");
  if (!brief) {
    out.push(`  — ${topic.id} no tiene fila en la hoja «Briefs SEO»`);
  } else {
    out.push(
      field("Slug", brief.slug),
      field("Title tag", brief.titleTag ? `${brief.titleTag} (${brief.titleTag.length} car.)` : ""),
      field("Meta description", brief.meta ? `${brief.meta} (${brief.meta.length} car.)` : ""),
      field("Keywords secundarias", brief.secundarias),
      field("Rango de palabras", brief.extension),
      "  Estructura (H2):",
      ...list(brief.h2, true),
      "  Preguntas frecuentes:",
      ...list(brief.faq),
      "  Puntos clave y reglas de contenido:",
      ...list(brief.puntosClave),
      field("Productos / categorías a enlazar", brief.productos),
      "  Enlaces internos (con ancla):",
      ...list(brief.enlacesInternos),
      "  Enlaces futuros:",
      ...list(brief.enlacesFuturos),
      field("Enfoque local", brief.enfoqueLocal),
      field("CTA Club 57", brief.cta),
      field("Regla de redacción", brief.regla || topic.regla)
    );
  }

  const guia = topic.guia;
  out.push("\nGuía PDF");
  if (!guia) {
    out.push(`  — ${topic.id} no tiene fila en la hoja «Guías PDF»`);
  } else {
    out.push(
      field("Título", guia.titulo),
      field("Formato", guia.formato),
      field("Páginas (contenido)", guia.paginas === null ? "" : `${guia.paginas} + portada`),
      field("Contenido por página", guia.contenido),
      field("Regla de redacción", guia.regla)
    );
  }
  return out.join("\n");
}

/** Lista corta para --list N. */
export function formatTopicList(topics: ExcelTopic[]): string {
  if (topics.length === 0) return "\nNo quedan temas pendientes en el Excel.";
  const out = [`\nPróximos ${topics.length} tema(s) sin artículo:`];
  topics.forEach((topic, i) => {
    out.push(`  ${i + 1}. ${topic.id} · ${fmtDate(topic.fecha)} · ${topic.tipo} · ${topic.cluster}`);
    out.push(`     ${topic.titulo}`);
    out.push(`     keyword: ${topic.keyword} · slug: ${topic.brief?.slug || "—"}`);
  });
  return out.join("\n");
}
