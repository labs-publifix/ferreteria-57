"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ProductThumbnail } from "@/components/product/ProductThumbnail";
import { useCart } from "./CartProvider";
import type { Product, ProductVariant } from "@/types/catalog";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export function CartLineItem({
  product,
  variant,
  quantity,
}: {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}) {
  const { setQuantity, removeItem } = useCart();
  const lineTotal = variant.price * quantity;

  return (
    <div className="flex gap-4 border-b border-brand-slate/10 py-4 first:pt-0 last:border-b-0 last:pb-0">
      <Link href={`/producto/${product.slug}`} className="shrink-0">
        <ProductThumbnail product={product} className="size-20 sm:size-24" />
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/producto/${product.slug}`}
              className="font-sans text-sm text-brand-black hover:underline sm:text-base"
            >
              {product.name}
            </Link>
            {/* La etiqueta de variante solo aporta información cuando el
                producto tiene más de una presentación — para los de una
                sola variante ("Único") no hay nada que distinguir. */}
            {product.variants.length > 1 && (
              <p className="font-sans text-xs text-brand-slate/70">{variant.label}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => removeItem(product.id, variant.id)}
            aria-label={`Eliminar ${product.name} del carrito`}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          >
            <Trash2 className="size-4" aria-hidden="true" strokeWidth={1.75} />
          </button>
        </div>

        <p className="font-sans text-sm text-brand-slate">
          {currencyFormatter.format(variant.price)} c/u
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center rounded-md border border-brand-slate/30">
            <button
              type="button"
              onClick={() => setQuantity(product.id, variant.id, quantity - 1)}
              disabled={quantity <= 1}
              aria-label="Disminuir cantidad"
              className="flex size-11 items-center justify-center text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate disabled:pointer-events-none disabled:opacity-40"
            >
              <Minus className="size-3.5" aria-hidden="true" strokeWidth={1.75} />
            </button>
            <span
              className="flex min-w-11 items-center justify-center font-sans text-sm font-semibold text-brand-black"
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(product.id, variant.id, quantity + 1)}
              disabled={quantity >= variant.stock}
              aria-label="Aumentar cantidad"
              className="flex size-11 items-center justify-center text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus className="size-3.5" aria-hidden="true" strokeWidth={1.75} />
            </button>
          </div>

          <p className="font-sans text-base font-bold text-brand-black">
            {currencyFormatter.format(lineTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}
