import Image from "next/image";
import { ProductImagePlaceholder } from "@/components/ui";
import type { Product } from "@/types/catalog";

// Miniatura de producto reusada en ProductCard y en las líneas del
// carrito: mismo criterio de siempre (placeholder "IMG" mientras
// Product.images siga vacío), el tamaño lo decide quien la coloca vía
// className (aspect-square w-full en una tarjeta, size-20 en el carrito).
export function ProductThumbnail({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const firstImage = product.images[0];
  if (!firstImage) {
    return <ProductImagePlaceholder className={className} />;
  }
  return (
    <Image
      src={firstImage}
      alt={product.name}
      width={400}
      height={400}
      className={`rounded-lg object-cover ${className}`}
    />
  );
}
