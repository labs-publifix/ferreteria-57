import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Ferretería 57",
  description:
    "Términos y condiciones de Ferretería 57. Contenido pendiente de definir con el cliente.",
};

// Placeholder mínimo: contenido legal real pendiente de que el cliente lo
// proporcione (o lo redacte su asesoría legal). Header y Footer no se
// repiten aquí, ya envuelven la página desde app/layout.tsx.
export default function TerminosPage() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center sm:py-24">
      <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
        Términos y Condiciones
      </h1>
      <p className="max-w-prose font-sans text-sm text-brand-black sm:text-base">
        Contenido pendiente de definir con el cliente.
      </p>
    </main>
  );
}
