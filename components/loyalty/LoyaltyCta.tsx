"use client";

import Link from "next/link";
import { Gift } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

// Banner compacto y no bloqueante (nunca modal) para invitar al Programa
// de Lealtad desde /carrito y el primer paso de /checkout, sin interrumpir
// el flujo de compra — solo se muestra a quien no tiene sesión, ya que
// quien ya inició sesión ya forma parte del programa (ver LoyaltySection).
export function LoyaltyCta({ className = "" }: { className?: string }) {
  const { user, isLoading } = useAuth();
  if (isLoading || user) return null;

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border border-brand-orange/30 bg-brand-orange/10 px-4 py-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-orange text-brand-black">
          <Gift className="size-4" aria-hidden="true" strokeWidth={1.75} />
        </span>
        <p className="flex-1 font-sans text-xs text-brand-black sm:text-sm">
          Regístrate y forma parte del <strong>Programa de Lealtad</strong> — beneficios por cada
          compra.
        </p>
      </div>
      <Link
        href="/cuenta"
        className="self-end font-sans text-xs font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black sm:text-sm"
      >
        Conocer más
      </Link>
    </div>
  );
}
