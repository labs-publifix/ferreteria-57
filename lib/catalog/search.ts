// Tipo compartido entre el endpoint /api/search (servidor) y el
// desplegable en vivo del Header (cliente) — una sola forma de resultado
// para no tener que traducir entre dos shapes distintos.
export interface SearchResultItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  clave: string | null;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  categoryName: string;
  inStock: boolean;
}

export const SEARCH_RESULT_LIMIT = 8;

// Mismo umbral en cliente y servidor: menos de esto para texto libre no
// dispara ninguna consulta (ver comentario de search_products() en la
// migración) — un código (numérico/alfanumérico corto) sí puede buscar
// desde 1 carácter, pero eso lo decide el propio RPC según el contenido,
// no el largo; aquí solo se evita mandar peticiones vacías.
export function isQueryWorthSearching(query: string): boolean {
  return query.trim().length > 0;
}

interface SearchRow {
  id: string;
  slug: string;
  name: string;
  brand: string;
  clave: string | null;
  sku: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  image_url: string | null;
  category_name: string;
  in_stock: boolean;
}

export function mapSearchRow(row: SearchRow): SearchResultItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    clave: row.clave,
    sku: row.sku,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : null,
    imageUrl: row.image_url,
    categoryName: row.category_name,
    inStock: row.in_stock,
  };
}
