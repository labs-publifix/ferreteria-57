import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmationView } from "@/components/checkout/ConfirmationView";

export const metadata: Metadata = {
  title: "Pedido confirmado — Ferretería 57",
  description: "Confirmación de tu pedido en Ferretería 57.",
};

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx. El resumen del pedido viaja por sessionStorage (ver
// lib/checkout/lastOrder.ts), guardado justo antes de salir hacia
// Mercado Pago en CheckoutView — el estatus real del pago llega en el
// query string cuando Mercado Pago redirige de vuelta aquí (ver
// createCheckoutPreference.ts), por eso ConfirmationView necesita
// useSearchParams() y por eso va envuelta en Suspense (requisito de
// Next.js para ese hook).
export default function ConfirmacionPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Suspense fallback={null}>
        <ConfirmationView />
      </Suspense>
    </main>
  );
}
