import { createClient } from "@/lib/supabase/server";
import { mapRowToProduct, PRODUCT_SELECT } from "@/lib/catalog/mapRow";
import type { Product } from "@/types/catalog";

// El sitio público se degrada a "sin resultados" en vez de romperse ante
// cualquier error de Supabase (red caída, variables sin configurar) — a
// propósito, un visitante no debe ver una página caída por esto. Pero sin
// loguear el error, un problema real (p. ej. una migración nueva que
// todavía no se corrió, como pasó con la tabla reviews) se ve exactamente
// igual que "no hay productos", indistinguible desde afuera. Esto no
// cambia el comportamiento visible, solo deja rastro en los logs del
// servidor para poder diagnosticarlo.
function logCatalogError(context: string, error: { message: string } | null) {
  if (error) console.error(`[catalog] ${context}:`, error.message);
}

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

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("category_id", category.id)
    .eq("active", true)
    .order("created_at", { ascending: false });
  logCatalogError("getCategoryProducts", error);

  return (data ?? []).map(mapRowToProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  logCatalogError("getProductBySlug", error);

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
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  logCatalogError("getFeaturedProducts", error);

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

  const { data: byName, error: byNameError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .ilike("name", pattern);
  logCatalogError("searchProducts (byName)", byNameError);

  const { data: variantMatches, error: variantError } = await supabase
    .from("product_variants")
    .select("product_id")
    .ilike("sku", pattern);
  logCatalogError("searchProducts (variantMatches)", variantError);

  const idsFromSku = [...new Set((variantMatches ?? []).map((row) => row.product_id))];

  let bySku: Product[] = [];
  if (idsFromSku.length > 0) {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("active", true)
      .in("id", idsFromSku);
    logCatalogError("searchProducts (bySku)", error);
    bySku = (data ?? []).map(mapRowToProduct);
  }

  const merged = new Map<string, Product>();
  for (const product of [...(byName ?? []).map(mapRowToProduct), ...bySku]) {
    merged.set(product.id, product);
  }
  return Array.from(merged.values());
}
