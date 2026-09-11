import { createClient } from "@/lib/supabase/server";
import { mapRowToProduct, PRODUCT_SELECT } from "@/lib/catalog/mapRow";
import type { Product } from "@/types/catalog";

// Capa de acceso a datos del catálogo — antes leía mockProducts en
// memoria, ahora consulta Supabase de verdad, pero /categoria/[slug],
// /buscar, /producto/[slug] y FeaturedProducts (Home) solo conocen esta
// forma async: siguen llamando `await getCategoryProducts(slug)` /
// `await searchProducts(q)` / `await getProductBySlug(slug)` igual que
// antes, esas páginas no cambiaron.
export async function getCategoryProducts(categorySlug: string): Promise<Product[]> {
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();
  if (!category) return [];

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("category_id", category.id)
    .eq("active", true)
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapRowToProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  return data ? mapRowToProduct(data) : undefined;
}

// categoryId aquí es en realidad el slug de la categoría (ver el
// comentario en types/catalog.ts) — el nombre del parámetro se conserva
// tal cual porque /producto/[slug] ya lo llama así:
// getRelatedProducts(product.categoryId, product.id).
export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string
): Promise<Product[]> {
  const products = await getCategoryProducts(categoryId);
  return products.filter((product) => product.id !== excludeProductId);
}

// Home (FeaturedProducts): los más recientes primero — todavía no hay
// noción de "destacado" propia, solo "activo".
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapRowToProduct);
}

// Busca por nombre de producto o por SKU de alguna de sus variantes —
// PostgREST no deja filtrar el recurso principal por una columna de una
// relación anidada (product_variants.sku) directo, así que la coincidencia
// por SKU se resuelve con una segunda consulta y se combinan resultados
// sin duplicar productos.
export async function searchProducts(query: string): Promise<Product[]> {
  const normalized = query.trim();
  if (!normalized) return [];

  const supabase = await createClient();
  const pattern = `%${normalized}%`;

  const { data: byName } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .ilike("name", pattern);

  const { data: variantMatches } = await supabase
    .from("product_variants")
    .select("product_id")
    .ilike("sku", pattern);

  const idsFromSku = [...new Set((variantMatches ?? []).map((row) => row.product_id))];

  let bySku: Product[] = [];
  if (idsFromSku.length > 0) {
    const { data } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("active", true)
      .in("id", idsFromSku);
    bySku = (data ?? []).map(mapRowToProduct);
  }

  const merged = new Map<string, Product>();
  for (const product of [...(byName ?? []).map(mapRowToProduct), ...bySku]) {
    merged.set(product.id, product);
  }
  return Array.from(merged.values());
}
