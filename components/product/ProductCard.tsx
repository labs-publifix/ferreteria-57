import Image from "next/image";
import { Badge, Button, PriceTag, RatingStars } from "@/components/ui";
import type { Product } from "@/types/catalog";

export interface ProductCardProps {
  product: Product;
  className?: string;
}

// Sin fotografía real todavía: mismo marcador de posición usado en
// /app/dev/ui mientras no exista Product.imageUrl.
function ProductImage({ product }: { product: Product }) {
  if (!product.imageUrl) {
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
      src={product.imageUrl}
      alt={product.imageAlt ?? product.name}
      width={400}
      height={400}
      className="aspect-square w-full rounded-lg object-cover"
    />
  );
}

export function ProductCard({ product, className = "" }: ProductCardProps) {
  const hasDiscount =
    typeof product.previousPrice === "number" &&
    product.previousPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.previousPrice! - product.price) / product.previousPrice!) *
          100
      )
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

      <RatingStars value={product.rating} />
      <PriceTag price={product.price} previousPrice={product.previousPrice} />

      <Button variant="primary" className="mt-1 w-full">
        Agregar al carrito
      </Button>
    </div>
  );
}
