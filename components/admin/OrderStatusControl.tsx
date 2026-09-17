"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateOrderStatus } from "@/app/(admin)/admin/(protected)/pedidos/actions";
import {
  getAvailableNextStatuses,
  ORDER_STATUS_LABEL,
  type FulfillmentType,
  type OrderStatus,
} from "@/lib/orders/status";

// Las opciones ofrecidas salen de la misma tabla de transiciones que
// revalida el Server Action (lib/orders/status.ts) — nunca dos fuentes de
// verdad distintas de "qué sigue" que puedan desalinearse.
export function OrderStatusControl({
  orderId,
  status,
  fulfillmentType,
}: {
  orderId: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextOptions = getAvailableNextStatuses(status, fulfillmentType);

  async function handleAdvance(nextStatus: OrderStatus) {
    setIsPending(true);
    setError(null);
    const result = await updateOrderStatus(orderId, status, fulfillmentType, nextStatus);
    if (result.error) {
      setError(result.error);
      setIsPending(false);
      return;
    }
    router.refresh();
  }

  if (nextOptions.length === 0) {
    return (
      <p className="font-sans text-sm text-brand-slate/70">
        Este pedido ya está en un estatus final y no admite más cambios.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {nextOptions.map((option) => (
          <button
            key={option}
            type="button"
            disabled={isPending}
            onClick={() => handleAdvance(option)}
            className={
              option === "cancelado"
                ? "rounded-md border border-red-300 px-4 py-2 font-sans text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                : "rounded-md bg-brand-slate px-4 py-2 font-sans text-sm font-semibold text-white hover:bg-brand-black disabled:opacity-50"
            }
          >
            {option === "cancelado" ? "Cancelar pedido" : `Marcar como "${ORDER_STATUS_LABEL[option]}"`}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="font-sans text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
