"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { registerClub57ManualPurchase } from "@/app/(admin)/admin/(protected)/lealtad/clientes/actions";

export function Club57RegisterPurchaseForm({ memberId }: { memberId: string }) {
  const router = useRouter();
  const montoId = useId();
  const [monto, setMonto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await registerClub57ManualPurchase(memberId, monto);
    setIsSubmitting(false);

    if (result.error || typeof result.puntos !== "number") {
      setError(result.error ?? "No se pudo registrar la compra.");
      return;
    }

    setSuccess(result.puntos);
    setMonto("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      {success !== null && !error && (
        <p role="status" className="rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800">
          Compra registrada: {success} {success === 1 ? "punto" : "puntos"} en estado pendiente.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[160px]">
          <label htmlFor={montoId} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Monto de la compra (MXN)
          </label>
          <input
            id={montoId}
            type="number"
            required
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(event) => setMonto(event.target.value)}
            className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registrando…" : "Registrar compra en tienda"}
        </Button>
      </div>
    </form>
  );
}
