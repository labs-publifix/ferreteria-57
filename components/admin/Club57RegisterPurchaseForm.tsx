"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { registerClub57ManualPurchase } from "@/app/(admin)/admin/(protected)/lealtad/clientes/actions";

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

export function Club57RegisterPurchaseForm({ memberId }: { memberId: string }) {
  const router = useRouter();
  const productoId = useId();
  const codigoId = useId();
  const montoId = useId();
  const [producto, setProducto] = useState("");
  const [codigo, setCodigo] = useState("");
  const [monto, setMonto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await registerClub57ManualPurchase(memberId, monto, producto, codigo);
    setIsSubmitting(false);

    if (result.error || typeof result.puntos !== "number") {
      setError(result.error ?? "No se pudo registrar la compra.");
      return;
    }

    setSuccess(result.puntos);
    setProducto("");
    setCodigo("");
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
      {/* Mismos datos que ya captura un pedido real (product_name/sku en
          order_items) — así el historial dice QUÉ se compró, no solo
          cuánto. Código es opcional: no siempre está a la mano en el
          mostrador. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr] sm:items-end">
        <div>
          <label htmlFor={productoId} className={labelClass}>
            Producto
          </label>
          <input
            id={productoId}
            type="text"
            required
            placeholder='p. ej. "Taladro Truper 1/2"'
            value={producto}
            onChange={(event) => setProducto(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={codigoId} className={labelClass}>
            Código (opcional)
          </label>
          <input
            id={codigoId}
            type="text"
            value={codigo}
            onChange={(event) => setCodigo(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={montoId} className={labelClass}>
            Monto (MXN)
          </label>
          <input
            id={montoId}
            type="number"
            required
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(event) => setMonto(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto sm:self-start">
        {isSubmitting ? "Registrando…" : "Registrar compra en tienda"}
      </Button>
    </form>
  );
}
