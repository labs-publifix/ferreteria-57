import type { Metadata } from "next";
import Image from "next/image";
import { NotifyForm } from "@/components/loyalty/NotifyForm";

// Versión mínima de la página: sin autenticación todavía (fase posterior).
// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx.
export const metadata: Metadata = {
  title: "Programa de Lealtad — Ferretería 57",
  description:
    "El Programa de Lealtad de Ferretería 57 está en camino. Regístrate como cliente y ya formas parte, sin pasos adicionales.",
};

export default function CuentaPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:py-24">
      <Image
        src="/brand/logo-naranja.png"
        alt="Ferretería 57"
        width={983}
        height={302}
        className="h-10 w-auto sm:h-12"
      />

      <div className="max-w-prose">
        <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
          Programa de Lealtad — muy pronto
        </h1>
        <p className="mt-3 font-sans text-sm text-brand-black sm:text-base">
          Al registrarte como cliente de Ferretería 57, ya formas parte del
          Programa de Lealtad — sin pasos adicionales. Estamos afinando los
          detalles antes de abrirlo.
        </p>
      </div>

      <NotifyForm />
    </main>
  );
}
