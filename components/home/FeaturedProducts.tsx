import { ProductRail } from "@/components/product/ProductRail";
import { getFeaturedProducts } from "@/lib/catalog/queries";

// Fila horizontal con scroll-snap en móvil / grid fijo desde sm
// (ProductRail, compartida con los relacionados de la ficha de producto).
// Server Component async: getFeaturedProducts ya consulta Supabase
// (productos activos, más recientes primero).
export async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (products.length === 0) {
    return (
      <div className="rounded-lg bg-brand-gray px-6 py-16 text-center">
        <p className="font-sans text-base text-brand-black">
          Todavía no hay productos activos — agrégalos desde el panel de
          administración.
        </p>
      </div>
    );
  }

  return <ProductRail products={products} />;
}
