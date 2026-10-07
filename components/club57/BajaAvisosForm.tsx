"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { darDeBajaAvisos, reactivarAvisos } from "@/app/(site)/club57/baja/actions";

export function BajaAvisosForm({ m, t, optoutInicial }: { m: string; t: string; optoutInicial: boolean }) {
  const [optout, setOptout] = useState(optoutInicial);
  const [cambiado, setCambiado] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cambiar(nuevo: boolean) {
    setBusy(true);
    setError(null);
    try {
      const resultado = nuevo ? await darDeBajaAvisos(m, t) : await reactivarAvisos(m, t);
      if (resultado === "ok") {
        setOptout(nuevo);
        setCambiado(true);
      } else if (resultado === "invalido") {
        setError("Este enlace ya no es válido.");
      } else {
        setError("No se pudo guardar el cambio. Intenta de nuevo en unos minutos.");
      }
    } catch {
      setError("No se pudo guardar el cambio. Revisa tu conexión e intenta de nuevo.");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {optout ? (
        <>
          <div className="flex items-start gap-3">
            {cambiado && <CircleCheck className="mt-0.5 size-6 shrink-0 text-green-700" aria-hidden="true" strokeWidth={1.75} />}
            <h1 className="font-display text-xl uppercase text-brand-black">
              {cambiado ? "Listo, ya no recibirás avisos" : "Ya no recibes avisos de promociones"}
            </h1>
          </div>
          <p className="font-sans text-sm text-brand-slate">
            Dejaremos de enviarte avisos de promociones de Club 57. Seguirás recibiendo los correos de tus pedidos y
            canjes, y tus promociones siguen disponibles en tu cuenta.
          </p>
          <Button variant="secondary" className="w-full" disabled={busy} onClick={() => cambiar(false)}>
            {busy ? "Guardando…" : "Volver a recibir avisos"}
          </Button>
        </>
      ) : (
        <>
          <h1 className="font-display text-xl uppercase text-brand-black">
            {cambiado ? "Listo, volverás a recibir avisos" : "¿Dejar de recibir avisos de promociones?"}
          </h1>
          <p className="font-sans text-sm text-brand-slate">
            {cambiado
              ? "Te avisaremos por correo cuando haya nuevas promociones para miembros de Club 57."
              : "Te escribimos cuando hay nuevas promociones exclusivas para miembros. Los correos de tus pedidos y canjes no cambian."}
          </p>
          {!cambiado && (
            <Button className="w-full" disabled={busy} onClick={() => cambiar(true)}>
              {busy ? "Guardando…" : "Dejar de recibir avisos"}
            </Button>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      <Link href="/cuenta" className="font-sans text-sm font-semibold text-brand-black underline underline-offset-2">
        Ir a mi cuenta
      </Link>
    </div>
  );
}
