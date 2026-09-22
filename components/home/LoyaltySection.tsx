import Link from "next/link";
import { Gift } from "lucide-react";
import { buttonClassName } from "@/components/ui";

// Tarjeta de membresía en vez del bloque plano anterior: "Club 57" es el
// nombre propio del programa y debe poder reconocerse y recomendarse por
// sí solo, así que es el elemento protagonista (Russo One, grande),
// "Programa de Lealtad" queda como descriptor secundario arriba del
// nombre. Fondo negro-suave (no pizarra) para que la tarjeta se lea como
// un objeto propio dentro de la página, no como otro bloque institucional
// más — la inclinación ligera (-rotate-2) y la sombra con offset+blur real
// (no halo plano) son lo que le dan la sensación de tarjeta física.
// El naranja se usa con moderación: solo borde del badge + ícono + botón
// de CTA, nunca como fondo — mismo criterio de contraste que ya validó
// esta sección antes (naranja sobre pizarra cae por debajo de 3:1, blanco
// sobre negro-suave no tiene ese problema).
export function LoyaltySection() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative w-full max-w-[300px] -rotate-2 overflow-hidden rounded-2xl bg-brand-black px-7 py-9 shadow-[0_25px_50px_-15px_rgba(26,26,26,0.65)] sm:max-w-sm sm:px-10 sm:py-12">
        {/* Brillo sutil arriba — refuerza la lectura de "superficie de
            tarjeta" sin depender de una imagen ni de más color. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />

        <span className="relative inline-flex items-center gap-1.5 rounded-full border border-brand-orange px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-widest text-white">
          <Gift className="size-3.5 text-brand-orange" aria-hidden="true" strokeWidth={2} />
          Programa de Lealtad
        </span>

        <h2 className="relative mt-4 font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
          Club 57
        </h2>

        <p className="relative mt-3 font-sans text-sm text-white/80 sm:text-base">
          Gana puntos en cada compra
        </p>
      </div>

      <div>
        <Link href="/cuenta" className={buttonClassName("primary")}>
          Conoce Club 57
        </Link>
        <p className="mt-3 max-w-prose font-sans text-xs text-brand-slate/70 sm:text-sm">
          Ya formas parte solo con tu cuenta — sin trámites ni pasos extra.
        </p>
      </div>
    </div>
  );
}
