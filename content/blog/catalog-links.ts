// Categorías REALES del catálogo de producción a las que el blog puede
// enlazar. Fuente única: el contenido usa catalogHref() y blog:check
// rechaza cualquier /categoria/... que no esté aquí. Si el catálogo agrega
// o renombra una categoría, se actualiza esta lista.
export const CATALOG_CATEGORIES = [
  { slug: "iluminacion", nombre: "Iluminación" },
  { slug: "electrico", nombre: "Eléctrico" },
  { slug: "jardineria", nombre: "Jardinería" },
  { slug: "seguridad", nombre: "Seguridad" },
  { slug: "mecanica", nombre: "Mecánica" },
  { slug: "pintura", nombre: "Pintura" },
  { slug: "cerrajeria", nombre: "Cerrajería" },
  { slug: "herreria", nombre: "Herrería" },
  { slug: "herramienta", nombre: "Herramienta" },
  { slug: "plomeria", nombre: "Plomería" },
] as const;

export type CatalogCategorySlug = (typeof CATALOG_CATEGORIES)[number]["slug"];

/** Ruta de una categoría del catálogo: un slug fuera de la lista no compila. */
export function catalogHref(slug: CatalogCategorySlug): string {
  return `/categoria/${slug}`;
}

/** Nombre visible de la categoría, para el texto del enlace. */
export function catalogName(slug: CatalogCategorySlug): string {
  return CATALOG_CATEGORIES.find((category) => category.slug === slug)!.nombre;
}

/** Para el validador: ¿esta ruta /categoria/... es una categoría permitida? */
export function isAllowedCatalogPath(path: string): boolean {
  const match = /^\/categoria\/([^/?#]+)\/?(?:[?#].*)?$/.exec(path);
  return match !== null && CATALOG_CATEGORIES.some((category) => category.slug === match[1]);
}
