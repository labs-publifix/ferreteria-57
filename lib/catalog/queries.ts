import { mockProducts } from "@/lib/mock-data/products";
import { categories } from "@/lib/navigation/categories";
import type { Product } from "@/types/catalog";

// Capa de acceso a datos del catálogo. Hoy lee mockProducts en memoria, pero
// /app/categoria/[slug], /app/buscar y /app/producto/[slug] solo conocen
// esta forma async — cuando conectemos Supabase, el cuerpo de estas
// funciones cambia por una consulta real, pero esas páginas (y su lógica de
// filtrado/orden en CategoryProductBrowser) no cambian: siguen llamando
// `await getCategoryProducts(slug)` / `await searchProducts(q)` /
// `await getProductBySlug(slug)` igual que hoy.
export async function getCategoryProducts(categorySlug: string): Promise<Product[]> {
  return mockProducts.filter((product) => product.categoryId === categorySlug);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return mockProducts.find((product) => product.slug === slug);
}

// Excluye el producto actual de sus propios relacionados.
export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string
): Promise<Product[]> {
  return mockProducts.filter(
    (product) => product.categoryId === categoryId && product.id !== excludeProductId
  );
}

export async function searchProducts(query: string): Promise<Product[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return mockProducts.filter((product) => {
    const categoryName =
      categories.find((category) => category.slug === product.categoryId)?.label ?? "";
    const haystacks = [
      product.name,
      categoryName,
      ...product.variants.map((variant) => variant.sku),
    ];
    return haystacks.some((value) => value.toLowerCase().includes(normalized));
  });
}
