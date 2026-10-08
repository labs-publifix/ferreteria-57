import { isAllowedCatalogPath } from "@/content/blog/catalog-links";
import { articleSchema, formatZodError, type ArticleData } from "./article-schema";
import { type ArticleSource, countWords, inlineStrings, plainTextOf, topicLinkIssues, enrich } from "./build";
import { parseInline } from "./inline";
import { missingRoundTrip } from "./links";
import type { BacklogTopic, PlannedLink } from "./sources";
import { stripAccents } from "@/lib/normalizeText";

// Validador de calidad del blog (npm run blog:check, también en prebuild y
// en CI). Funciones puras: los scripts leen los archivos y pasan los datos.
// ERRORES rompen el build; ADVERTENCIAS solo se reportan.

export interface QualityConfig {
  /** Texto prohibido en cualquier parte del artículo. */
  forbidden: { label: string; pattern: RegExp }[];
  /** Rango de palabras por tipo del backlog, con tolerancia (0.15 = ±15 %). */
  wordRanges: Record<string, [number, number]>;
  wordTolerance: number;
  minH2: number;
  minFaq: number;
  maxInternalLinks: number;
  minRelatedPublished: number;
}

export const DEFAULT_QUALITY_CONFIG: QualityConfig = {
  forbidden: [
    { label: "[VERIFICAR]", pattern: /\[VERIFICAR\]/ },
    { label: "TODO", pattern: /\bTODO\b/ },
    { label: "lorem", pattern: /lorem/i },
    { label: "número de norma (NOM/NMX)", pattern: /NOM-\d|NMX-/i },
    { label: "IPESA", pattern: /IPESA/i },
    { label: "Resend", pattern: /Resend/i },
    { label: "precio ($ + dígitos)", pattern: /\$\s?\d/ },
  ],
  wordRanges: {
    Pilar: [2000, 2500],
    Fondo: [1500, 2000],
    Corto: [900, 1300],
    "Fin de semana": [1200, 1600],
  },
  wordTolerance: 0.15,
  minH2: 4,
  minFaq: 3,
  maxInternalLinks: 12,
  minRelatedPublished: 2,
};

export interface ArticleReport {
  file: string;
  topicId?: string;
  slug?: string;
  title?: string;
  tipo?: string;
  publishAt?: string;
  errors: string[];
  warnings: string[];
}

// --- keyword --------------------------------------------------------------

function tokens(text: string): string[] {
  return stripAccents(text).toLowerCase().split(/[^a-z0-9ñ]+/).filter(Boolean);
}

// Variantes de singular/plural de una palabra en español ("brocas" ↔
// "broca", "cables" ↔ "cable", "taladros" ↔ "taladro"): el buscador trata
// igual "tipos de brocas" y "tipo de broca", así que el validador también.
function forms(word: string): Set<string> {
  const out = new Set([word]);
  if (word.length > 3 && word.endsWith("es")) out.add(word.slice(0, -2));
  if (word.length > 2 && word.endsWith("s")) out.add(word.slice(0, -1));
  return out;
}

function sameWord(a: string, b: string): boolean {
  const fa = forms(a);
  return [...forms(b)].some((form) => fa.has(form));
}

/** ¿El texto contiene la keyword como frase (sin acentos, mayúsculas ni plurales)? */
export function containsKeyword(text: string, keyword: string): boolean {
  const haystack = tokens(text);
  const needle = tokens(keyword);
  if (needle.length === 0) return false;
  for (let i = 0; i + needle.length <= haystack.length; i += 1) {
    if (needle.every((word, j) => sameWord(haystack[i + j], word))) return true;
  }
  return false;
}

// --- helpers --------------------------------------------------------------

const TZ_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" });

function allText(article: ArticleData): string[] {
  const out = [article.title, article.seoTitle, article.metaDescription, article.keyword, article.guia.titulo, ...article.secondaryKeywords];
  out.push(...inlineStrings(article));
  for (const block of article.blocks) {
    if (block.type === "h2" || block.type === "h3") out.push(block.text);
    if (block.type === "table") out.push(block.caption, ...block.headers);
    if (block.type === "callout" && block.title) out.push(block.title);
    if (block.type === "steps") out.push(...block.items.map((item) => item.title));
  }
  out.push(...article.faq.map((item) => item.q));
  return out;
}

function internalLinks(article: ArticleData): { href: string; text: string }[] {
  return inlineStrings(article).flatMap((text) =>
    parseInline(text).flatMap((token) =>
      token.type === "link" ? [{ href: token.href, text: token.text }] : token.type === "topic" ? [{ href: `[[${token.topicId}]]`, text: token.text }] : []
    )
  );
}

function fmt(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

// --- validación -----------------------------------------------------------

export function checkContent(
  sources: readonly ArticleSource[],
  backlog: BacklogTopic[],
  linkMap: PlannedLink[],
  now: Date,
  config: QualityConfig = DEFAULT_QUALITY_CONFIG
): ArticleReport[] {
  const topics = new Map(backlog.map((topic) => [topic.id, topic]));
  const reports: ArticleReport[] = [];
  const valid: { report: ArticleReport; data: ArticleData }[] = [];

  for (const source of sources) {
    const report: ArticleReport = { file: source.file, errors: [], warnings: [] };
    reports.push(report);
    const result = articleSchema.safeParse(source.article);
    if (!result.success) {
      const raw = source.article as Partial<ArticleData> | undefined;
      report.topicId = typeof raw?.topicId === "string" ? raw.topicId : undefined;
      report.errors.push(`Esquema inválido:\n${formatZodError(result.error)}`);
      continue;
    }
    const data = result.data;
    Object.assign(report, { topicId: data.topicId, slug: data.slug, title: data.title, publishAt: data.publishAt });
    if (data.slug !== source.file) report.errors.push(`El slug "${data.slug}" no coincide con el nombre del archivo (${source.file}.ts)`);
    valid.push({ report, data });
  }

  // Unicidad entre artículos válidos.
  const seenSlug = new Map<string, string>();
  const seenTopic = new Map<string, string>();
  for (const { report, data } of valid) {
    if (seenSlug.has(data.slug)) report.errors.push(`Slug duplicado con ${seenSlug.get(data.slug)}`);
    if (seenTopic.has(data.topicId)) report.errors.push(`topicId duplicado con ${seenTopic.get(data.topicId)}`);
    seenSlug.set(data.slug, `content/blog/articles/${data.slug}.ts`);
    seenTopic.set(data.topicId, `content/blog/articles/${data.slug}.ts`);
  }

  // [[Bxx]] resolvibles y cronológicamente válidos.
  const enriched = valid.map(({ data }) => enrich(data));
  for (const issue of topicLinkIssues(enriched)) {
    valid.find(({ data }) => data.topicId === issue.topicId)?.report.errors.push(issue.message.replace(/^B\d+ \([^)]*\): /, ""));
  }

  const byTopic = new Map(valid.map(({ data }) => [data.topicId, data]));

  for (const { report, data } of valid) {
    const topic = topics.get(data.topicId);
    const { errors, warnings } = report;

    // Backlog
    if (!topic) {
      errors.push(`${data.topicId} no existe en supabase/seed/blog-backlog.csv`);
    } else {
      report.tipo = topic.tipo;
      if (topic.slug !== data.slug) errors.push(`El slug no coincide con el del backlog ("${topic.slug}")`);
    }

    // Estructura
    const h2 = data.blocks.filter((block) => block.type === "h2");
    if (h2.length < config.minH2) errors.push(`Tiene ${h2.length} h2; mínimo ${config.minH2}`);
    if (data.faq.length < config.minFaq) errors.push(`FAQ con ${data.faq.length} preguntas; mínimo ${config.minFaq}`);
    if (!data.guia.titulo.trim()) errors.push("guia.titulo está vacío");

    // Keyword del backlog
    const keyword = topic?.keyword || data.keyword;
    if (keyword) {
      const firstParagraph = data.blocks.find((block) => block.type === "p");
      if (!containsKeyword(data.title, keyword) && !containsKeyword(data.seoTitle, keyword)) {
        errors.push(`La keyword "${keyword}" no aparece en title ni en seoTitle`);
      }
      if (!containsKeyword(data.intro, keyword) && !(firstParagraph && containsKeyword(firstParagraph.text, keyword))) {
        errors.push(`La keyword "${keyword}" no aparece en la intro ni en el primer párrafo`);
      }
      if (!h2.some((block) => containsKeyword(block.text, keyword))) errors.push(`La keyword "${keyword}" no aparece en ningún h2`);
    }

    // Enlaces al catálogo
    const links = internalLinks(data);
    for (const link of links) {
      if (link.href.startsWith("/categoria/") && !isAllowedCatalogPath(link.href)) {
        errors.push(`Enlace a una categoría que no existe en el catálogo: ${link.href} (ver content/blog/catalog-links.ts)`);
      }
    }

    // Texto prohibido
    const text = allText(data);
    for (const rule of config.forbidden) {
      const hit = text.find((value) => rule.pattern.test(value));
      if (hit) {
        const match = hit.match(rule.pattern)!;
        const at = Math.max(0, (match.index ?? 0) - 30);
        errors.push(`Texto prohibido (${rule.label}): «…${hit.slice(at, at + 70)}…»`);
      }
    }

    // ---- advertencias ----
    if (topic?.fechaProgramada) {
      const day = TZ_DAY.format(new Date(data.publishAt));
      if (day !== topic.fechaProgramada) {
        warnings.push(`publishAt (${fmt(day)}) distinto de fecha_programada del backlog (${fmt(topic.fechaProgramada)})`);
      }
    }

    const range = topic ? config.wordRanges[topic.tipo] : undefined;
    const words = countWords(plainTextOf(data));
    if (range) {
      const min = Math.round(range[0] * (1 - config.wordTolerance));
      const max = Math.round(range[1] * (1 + config.wordTolerance));
      if (words < min || words > max) {
        warnings.push(`${words} palabras; para "${topic!.tipo}" se espera ${range[0]}–${range[1]} (con tolerancia: ${min}–${max})`);
      }
    }

    if (topic && (topic.tipo === "Pilar" || topic.tipo === "Fondo")) {
      const missing = [
        data.blocks.some((block) => block.type === "table") ? null : "tabla",
        data.blocks.some((block) => block.type === "callout") ? null : "callout",
        data.blocks.some((block) => block.type === "cta") ? null : "CTA incrustado",
      ].filter(Boolean);
      if (missing.length > 0) warnings.push(`Artículo ${topic.tipo} sin ${missing.join(", ")}`);
    }

    if (links.length > config.maxInternalLinks) warnings.push(`${links.length} enlaces internos; máximo recomendado ${config.maxInternalLinks}`);

    const publishAt = new Date(data.publishAt).getTime();
    const relatedPublished = data.relatedTopicIds.filter((id) => {
      const related = byTopic.get(id);
      return related !== undefined && new Date(related.publishAt).getTime() <= Math.max(publishAt, now.getTime());
    });
    if (relatedPublished.length < config.minRelatedPublished) {
      warnings.push(
        `${relatedPublished.length} de ${data.relatedTopicIds.length} relatedTopicIds publicados al salir el artículo; mínimo ${config.minRelatedPublished} (${data.relatedTopicIds.join(", ") || "ninguno"})`
      );
    }

    for (const check of missingRoundTrip(data.topicId, linkMap, byTopic, now)) {
      const { link } = check;
      warnings.push(
        link.origen === data.topicId
          ? `Falta el enlace a ${link.destino} (${link.id}, ancla sugerida: «${link.ancla}»): [[${link.destino}|${link.ancla}]]`
          : `Falta el enlace de ida y vuelta en ${link.origen} hacia este artículo (${link.id}, ancla: «${link.ancla}»)`
      );
    }
  }

  return reports;
}

export function hasErrors(reports: ArticleReport[]): boolean {
  return reports.some((report) => report.errors.length > 0);
}
