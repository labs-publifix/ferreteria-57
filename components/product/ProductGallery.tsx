"use client";

import { useState } from "react";
import Image from "next/image";

// Mismo placeholder "IMG" que ProductCard cuando no hay fotografía real
// todavía (Product.images vacío es válido y esperado, ver types/catalog.ts).
function ImagePlaceholder() {
  return (
    <div
      className="flex aspect-square w-full items-center justify-center rounded-lg bg-brand-gray text-sm text-brand-slate/60"
      aria-hidden="true"
    >
      IMG
    </div>
  );
}

export function ProductGallery({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex];

  return (
    <div className="flex flex-col gap-3">
      {selectedImage ? (
        <Image
          src={selectedImage}
          alt={productName}
          width={800}
          height={800}
          priority
          className="aspect-square w-full rounded-lg object-cover"
        />
      ) : (
        <ImagePlaceholder />
      )}

      {/* Con una sola imagen (o ninguna) no tiene sentido "elegir" entre
          miniaturas — la fila solo aparece con 2 o más. */}
      {images.length > 1 && (
        <div
          role="group"
          aria-label="Miniaturas del producto"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
              aria-current={index === selectedIndex}
              className={`size-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors sm:size-20 ${
                index === selectedIndex
                  ? "border-brand-orange"
                  : "border-transparent hover:border-brand-slate/30"
              }`}
            >
              <Image src={image} alt="" width={160} height={160} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
