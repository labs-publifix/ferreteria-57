import { ProductCard } from "@/components/product/ProductCard";
import { mockProducts } from "@/lib/mock-data/products";

// Mismo patrón de fila horizontal con scroll-snap en móvil / grid fijo
// desde sm: usado en /app/dev/ui, para que el comportamiento sea idéntico
// en ambos lugares.
export function FeaturedProducts() {
  return (
    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {mockProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
