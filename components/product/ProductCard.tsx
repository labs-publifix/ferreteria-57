"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { Badge, Button, PriceTag, RatingStars } from "@/components/ui";
import { ProductThumbnail } from "./ProductThumbnail";
import type { Product, ProductVariant } from "@/types/catalog";

export interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className = "" }: ProductCardProps) {
  const { addItem } = useCart();

  // El precio vive en la variante, no directo en el producto (un producto
  // puede tener más de una presentación). Por ahora se muestra la primera;
  // un selector de variantes es trabajo de una fase posterior.
  const variant: ProductVariant | undefined = product.variants[0];
  const price = variant?.price ?? 0;
  const previousPrice = variant?.compareAtPrice;
  const inStock = (variant?.stock ?? 0) > 0;

  const hasDiscount =
    typeof previousPrice === "number" && previousPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((previousPrice - price) / previousPrice) * 100)
    : null;

  return (
    // Sin h-full: con height:100% el navegador no puede resolver un alto
    // fijo (el contenedor padre no tiene alto propio), así que el valor se
    // vuelve indefinido y esta tarjeta deja de participar en el
    // align-items:stretch por defecto de flex/grid — eso era lo que hacía
    // que cada tarjeta tomara la altura de su propio contenido en móvil.
    // Quitarlo deja que stretch iguale la altura de todas las tarjetas de
    // la fila (flex row o grid row, según el contenedor).
    //
    // w-full SÍ es necesario (a diferencia del alto): el wrapper de
    // FeaturedProducts es un `flex` (fila) con esta tarjeta como único
    // hijo — el stretch por defecto de flex solo aplica al eje cruzado
    // (alto), nunca al eje principal (ancho, en una fila); sin w-full la
    // tarjeta solo ocupa el ancho de SU PROPIO contenido, que coincide con
    // el ancho del wrapper por pura coincidencia cuando el nombre del
    // producto es largo (fuerza 2 líneas) y se ve angosta cuando el
    // nombre es corto (p. ej. "Martillo Truper 16 oz") — ese fue el bug
    // real que el cliente reportó, nada que ver con Safari ni con el
    // <Link>: nunca antes se había medido el ANCHO de las tarjetas en las
    // verificaciones, solo el alto. En ProductGrid (donde esta tarjeta es
    // hija directa de un grid) w-full no cambia nada porque el grid ya
    // estira el ancho por defecto (justify-items:stretch) — así que es
    // seguro en los dos contenedores donde se usa.
    //
    // "relative" porque el Link de abajo se posiciona contra este div.
    <div
      className={`relative flex w-full flex-col gap-2 rounded-lg bg-white p-4 shadow-sm ${className}`}
    >
      {/* Link "estirado" (patrón stretched-link): un overlay invisible que
          cubre toda la tarjeta para que sea clickeable como unidad, SIN
          envolver el contenido visual — ese contenido se queda exactamente
          plano, como hijos directos de este div, igual que antes de tener
          navegación. Envolverlo en un <Link> agregaba un nivel extra de
          flex anidado (grid → wrapper → esta tarjeta → Link) que dejó de
          verse simétrico en al menos un navegador de un cliente real (no
          reproducible en Chromium); este patrón no le suma ningún nivel de
          layout al contenido, solo una capa aparte.
          El botón de abajo queda con z-10 para seguir siendo clickeable
          por encima del Link (que no tiene z-index, así que pinta debajo);
          así el botón resuelve su propio clic y el resto de la tarjeta
          navega — sin anidar un <button> dentro de un <a> (HTML inválido). */}
      <Link
        href={`/producto/${product.slug}`}
        aria-label={product.name}
        className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
      />

      {/* pointer-events-none: este wrapper es "position: relative" para
          anclar el Badge, así que sin esto pintaría por encima del Link
          estirado de arriba (mismo nivel de stacking, más tarde en el DOM)
          y se robaría el clic sobre la foto — nada aquí adentro es
          interactivo, así que dejar pasar el clic al Link es seguro. */}
      <div className="relative pointer-events-none">
        <ProductThumbnail product={product} className="aspect-square w-full" />
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

      <Button
        type="button"
        variant="primary"
        className="relative z-10 mt-auto w-full"
        disabled={!variant || !inStock}
        onClick={() => variant && addItem(product.id, variant.id, 1)}
      >
        {inStock ? "Agregar al carrito" : "Agotado"}
      </Button>
    </div>
  );
}
