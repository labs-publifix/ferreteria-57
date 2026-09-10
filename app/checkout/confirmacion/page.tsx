import type { Metadata } from "next";
import { ConfirmationView } from "@/components/checkout/ConfirmationView";

export const metadata: Metadata = {
  title: "Pedido confirmado — Ferretería 57",
  description: "Confirmación simulada de tu pedido en Ferretería 57.",
};

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx. El resumen del pedido viaja por sessionStorage (ver
// lib/checkout/lastOrder.ts), guardado justo antes de vaciar el carrito
// en CheckoutView — no hay backend todavía que lo sirva por su propio id.
export default function ConfirmacionPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ConfirmationView />
    </main>
  );
}
