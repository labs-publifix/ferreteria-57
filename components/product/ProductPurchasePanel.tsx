"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button, PriceTag, RatingStars } from "@/components/ui";
import type { Product } from "@/types/catalog";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id
  );
  const [quantity, setQuantity] = useState(1);

  const variant =
    product.variants.find((item) => item.id === selectedVariantId) ??
    product.variants[0];
  const inStock = (variant?.stock ?? 0) > 0;
  const hasMultipleVariants = product.variants.length > 1;

  function handleQuantityChange(delta: number) {
    setQuantity((qty) => Math.max(1, qty + delta));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-sans text-sm uppercase tracking-wide text-brand-slate/70">
          {product.brand}
        </p>
        {/* Sin line-clamp: a diferencia de ProductCard (tarjeta compacta),
            esta es la página dedicada del producto — el nombre completo
            siempre se muestra, aunque ocupe varias líneas. */}
        <h1 className="mt-1 font-display text-xl uppercase text-brand-black sm:text-2xl">
          {product.name}
        </h1>
      </div>

      {typeof product.rating === "number" && (
        <div className="flex items-center gap-2">
          <RatingStars value={product.rating} />
          {typeof product.reviewCount === "number" && (
            <span className="font-sans text-sm text-brand-slate">
              ({product.reviewCount}{" "}
              {product.reviewCount === 1 ? "reseña" : "reseñas"})
            </span>
          )}
        </div>
      )}

      <PriceTag price={variant?.price ?? 0} previousPrice={variant?.compareAtPrice} />

      {hasMultipleVariants && (
        <div>
          <p className="mb-2 font-sans text-sm font-semibold text-brand-black">
            Presentación
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Presentación">
            {product.variants.map((item) => {
              const isSelected = item.id === selectedVariantId;
              const variantInStock = item.stock > 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedVariantId(item.id)}
                  className={`flex min-h-11 items-center rounded-md border-2 px-4 font-sans text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-brand-orange bg-brand-orange/10 text-brand-black"
                      : "border-brand-slate/30 text-brand-black hover:border-brand-slate"
                  } ${!variantInStock ? "opacity-50" : ""}`}
                >
                  {item.label}
                  {!variantInStock && " (agotado)"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="flex items-center gap-2 font-sans text-sm font-semibold">
        <span
          className={`size-2 rounded-full ${inStock ? "bg-green-700" : "bg-red-600"}`}
          aria-hidden="true"
        />
        <span className={inStock ? "text-green-700" : "text-red-600"}>
          {inStock ? "En stock" : "Agotado"}
        </span>
      </p>

      <div className="flex items-center gap-3">
        <span className="font-sans text-sm text-brand-black">Cantidad:</span>
        <div className="flex items-center rounded-md border border-brand-slate/30">
          <button
            type="button"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            aria-label="Disminuir cantidad"
            className="flex size-11 items-center justify-center text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate disabled:pointer-events-none disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden="true" strokeWidth={1.75} />
          </button>
          <span
            className="flex min-w-11 items-center justify-center font-sans text-sm font-semibold text-brand-black"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => handleQuantityChange(1)}
            aria-label="Aumentar cantidad"
            className="flex size-11 items-center justify-center text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          >
            <Plus className="size-4" aria-hidden="true" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Sin lógica de carrito real todavía (fase posterior): mismo estilo
          y comportamiento visual que el botón de ProductCard. */}
      <Button variant="primary" className="w-full sm:w-auto" disabled={!inStock}>
        Agregar al carrito
      </Button>
    </div>
  );
}
