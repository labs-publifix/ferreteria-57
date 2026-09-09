import Link from "next/link";
import { Gift } from "lucide-react";
import { buttonClassName } from "@/components/ui";

// Fondo pizarra (bloque institucional) en vez de naranja extenso: le da peso
// visual propio al cierre de la página sin romper la regla de marca de no
// usar el naranja como fondo grande. El ícono usa naranja de fondo con
// negro-suave encima (5.93:1, ya validado) en vez de naranja sobre pizarra:
// ese combo daba ~2.1-2.8:1, por debajo del mínimo de 3:1 para íconos.
export function LoyaltySection() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-brand-slate px-6 py-10 text-center sm:px-12 sm:py-14">
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-orange text-brand-black">
        <Gift className="size-6" aria-hidden="true" strokeWidth={1.75} />
      </span>
      <h2 className="font-display text-xl uppercase text-white sm:text-2xl">
        Programa de Lealtad
      </h2>
      <p className="max-w-prose font-sans text-sm text-white/85 sm:text-base">
        Al registrarte como cliente de Ferretería 57, ya formas parte del
        Programa de Lealtad. Sin trámites ni pasos extra: solo por comprar
        con nosotros empiezas a acumular beneficios reales.
      </p>
      <Link href="/cuenta" className={buttonClassName("primary", "mt-2")}>
        Conoce el Programa de Lealtad
      </Link>
    </div>
  );
}
