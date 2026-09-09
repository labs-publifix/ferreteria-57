import Image from "next/image";
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
    <div
      className={`flex w-64 shrink-0 snap-start flex-col gap-2 rounded-lg bg-white p-4 shadow-sm sm:w-auto sm:shrink ${className}`}
    >
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

      <PriceTag price={price} previousPrice={previousPrice} />

      <Button variant="primary" className="mt-1 w-full">
        Agregar al carrito
      </Button>
    </div>
  );
}
