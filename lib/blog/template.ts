import { CLUSTER_LIST } from "@/content/blog/clusters";
import { normalizeText } from "@/lib/normalizeText";
import type { BacklogTopic, PlannedLink } from "./sources";

// Plantilla de un artículo nuevo (npm run blog:new -- B09). Solo datos del
// backlog: nada de contenido. Los textos marcados TODO pasan el esquema (el
// sitio sigue levantando en dev mientras se redacta), pero blog:check los
// trata como ERROR (texto prohibido): un borrador no puede publicarse por
// accidente porque frena el build. Se usa TODO y no [VERIFICAR] porque los
// corchetes son sintaxis de enlace en los textos con formato.

export const PLACEHOLDER_PUBLISH_AT = "2099-12-31T08:00:00-06:00";

export function clusterSlugFor(nombre: string): string | undefined {
  return CLUSTER_LIST.find((cluster) => normalizeText(cluster.nombre) === normalizeText(nombre))?.slug;
}

const META_PLACEHOLDER =
  "TODO Meta description del brief SEO: de 120 a 155 caracteres, con la keyword y lo que el lector se lleva al terminar y aprende.";

export function articleTemplate(topic: BacklogTopic, links: PlannedLink[]): string {
  const cluster = clusterSlugFor(topic.cluster);
  if (!cluster) throw new Error(`${topic.id}: el clúster "${topic.cluster}" no existe en content/blog/clusters.ts`);
  const publishAt = topic.fechaProgramada ? `${topic.fechaProgramada}T08:00:00-06:00` : PLACEHOLDER_PUBLISH_AT;
  const related = [...new Set(links.filter((link) => link.origen === topic.id).map((link) => link.destino))].slice(0, 5);
  const seoTitle = `TODO ${topic.titulo}`.slice(0, 60);
  const json = (value: string) => JSON.stringify(value);

  return `import { defineArticle } from "@/lib/blog/article-schema";

// ${topic.id} · ${topic.tipo || "sin tipo"} · ${topic.cluster}
// Generado con \`npm run blog:new -- ${topic.id}\` desde supabase/seed/blog-backlog.csv.
// Redacta según la hoja "Briefs SEO" del Excel (docs/blog/backlog_blog_ferreteria57.xlsx)
// y quita todos los TODO: blog:check no deja publicar mientras quede uno.
// Flujo completo: docs/blog/FLUJO.md
export default defineArticle({
  topicId: ${json(topic.id)},
  slug: ${json(topic.slug)},
  title: ${json(topic.titulo)},
  // Title SEO del brief (máx. 60 caracteres).
  seoTitle: ${json(seoTitle)},
  // 120–155 caracteres.
  metaDescription: ${json(META_PLACEHOLDER)},
  keyword: ${json(topic.keyword)},
  // Keywords secundarias del brief.
  secondaryKeywords: [],
  cluster: ${json(cluster)},
  pillar: ${topic.rol === "Pilar"},
  publishAt: ${json(publishAt)},${topic.fechaProgramada ? "" : " // PLACEHOLDER: el tema no tiene fecha_programada en el backlog"}
  updatedAt: ${json(publishAt)},
  // Respuesta directa en las primeras 100 palabras, con la keyword.
  intro: ${json(`TODO Intro con la keyword «${topic.keyword}».`)},
  blocks: [
    // Estructura de H2 del brief (mínimo 4 h2; la keyword en al menos uno).
    // Bloques disponibles:
    //   { type: "h2", text: "…" }  { type: "h3", text: "…" }
    //   { type: "p", text: "Texto con **negrita**, [enlace](/categoria/herramienta) y [[B03|ancla]]" }
    //   { type: "ul", items: ["…"] }  { type: "ol", items: ["…"] }
    //   { type: "table", caption: "…", headers: ["…", "…"], rows: [["…", "…"]] }
    //   { type: "callout", variant: "consejo" | "seguridad" | "nota", title: "…", text: "…" }
    //   { type: "steps", items: [{ title: "…", text: "…" }] }
    //   { type: "cta" }  // la guía de Club 57, después del 2.º o 3.º h2
    // Categorías del catálogo: content/blog/catalog-links.ts (catalogHref).
    // Enlaces a otros artículos: npm run blog:links -- ${topic.id}
    { type: "p", text: "TODO Contenido del artículo." },
  ],
  // Preguntas frecuentes del brief (mínimo 3, respuestas de 40 a 80 palabras).
  faq: [],
  guia: { titulo: ${json(topic.guiaTitulo || "TODO Título de la guía PDF")} },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ${JSON.stringify(related)},
});
`;
}

// Plantilla de la guía PDF del tema (content/blog/guides/{slug}.ts). Igual
// que el artículo: pasa el esquema con marcadores TODO y blog:check no deja
// publicar mientras quede uno.
export function guideTemplate(topic: BacklogTopic): string {
  const json = (value: string) => JSON.stringify(value);
  return `import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de ${topic.id} (hoja «Guías PDF» del Excel: título, páginas y contenido por página).
// Generado con \`npm run blog:new -- ${topic.id}\`. El PDF agrega la portada: aquí van de 1 a 3
// páginas de contenido. Texto plano, mismas reglas de redacción que el artículo.
// Ver el PDF: npm run blog:pdf -- ${topic.id}
export default defineGuide({
  topicId: ${json(topic.id)},
  slug: ${json(topic.slug)},
  // Debe coincidir con guia.titulo del artículo.
  titulo: ${json(topic.guiaTitulo || "TODO Título de la guía PDF")},
  subtitulo: "TODO Una línea: qué resuelve la guía y cuándo usarla.",
  paginas: [
    {
      titulo: "TODO Título de la página 1",
      // Bloques disponibles:
      //   { type: "tabla", titulo?: "…", columnas: ["…", "…"], filas: [["…", "…"]], anchos?: [1, 2] }
      //   { type: "checklist", titulo?: "…", items: ["…"] }
      //   { type: "pasos", titulo?: "…", items: [{ titulo: "…", texto: "…" }] }
      //   { type: "consejo", titulo?: "…", texto: "…" }
      //   { type: "callout", variante: "seguridad" | "importante" | "nota", titulo: "…", texto?: "…", items?: ["…"] }
      bloques: [{ type: "checklist", items: ["TODO Contenido de la página según la hoja Guías PDF"] }],
    },
  ],
});
`;
}
