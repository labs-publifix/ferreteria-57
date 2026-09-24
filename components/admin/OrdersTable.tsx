"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui";
import { deleteOrders } from "@/app/(admin)/admin/(protected)/pedidos/actions";
import { formatPrice } from "@/lib/formatPrice";
import {
  FULFILLMENT_TYPE_LABEL,
  ORDER_STATUS_BADGE_CLASS,
  ORDER_STATUS_LABEL,
  type FulfillmentType,
  type OrderStatus,
} from "@/lib/orders/status";
import { getOrderReadiness } from "@/lib/orders/readiness";

export interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  fulfillment_type: FulfillmentType;
  status: OrderStatus;
  total: number;
  created_at: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});

// Solo pedidos que nunca llegaron a pagarse (o ya cancelados) se pueden
// seleccionar para borrar — delete_orders() vuelve a validar esto mismo
// en la base, esto es solo para no ofrecer un checkbox que el servidor de
// todas formas va a rechazar.
const DELETABLE_STATUSES: OrderStatus[] = ["pendiente_pago", "cancelado"];

// Client Component (a diferencia de la versión de solo lectura anterior):
// selección de filas + borrado en lote necesitan estado compartido entre
// todas las filas, mismo criterio que ya usa ProductsTable.
export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deletableOrders = orders.filter((order) => DELETABLE_STATUSES.includes(order.status));
  const allDeletableSelected = deletableOrders.length > 0 && deletableOrders.every((o) => selectedIds.has(o.id));
  const someSelected = selectedIds.size > 0;

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(deletableOrders.map((order) => order.id)) : new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleDelete() {
    setConfirmOpen(false);
    setIsProcessing(true);
    setError(null);
    setSummary(null);

    const result = await deleteOrders([...selectedIds]);
    setIsProcessing(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const parts = [`${result.deleted} ${result.deleted === 1 ? "pedido eliminado" : "pedidos eliminados"}`];
    if (result.skipped) {
      parts.push(`${result.skipped} ${result.skipped === 1 ? "omitido" : "omitidos"} por ya estar pagado`);
    }
    setSummary(parts.join(", "));

    setSelectedIds(new Set());
    router.refresh();
  }

  if (orders.length === 0) {
    return (
      <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
        No hay pedidos que coincidan con esos filtros.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      {summary && (
        <p role="status" className="rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800">
          {summary}
        </p>
      )}

      {/* Barra de acciones en lote: solo ocupa espacio cuando hace falta,
          en vez de un renglón vacío permanente arriba de la tabla. */}
      {someSelected && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-brand-slate px-4 py-3">
          <span className="font-sans text-sm text-white">
            {selectedIds.size} {selectedIds.size === 1 ? "pedido seleccionado" : "pedidos seleccionados"}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setConfirmOpen(true)}
              className="flex min-h-9 items-center rounded-full bg-red-700 px-4 font-sans text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-50"
            >
              Eliminar seleccionados
            </button>
          </div>
        </div>
      )}

      <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos los pedidos eliminables"
                  checked={allDeletableSelected}
                  disabled={deletableOrders.length === 0}
                  onChange={(event) => toggleAll(event.target.checked)}
                  className="size-5 rounded border-brand-slate/40 accent-brand-orange disabled:opacity-30"
                />
              </th>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Entrega</th>
              <th className="px-4 py-3">Listo / entrega</th>
              <th className="px-4 py-3">Estatus</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const isDeletable = DELETABLE_STATUSES.includes(order.status);
              return (
                <tr key={order.id} className="border-b border-brand-slate/10 last:border-0 hover:bg-brand-gray/40">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar pedido ${order.order_number}`}
                      checked={selectedIds.has(order.id)}
                      disabled={!isDeletable}
                      title={isDeletable ? undefined : "Solo se pueden eliminar pedidos sin pagar o cancelados."}
                      onChange={(event) => toggleOne(order.id, event.target.checked)}
                      className="size-5 rounded border-brand-slate/40 accent-brand-orange disabled:opacity-30"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate font-medium text-brand-black">{order.customer_name}</p>
                    <p className="truncate text-xs text-brand-slate/70">{order.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 text-brand-slate">{FULFILLMENT_TYPE_LABEL[order.fulfillment_type]}</td>
                  <td className="max-w-[200px] px-4 py-3 text-brand-slate">
                    {getOrderReadiness(order.fulfillment_type, order.created_at).short}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS_BADGE_CLASS[order.status]}`}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-brand-black">
                    {formatPrice(order.total)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-brand-slate">
                    {dateFormatter.format(new Date(order.created_at))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar los pedidos seleccionados?"
        description={`Esta acción no se puede deshacer. Se eliminarán ${selectedIds.size} ${selectedIds.size === 1 ? "pedido" : "pedidos"} y, si tenían stock reservado por no haberse pagado, se devolverá al inventario.`}
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
