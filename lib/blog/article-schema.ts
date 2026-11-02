import { z } from "zod";
import { CLUSTER_SLUGS } from "@/content/blog/clusters";
import { InlineSyntaxError, parseInline } from "./inline";

// Esquema de un artículo del blog (content/blog/articles/{slug}.ts). Se
// valida en build: lib/blog/content.ts lo corre sobre todos los artículos
// al cargar el módulo y scripts/blog-build-index.ts al generar el índice,
// así que un campo mal escrito rompe el build con un mensaje claro en vez
// de publicar una página a medias.

// Texto con sintaxis en línea (**negrita**, [texto](/ruta), [[B04|ancla]]):
// se parsea aquí para que una marca mal cerrada falle en la validación.
const inline = z
  .string()
  .trim()
  .min(1, "No puede ir vacío")
  .superRefine((value, ctx) => {
    try {
      parseInline(value);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof InlineSyntaxError ? error.message : String(error),
      });
    }
  });

const plain = z.string().trim().min(1, "No puede ir vacío");

// Fecha ISO con la zona del negocio explícita (America/Mexico_City ya no
// tiene horario de verano: siempre -06:00). Obligar el offset evita que
// "2026-10-13T08:00" se interprete en UTC en el servidor de Vercel.
const isoMx = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?-06:00$/, 'Usa ISO con zona -06:00, p. ej. "2026-10-13T08:00:00-06:00"')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Fecha inválida");

export const RESERVED_SLUGS = ["categoria", "pagina", "rss.xml"] as const;

const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("h2"), text: plain }).strict(),
  z.object({ type: z.literal("h3"), text: plain }).strict(),
  z.object({ type: z.literal("p"), text: inline }).strict(),
  z.object({ type: z.literal("ul"), items: z.array(inline).min(1) }).strict(),
  z.object({ type: z.literal("ol"), items: z.array(inline).min(1) }).strict(),
  z
    .object({
      type: z.literal("table"),
      caption: plain,
      headers: z.array(plain).min(2),
      rows: z.array(z.array(inline)).min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal("callout"),
      variant: z.enum(["consejo", "seguridad", "nota"]),
      title: plain.optional(),
      text: inline,
    })
    .strict(),
  z
    .object({
      type: z.literal("steps"),
      items: z.array(z.object({ title: plain, text: inline }).strict()).min(2),
    })
    .strict(),
  z.object({ type: z.literal("cta") }).strict(),
]);

export const articleSchema = z
  .object({
    topicId: z.string().regex(/^B\d{2,3}$/, 'El topicId es como "B03"'),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug va en minúsculas, sin acentos y con guiones")
      .refine((slug) => !(RESERVED_SLUGS as readonly string[]).includes(slug), "Slug reservado por las rutas del blog"),
    title: plain,
    seoTitle: plain.max(60, "seoTitle: máximo 60 caracteres"),
    metaDescription: plain
      .min(120, "metaDescription: mínimo 120 caracteres")
      .max(155, "metaDescription: máximo 155 caracteres"),
    keyword: plain,
    secondaryKeywords: z.array(plain),
    cluster: z.enum(CLUSTER_SLUGS),
    pillar: z.boolean(),
    publishAt: isoMx,
    updatedAt: isoMx,
    readingMinutes: z.number().int().positive().optional(),
    intro: inline,
    blocks: z.array(blockSchema).min(1),
    faq: z.array(z.object({ q: plain, a: inline }).strict()),
    guia: z.object({ titulo: plain }).strict(),
    relatedTopicIds: z.array(z.string().regex(/^B\d{2,3}$/)),
  })
  .strict()
  .superRefine((article, ctx) => {
    if (new Date(article.updatedAt).getTime() < new Date(article.publishAt).getTime()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["updatedAt"], message: "updatedAt no puede ser anterior a publishAt" });
    }
    if (article.relatedTopicIds.includes(article.topicId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["relatedTopicIds"], message: "Un artículo no puede relacionarse consigo mismo" });
    }
    article.blocks.forEach((block, blockIndex) => {
      if (block.type !== "table") return;
      block.rows.forEach((row, rowIndex) => {
        if (row.length !== block.headers.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["blocks", blockIndex, "rows", rowIndex],
            message: `La fila ${rowIndex + 1} tiene ${row.length} celdas y la tabla ${block.headers.length} columnas`,
          });
        }
      });
    });
    const ctas = article.blocks.filter((block) => block.type === "cta").length;
    if (ctas > 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blocks"], message: "Solo puede haber un bloque cta" });
    }
  });

export type ArticleInput = z.input<typeof articleSchema>;
export type ArticleData = z.output<typeof articleSchema>;
export type ArticleBlock = ArticleData["blocks"][number];

// Para que cada archivo de artículo tenga autocompletado y errores de tipo
// en el editor sin esperar al build: `export default defineArticle({...})`.
export function defineArticle(article: ArticleInput): ArticleInput {
  return article;
}

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  · ${issue.path.length ? issue.path.join(".") : "(artículo)"}: ${issue.message}`)
    .join("\n");
}
