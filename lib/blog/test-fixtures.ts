// Artículo mínimo válido para las pruebas del blog (no se publica: no está
// en content/blog/articles).
export function fixtureArticle(overrides: Record<string, unknown> = {}) {
  return {
    topicId: "B90",
    slug: "articulo-de-prueba",
    title: "Artículo de prueba para el blog",
    seoTitle: "Artículo de prueba",
    metaDescription:
      "Descripción de prueba con la longitud suficiente para pasar la validación del esquema del blog de Ferretería 57 sin problema.",
    keyword: "prueba",
    secondaryKeywords: ["otra prueba"],
    cluster: "herramientas-y-mantenimiento",
    pillar: false,
    publishAt: "2026-10-13T08:00:00-06:00",
    updatedAt: "2026-10-13T08:00:00-06:00",
    intro: "Intro con **negrita**.",
    blocks: [
      { type: "h2", text: "Primera sección" },
      { type: "p", text: "Un párrafo." },
      { type: "cta" },
    ],
    faq: [{ q: "¿Pregunta?", a: "Respuesta." }],
    guia: { titulo: "Guía de prueba" },
    relatedTopicIds: [],
    ...overrides,
  };
}
