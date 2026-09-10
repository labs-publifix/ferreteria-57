import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de Privacidad — Ferretería 57",
  description:
    "Aviso de privacidad de Ferretería 57. Contenido pendiente de definir con el cliente.",
};

// Placeholder mínimo: contenido legal real pendiente de que el cliente lo
// proporcione (o lo redacte su asesoría legal). Header y Footer no se
// repiten aquí, ya envuelven la página desde app/layout.tsx.
export default function AvisoPrivacidadPage() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center sm:py-24">
      <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
        Aviso de Privacidad
      </h1>
      <p className="max-w-prose font-sans text-sm text-brand-black sm:text-base">
        Contenido pendiente de definir con el cliente.
      </p>
    </main>
  );
}
