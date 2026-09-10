import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Carrito de compras — Ferretería 57",
  description: "Revisa los productos en tu carrito antes de continuar a pago.",
};

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx. CartView es "use client" (necesita useCart), por eso
// vive aparte: este page.tsx se queda como Server Component y conserva su
// metadata estática, igual que /cuenta con NotifyForm.
export default function CarritoPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 className="mb-6 font-display text-2xl uppercase text-brand-slate sm:mb-8 sm:text-3xl">
        Carrito de compras
      </h1>
      <CartView />
    </main>
  );
}
