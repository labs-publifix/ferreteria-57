"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateOrderStatus } from "@/app/(admin)/admin/(protected)/pedidos/actions";
import { buttonClassName, ConfirmDialog, Select } from "@/components/ui";
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
  const [selected, setSelected] = useState<OrderStatus | "">("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // "Cancelado" pide una segunda confirmación antes de aplicarse — a
  // diferencia de avanzar la secuencia normal, cancelar es una acción que
  // no se deshace y conviene que no dispare con un solo clic distraído en
  // el dropdown.
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const nextOptions = getAvailableNextStatuses(status, fulfillmentType);

  async function applyChange(nextStatus: OrderStatus) {
    setIsPending(true);
    setError(null);
    const result = await updateOrderStatus(orderId, status, fulfillmentType, nextStatus);
    if (result.error) {
      setError(result.error);
      setIsPending(false);
      return;
    }
    setSelected("");
    router.refresh();
  }

  function handleSave() {
    if (!selected) return;
    if (selected === "cancelado") {
      setConfirmingCancel(true);
      return;
    }
    applyChange(selected);
  }

  if (nextOptions.length === 0) {
    return (
      <p className="font-sans text-sm text-brand-slate/70">
        Este pedido ya está en un estatus final y no admite más cambios.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px]">
          <Select
            value={selected}
            onChange={(value) => setSelected(value as OrderStatus)}
            label="Siguiente estatus"
            placeholder="Elige el siguiente estatus"
            options={nextOptions.map((option) => ({
              value: option,
              label: option === "cancelado" ? "Cancelar pedido" : ORDER_STATUS_LABEL[option],
            }))}
          />
        </div>
        <button
          type="button"
          disabled={!selected || isPending}
          onClick={handleSave}
          className={buttonClassName("primary")}
        >
          {isPending ? "Guardando..." : "Guardar cambio de estatus"}
        </button>
      </div>
      {error && (
        <p role="alert" className="font-sans text-xs text-red-600">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancelar pedido"
        description="¿Cancelar este pedido? Esta acción no se puede deshacer."
        confirmLabel="Cancelar pedido"
        tone="danger"
        onConfirm={() => {
          setConfirmingCancel(false);
          applyChange("cancelado");
        }}
        onCancel={() => setConfirmingCancel(false)}
      />
    </div>
  );
}
