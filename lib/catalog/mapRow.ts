import type { Product, ProductVariant, TechnicalSpec } from "@/types/catalog";

// Select reutilizado por lib/catalog/queries.ts (Server Components, vía
// el cliente de servidor) y ProductCatalogProvider (cliente, vía el
// cliente de navegador) — misma forma de fila en ambos lados, así
// mapRowToProduct sirve para los dos sin duplicar el shape.
export const PRODUCT_SELECT = "*, categories(slug), product_variants(*)";

interface ProductVariantRow {
  id: string;
  sku: string;
  label: string;
  price: number | string;
  compare_at_price: number | string | null;
  stock: number;
  position: number;
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string;
  short_description: string | null;
  technical_specs: TechnicalSpec[] | null;
  images: string[] | null;
  spec_sheet_url: string | null;
  categories: { slug: string } | null;
  product_variants: ProductVariantRow[] | null;
}

// numeric de Postgres llega serializado como string vía PostgREST (evita
// perder precisión) — Number() lo vuelve a lo que espera ProductVariant.
function mapVariant(row: ProductVariantRow): ProductVariant {
  return {
    id: row.id,
    sku: row.sku,
    label: row.label,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : undefined,
    stock: row.stock,
  };
}

export function mapRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    // Slug de la categoría, no su uuid — ver el comentario en
    // types/catalog.ts sobre por qué Product.categoryId sigue siendo el
    // slug (así /categoria/[slug] y el breadcrumb de /producto/[slug]
    // resuelven la categoría exactamente igual que con el mock anterior).
    categoryId: row.categories?.slug ?? "",
    shortDescription: row.short_description ?? "",
    technicalSpecs: row.technical_specs ?? [],
    images: row.images ?? [],
    specSheetUrl: row.spec_sheet_url ?? undefined,
    variants: (row.product_variants ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(mapVariant),
  };
}
