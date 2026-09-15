"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ProductThumbnail } from "@/components/product/ProductThumbnail";
import { formatPrice } from "@/lib/formatPrice";
import { useCart } from "./CartProvider";
import type { Product, ProductVariant } from "@/types/catalog";

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
    <div className="flex flex-col gap-3 border-b border-brand-slate/10 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:gap-8">
      {/* sm:max-w-sm acota este bloque (imagen + nombre/variante/precio) en
          vez de dejarlo crecer flex-1 hasta ocupar todo el ancho de la
          columna del carrito: en escritorio esa columna es mucho más ancha
          que su contenido (pocos renglones de texto), y sin este límite el
          stepper de cantidad y el total terminaban empujados al extremo
          derecho, separados del resto por un vacío enorme en medio. */}
      <div className="flex gap-4 sm:max-w-sm">
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

            {/* En escritorio el botón de eliminar se repite más abajo,
                junto al stepper y el total (ver sm:hidden/sm:flex) — ahí
                queda agrupado con el resto de las acciones de la línea en
                vez de flotar solo junto al nombre. */}
            <button
              type="button"
              onClick={() => removeItem(product.id, variant.id)}
              aria-label={`Eliminar ${product.name} del carrito`}
              className="flex size-11 shrink-0 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:hidden"
            >
              <Trash2 className="size-4" aria-hidden="true" strokeWidth={1.75} />
            </button>
          </div>

          <p className="font-sans text-sm text-brand-slate">
            {formatPrice(variant.price)} c/u
          </p>
        </div>
      </div>

      {/* Grupo de acciones (cantidad, total, eliminar) pegado junto al
          bloque de producto en escritorio (gap-8 del contenedor padre) en
          vez de separado por justify-between a lo ancho de toda la fila. */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start sm:gap-8">
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
          {formatPrice(lineTotal)}
        </p>

        <button
          type="button"
          onClick={() => removeItem(product.id, variant.id)}
          aria-label={`Eliminar ${product.name} del carrito`}
          className="hidden size-11 shrink-0 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:flex"
        >
          <Trash2 className="size-4" aria-hidden="true" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
