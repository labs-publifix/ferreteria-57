import { stripAccents } from "@/lib/normalizeText";

// Ids de los h2/h3 del artículo (anclas, índice "En este artículo"): slug
// sin acentos, estable (solo depende del texto) y sin duplicados. Los ids
// reservados son anclas fijas de la página del artículo (la guía, la FAQ,
// el contenido) y nunca se le asignan a un encabezado.
export const RESERVED_HEADING_IDS = [
  "contenido",
  "guia",
  "preguntas-frecuentes",
  "articulos-relacionados",
  "mas-en-la-categoria",
  "en-este-articulo",
] as const;

export function headingSlug(text: string): string {
  const slug = stripAccents(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "seccion";
}

// Asigna ids en orden de aparición: el segundo "Errores comunes" queda
// "errores-comunes-2", y uno que choque con un id reservado también lleva
// sufijo.
export function assignHeadingIds(texts: string[]): string[] {
  const used = new Set<string>(RESERVED_HEADING_IDS);
  return texts.map((text) => {
    const base = headingSlug(text);
    let id = base;
    let n = 2;
    while (used.has(id)) {
      id = `${base}-${n}`;
      n += 1;
    }
    used.add(id);
    return id;
  });
}

export interface TocEntry {
  id: string;
  text: string;
}
