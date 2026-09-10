import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout — Ferretería 57",
  description: "Completa tu pedido: contacto, entrega y método de pago.",
};

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx. Checkout de una sola página (no wizard): las 3
// secciones del formulario y el resumen conviven en la misma pantalla,
// todas dentro de un único <form> (ver CheckoutView) para que la
// validación nativa del navegador cubra el flujo completo al enviar.
// Todavía simulado — sin Mercado Pago real (fase posterior).
export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 className="mb-6 font-display text-2xl uppercase text-brand-slate sm:mb-8 sm:text-3xl">
        Checkout
      </h1>
      <CheckoutView />
    </main>
  );
}
