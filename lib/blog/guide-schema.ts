import { z } from "zod";
import { BlogContentError } from "./build";

// Esquema de una guía PDF de Club 57 (content/blog/guides/{slug}.ts), una
// por artículo, alineada con la hoja «Guías PDF» del Excel. El PDF se
// genera al descargar (lib/blog/guide-pdf.ts): aquí solo hay contenido.
//
// Páginas: el PDF siempre lleva portada, así que una guía tiene de 2 a 4
// páginas = portada + 1 a 3 páginas de contenido. El Excel cuenta solo las
// de contenido («1 página tipo cartel» = portada + 1).
//
// Texto plano (sin **negrita** ni enlaces: es un impreso). Mismas reglas
// de redacción que los artículos; blog:check busca el texto prohibido.

const text = z.string().trim().min(1, "No puede ir vacío");
const optionalTitle = text.optional();

const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("checklist"), titulo: optionalTitle, items: z.array(text).min(1) }).strict(),
  z
    .object({
      type: z.literal("tabla"),
      titulo: optionalTitle,
      columnas: z.array(text).min(2).max(6, "Una tabla de guía tiene como máximo 6 columnas"),
      filas: z.array(z.array(text)).min(1),
      /** Ancho relativo de cada columna (p. ej. [2, 3, 3]); por defecto iguales. */
      anchos: z.array(z.number().positive()).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("pasos"),
      titulo: optionalTitle,
      items: z.array(z.object({ titulo: text, texto: text }).strict()).min(2),
    })
    .strict(),
  z.object({ type: z.literal("consejo"), titulo: optionalTitle, texto: text, mitad: z.boolean().optional() }).strict(),
  z
    .object({
      type: z.literal("callout"),
      variante: z.enum(["seguridad", "importante", "nota"]),
      titulo: text,
      texto: text.optional(),
      items: z.array(text).min(1).optional(),
      mitad: z.boolean().optional(),
    })
    .strict(),
]);

// mitad: true en dos recuadros seguidos (consejo o callout) los pone lado a
// lado en el PDF, a media página cada uno: útil para que una guía tipo
// cartel quepa en una sola hoja.

const pageSchema = z
  .object({
    titulo: text,
    intro: text.optional(),
    bloques: z.array(blockSchema).min(1),
  })
  .strict();

export const guideSchema = z
  .object({
    topicId: z.string().regex(/^B\d{2,3}$/, 'El topicId es como "B03"'),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug va en minúsculas, sin acentos y con guiones"),
    titulo: text,
    subtitulo: text,
    paginas: z
      .array(pageSchema)
      .min(1, "La guía necesita al menos 1 página de contenido (2 con la portada)")
      .max(3, "Máximo 3 páginas de contenido (4 con la portada)"),
  })
  .strict()
  .superRefine((guide, ctx) => {
    guide.paginas.forEach((page, pageIndex) => {
      page.bloques.forEach((block, blockIndex) => {
        const path = ["paginas", pageIndex, "bloques", blockIndex];
        if (block.type === "tabla") {
          block.filas.forEach((row, rowIndex) => {
            if (row.length !== block.columnas.length) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path, "filas", rowIndex], message: `La fila ${rowIndex + 1} tiene ${row.length} celdas y la tabla ${block.columnas.length} columnas` });
            }
          });
          if (block.anchos && block.anchos.length !== block.columnas.length) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path, "anchos"], message: "anchos debe tener un valor por columna" });
          }
        }
        if (block.type === "callout" && !block.texto && !block.items) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: "El callout necesita texto o items" });
        }
      });
    });
  });

export type GuideInput = z.input<typeof guideSchema>;
export type GuideData = z.output<typeof guideSchema>;
export type GuideBlock = GuideData["paginas"][number]["bloques"][number];

export interface GuideSource {
  /** Nombre del archivo sin extensión (debe coincidir con el slug). */
  file: string;
  guide: unknown;
}

export function defineGuide(guide: GuideInput): GuideInput {
  return guide;
}

/** Todos los textos de la guía (para el texto prohibido de blog:check). */
export function guideStrings(guide: GuideData): string[] {
  const out = [guide.titulo, guide.subtitulo];
  for (const page of guide.paginas) {
    out.push(page.titulo);
    if (page.intro) out.push(page.intro);
    for (const block of page.bloques) {
      if (block.titulo) out.push(block.titulo);
      switch (block.type) {
        case "checklist":
          out.push(...block.items);
          break;
        case "tabla":
          out.push(...block.columnas, ...block.filas.flat());
          break;
        case "pasos":
          out.push(...block.items.flatMap((item) => [item.titulo, item.texto]));
          break;
        case "consejo":
          out.push(block.texto);
          break;
        case "callout":
          if (block.texto) out.push(block.texto);
          if (block.items) out.push(...block.items);
          break;
      }
    }
  }
  return out;
}

/** Valida todas las guías; con alguna inválida lanza BlogContentError (rompe el build). */
export function buildGuides(sources: readonly GuideSource[]): GuideData[] {
  const errors: string[] = [];
  const guides: GuideData[] = [];
  for (const source of sources) {
    const result = guideSchema.safeParse(source.guide);
    if (!result.success) {
      errors.push(`content/blog/guides/${source.file}.ts:\n${result.error.issues.map((issue) => `  · ${issue.path.join(".") || "(guía)"}: ${issue.message}`).join("\n")}`);
    } else if (result.data.slug !== source.file) {
      errors.push(`content/blog/guides/${source.file}.ts: el slug "${result.data.slug}" no coincide con el nombre del archivo`);
    } else {
      guides.push(result.data);
    }
  }
  if (errors.length > 0) throw new BlogContentError(errors.join("\n"));
  return guides;
}
