import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/catalog";

// Fila de productos: en móvil se desliza de lado con scroll-snap (no alarga
// la página hacia abajo) y desde sm es un grid fijo. La comparten los
// destacados del Home y los productos relacionados de la ficha, para que
// se comporten igual en los dos lugares.
export function ProductRail({ products }: { products: Product[] }) {
  return (
    <div className="scrollbar-hide -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {products.map((product) => (
        // ProductCard ya no trae su propio ancho: el w-64/scroll-snap es
        // específico de esta fila horizontal en móvil (ver ProductCard.tsx),
        // así que vive en este wrapper. flex (con su align-items:stretch
        // por defecto) para que ProductCard, adentro, siga llenando el
        // alto completo del wrapper cuando éste se estira a igualar la
        // tarjeta más alta de la fila.
        <div key={product.id} className="flex w-64 shrink-0 snap-start sm:w-auto sm:shrink">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
