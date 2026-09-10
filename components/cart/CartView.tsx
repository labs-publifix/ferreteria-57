"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buttonClassName } from "@/components/ui";
import { useResolvedCart } from "./useResolvedCart";
import { CartLineItem } from "./CartLineItem";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export function CartView() {
  const { items, subtotal, isHydrated } = useResolvedCart();
  const searchParams = useSearchParams();
  // Checkout redirige aquí con ?empty=checkout cuando se llega ahí sin
  // nada que pagar — mensaje distinto para que quede claro por qué se
  // interrumpió, en vez del genérico "está vacío" sin contexto.
  const cameFromCheckout = searchParams.get("empty") === "checkout";

  // Antes de saber si localStorage tenía algo, no mostrar el estado
  // vacío (sería un parpadeo incorrecto para quien sí tiene productos).
  if (!isHydrated) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-brand-gray px-6 py-16 text-center">
        <p className="font-sans text-base text-brand-black">
          {cameFromCheckout
            ? "Necesitas productos en tu carrito para continuar a pago."
            : "Tu carrito está vacío."}
        </p>
        <Link href="/" className={buttonClassName("primary")}>
          Ir al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:gap-10">
      <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
        {items.map(({ product, variant, quantity }) => (
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
