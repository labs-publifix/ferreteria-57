import Image from "next/image";
import Link from "next/link";
import { Badge, Button, PriceTag, RatingStars } from "@/components/ui";
import type { Product, ProductVariant } from "@/types/catalog";

export interface ProductCardProps {
  product: Product;
  className?: string;
}

// Sin fotografía real todavía: mismo marcador de posición usado en
// /app/dev/ui mientras Product.images siga vacío.
function ProductImage({ product }: { product: Product }) {
  const firstImage = product.images[0];
  if (!firstImage) {
    return (
      <div
        className="flex aspect-square w-full items-center justify-center rounded-lg bg-brand-gray text-sm text-brand-slate/60"
        aria-hidden="true"
      >
        IMG
      </div>
    );
  }
  return (
    <Image
      src={firstImage}
      alt={product.name}
      width={400}
      height={400}
      className="aspect-square w-full rounded-lg object-cover"
    />
  );
}

export function ProductCard({ product, className = "" }: ProductCardProps) {
  // El precio vive en la variante, no directo en el producto (un producto
  // puede tener más de una presentación). Por ahora se muestra la primera;
  // un selector de variantes es trabajo de una fase posterior.
  const variant: ProductVariant | undefined = product.variants[0];
  const price = variant?.price ?? 0;
  const previousPrice = variant?.compareAtPrice;

  const hasDiscount =
    typeof previousPrice === "number" && previousPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((previousPrice - price) / previousPrice) * 100)
    : null;

  return (
    // h-full explícito: el padre inmediato siempre es un elemento ya
    // estirado por flex/grid (el wrapper de FeaturedProducts, o la celda
    // de ProductGrid), así que su alto ya es un valor concreto — no el
    // alto "auto" indefinido del bug original (ver historial de este
    // archivo) donde el padre no tenía alto propio y height:100% no se
    // podía resolver. Antes dejábamos que el stretch por defecto de dos
    // niveles anidados (grid → wrapper flex → esta tarjeta) hiciera el
    // trabajo de forma implícita; Chrome lo resuelve bien, pero Safari
    // tiene bugs conocidos de larga fecha con el stretch de flex anidado
    // dentro de flex/grid que no siempre propaga correctamente. Declarar
    // h-full aquí hace explícito lo que antes dependía de esa propagación
    // implícita, y es seguro precisamente porque el padre ya no es
    // indefinido.
    //
    // Sin ancho fijo: el ancho es responsabilidad de quien la coloca
    // (FeaturedProducts la envuelve en w-64 para su scroll horizontal en
    // móvil; ProductGrid la deja ocupar la celda completa de su grid) —
    // ProductCard en sí no debe asumir un layout de contenedor en
    // particular para poder reusarse en ambos.
    <div
      className={`flex h-full flex-col gap-2 rounded-lg bg-white p-4 shadow-sm ${className}`}
    >
      {/* Toda la parte informativa navega a la ficha de producto; el botón
          de abajo queda fuera del Link a propósito (un <button> anidado
          dentro de un <a> es HTML inválido y confunde el foco de teclado). */}
      <Link href={`/producto/${product.slug}`} className="flex flex-col gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate">
        <div className="relative">
          <ProductImage product={product} />
          {hasDiscount && (
            <Badge className="absolute right-2 top-2">
              Ahorra {discountPercent}%
            </Badge>
          )}
        </div>

        <p className="font-sans text-xs uppercase tracking-wide text-brand-slate/70">
          {product.brand}
        </p>
        <p
          className="line-clamp-2 font-sans text-sm text-brand-black sm:text-base"
          title={product.name}
        >
          {product.name}
        </p>

        {/* rating es opcional en el contrato: un producto sin reseñas
            todavía no debe mostrarse como si tuviera 0 estrellas. */}
        {typeof product.rating === "number" && (
          <RatingStars value={product.rating} />
        )}

        {/* hideBadge: el descuento ya se muestra arriba, sobre la imagen; no
            repetir el mismo pill aquí abajo. El tachado del precio anterior
            sí se conserva porque es un dato distinto (cuánto costaba antes). */}
        <PriceTag price={price} previousPrice={previousPrice} hideBadge />
      </Link>

      <Button variant="primary" className="mt-auto w-full">
        Agregar al carrito
      </Button>
    </div>
  );
}
