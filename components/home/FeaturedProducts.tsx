import { ProductCard } from "@/components/product/ProductCard";
import { getFeaturedProducts } from "@/lib/catalog/queries";

// Mismo patrón de fila horizontal con scroll-snap en móvil / grid fijo
// desde sm: usado en /app/dev/ui, para que el comportamiento sea idéntico
// en ambos lugares. Server Component async: getFeaturedProducts ya
// consulta Supabase (productos activos, más recientes primero).
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

  return (
    <div className="scrollbar-hide -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {products.map((product) => (
        // ProductCard ya no trae su propio ancho: el w-64/scroll-snap es
        // específico de esta fila horizontal en móvil (ver ProductCard.tsx),
        // así que vive en este wrapper. flex (con su align-items:stretch
        // por defecto) para que ProductCard, adentro, siga llenando el
        // alto completo del wrapper cuando éste se estira a igualar la
        // tarjeta más alta de la fila.
        <div
          key={product.id}
          className="flex w-64 shrink-0 snap-start sm:w-auto sm:shrink"
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
