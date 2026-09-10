"use client";

import Link from "next/link";
import { buttonClassName } from "@/components/ui";
import { getProductById } from "@/lib/mock-data/products";
import { useCart } from "./CartProvider";
import { CartLineItem } from "./CartLineItem";
import type { Product, ProductVariant } from "@/types/catalog";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

interface ResolvedLine {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export function CartView() {
  const { lines } = useCart();

  // Cada línea del carrito solo guarda productId/variantId/cantidad — el
  // producto/variante real se resuelve aquí, al momento de mostrarse,
  // nunca se duplica en el carrito (ver CartProvider). Una línea que ya
  // no resuelve (mock-data cambió entre sesiones) se descarta en vez de
  // romper la página.
  const resolvedLines: ResolvedLine[] = lines.reduce<ResolvedLine[]>((acc, line) => {
    const product = getProductById(line.productId);
    const variant = product?.variants.find((item) => item.id === line.variantId);
    if (product && variant) {
      acc.push({ product, variant, quantity: line.quantity });
    }
    return acc;
  }, []);

  if (resolvedLines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-brand-gray px-6 py-16 text-center">
        <p className="font-sans text-base text-brand-black">
          Tu carrito está vacío.
        </p>
        <Link href="/" className={buttonClassName("primary")}>
          Ir al inicio
        </Link>
      </div>
    );
  }

  const subtotal = resolvedLines.reduce(
    (sum, { variant, quantity }) => sum + variant.price * quantity,
    0
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:gap-10">
      <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
        {resolvedLines.map(({ product, variant, quantity }) => (
          <CartLineItem
            key={`${product.id}-${variant.id}`}
            product={product}
            variant={variant}
            quantity={quantity}
          />
        ))}
      </div>

      <div className="flex h-fit flex-col gap-4 rounded-lg bg-brand-gray p-4 sm:p-6">
        <h2 className="font-display text-lg uppercase text-brand-slate">
          Resumen
        </h2>
        <div className="flex items-center justify-between font-sans text-sm text-brand-black">
          <span>Subtotal</span>
          <span className="text-xl font-bold">
            {currencyFormatter.format(subtotal)}
          </span>
        </div>
        <p className="font-sans text-xs text-brand-slate/70">
          Envío y descuentos se calculan en el siguiente paso.
        </p>
        <Link href="/checkout" className={buttonClassName("primary", "w-full")}>
          Continuar a pago
        </Link>
      </div>
    </div>
  );
}
