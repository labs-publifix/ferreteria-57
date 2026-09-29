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

// Home (FeaturedProducts): #11 — primero los que el admin marcó como
// destacados (featured=true), más reciente el marcado primero. Si nadie
// ha destacado nada todavía (catálogo recién migrado, o el admin los
// desmarcó todos), conserva el comportamiento de antes — los más
// recientes activos — para que el Home nunca se quede vacío por falta de
// selección manual.
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .eq("featured", true)
    .order("featured_at", { ascending: false })
    .limit(limit);
  logCatalogError("getFeaturedProducts", error);

  if (data && data.length > 0) {
    return data.map(mapRowToProduct);
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  logCatalogError("getFeaturedProducts (fallback)", fallbackError);

  return (fallbackData ?? []).map(mapRowToProduct);
}

// Busca por nombre de producto, por Clave (a nivel producto) o por SKU de
// alguna de sus variantes, marca o categoría — antes esto eran 3 consultas
// ilike separadas (una por columna) combinadas a mano; ahora search_products()
// (RPC de Postgres, ver supabase/migrations/20261003010000_product_search.sql)
// ya resuelve nombre/marca/clave/sku/categoría con normalización de
// acentos/mayúsculas y códigos sin separadores en una sola llamada, con el
// mismo ranking que usa el desplegable en vivo del Header — así /buscar
// nunca puede mostrar un orden distinto al que ya vio el cliente ahí.
// El RPC regresa la fila "compacta" de resultado (un producto, su mejor
// variante); esta función la usa solo para obtener el ORDEN de relevancia
// y después trae el Product completo (todas sus variantes, imágenes,
// specs, reseñas) por id — CategoryProductBrowser/ProductCard necesitan esa
// forma completa, no la compacta.
export async function searchProducts(query: string): Promise<Product[]> {
  const normalized = query.trim();
  if (!normalized) return [];

  const supabase = await createClient();
  const { data: ranked, error: rankedError } = await supabase.rpc("search_products", {
    p_query: normalized,
    p_limit: 50,
  });
  logCatalogError("searchProducts (search_products)", rankedError);
  const rankedRows = (ranked ?? []) as { id: string }[];
  if (rankedRows.length === 0) return [];

  const orderedIds = rankedRows.map((row) => row.id);
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .in("id", orderedIds);
  logCatalogError("searchProducts (hydrate)", error);

  const byId = new Map<string, Product>((data ?? []).map((row) => [row.id, mapRowToProduct(row)]));
  // .in() no conserva el orden que mandamos — se reordena aquí contra
  // orderedIds para que el ranking de search_products() sea el que de
  // verdad se muestra.
  const results: Product[] = [];
  for (const id of orderedIds) {
    const product = byId.get(id);
    if (product) results.push(product);
  }
  return results;
}
