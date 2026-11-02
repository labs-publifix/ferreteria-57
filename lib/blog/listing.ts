import { ARTICLES_PER_PAGE, pageSlice, totalPages } from "./content";

// Reparto de los listados del blog en páginas (funciones puras).
//
// /blog: la página 1 abre con el artículo más reciente en grande («lo más
// reciente») y debajo los siguientes 12; las páginas 2, 3… muestran 12
// cada una. El destacado nunca se repite en la cuadrícula.
// /blog/categoria/…: 12 por página, sin destacado.

export interface Listing<T> {
  /** Artículo destacado (solo en la página 1 de /blog). */
  lead: T | null;
  items: T[];
  totalPages: number;
}

export function hubListing<T>(items: readonly T[], page: number, perPage = ARTICLES_PER_PAGE): Listing<T> {
  const [lead, ...rest] = items;
  return {
    lead: page === 1 ? (lead ?? null) : null,
    items: pageSlice(rest, page, perPage),
    totalPages: hubTotalPages(items.length, perPage),
  };
}

export function hubTotalPages(count: number, perPage = ARTICLES_PER_PAGE): number {
  return totalPages(Math.max(0, count - 1), perPage);
}

export function categoryListing<T>(items: readonly T[], page: number, perPage = ARTICLES_PER_PAGE): Listing<T> {
  return { lead: null, items: pageSlice([...items], page, perPage), totalPages: totalPages(items.length, perPage) };
}

/** Ruta de la página n de un listado: /blog, /blog/pagina/2, /blog/categoria/x/pagina/3… */
export function listingPagePath(base: string, page: number): string {
  return page <= 1 ? base : `${base}/pagina/${page}`;
}

/**
 * Números a mostrar en la paginación: siempre la primera, la última y las
 * vecinas de la actual, con «…» en los huecos. Con 7 páginas o menos van
 * todas. Ej.: página 6 de 20 → 1 … 5 6 7 … 20.
 */
export function paginationItems(page: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const shown = new Set([1, total, page - 1, page, page + 1].filter((n) => n >= 1 && n <= total));
  // En los extremos, completa para que la fila no se encoja: 1 2 3 4 … 20.
  if (page <= 3) [2, 3, 4].forEach((n) => shown.add(n));
  if (page >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => shown.add(n));
  const sorted = [...shown].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(n - sorted[i - 1] === 2 ? n - 1 : "gap");
    out.push(n);
  });
  return out;
}
