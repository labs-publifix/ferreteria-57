import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/catalog";

// Grid simple (no scroll horizontal): usado en /categoria/[slug] y /buscar,
// donde el listado completo debe ser navegable sin depender de deslizar.
// A diferencia de FeaturedProducts, ProductCard es aquí el elemento directo
// del grid — su alto se estira por el align-items:stretch por defecto de
// CSS grid sin necesitar un wrapper adicional.
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
