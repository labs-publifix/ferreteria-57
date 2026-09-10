import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout — Ferretería 57",
  description: "Checkout — próximamente.",
};

// Placeholder mínimo: el checkout real con Mercado Pago es una fase
// posterior. Header y Footer no se repiten aquí, ya envuelven la página
// desde app/layout.tsx.
export default function CheckoutPage() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center sm:py-24">
      <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
        Checkout — próximamente
      </h1>
      <p className="max-w-prose font-sans text-sm text-brand-black sm:text-base">
        El pago real con Mercado Pago llega en una fase posterior.
      </p>
    </main>
  );
}
