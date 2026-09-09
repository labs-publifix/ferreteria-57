import { mockProducts } from "@/lib/mock-data/products";
import { categories } from "@/lib/navigation/categories";
import type { Product } from "@/types/catalog";

// Capa de acceso a datos del catálogo. Hoy lee mockProducts en memoria, pero
// /app/categoria/[slug] y /app/buscar solo conocen esta forma async — cuando
// conectemos Supabase, el cuerpo de estas dos funciones cambia por una
// consulta real, pero esas páginas (y su lógica de filtrado/orden en
// CategoryProductBrowser) no cambian: siguen llamando
// `await getCategoryProducts(slug)` / `await searchProducts(q)` igual que
// hoy.
export async function getCategoryProducts(categorySlug: string): Promise<Product[]> {
  return mockProducts.filter((product) => product.categoryId === categorySlug);
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
