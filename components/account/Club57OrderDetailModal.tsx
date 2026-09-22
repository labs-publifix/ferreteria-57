"use client";

import { useId } from "react";
import { Modal } from "@/components/ui";
import {
  FULFILLMENT_TYPE_LABEL,
  ORDER_STATUS_BADGE_CLASS,
  ORDER_STATUS_LABEL,
  type FulfillmentType,
  type OrderStatus,
} from "@/lib/orders/status";

export interface Club57OrderItemRow {
  id: string;
  product_name: string;
  variant_label: string | null;
  sku: string;
  unit_price: number;
  quantity: number;
}

export interface Club57OrderDetail {
  id: string;
  order_number: string;
  created_at: string;
  status: OrderStatus;
  fulfillment_type: FulfillmentType;
  colonia: string | null;
  shipping_address: Record<string, string> | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  items: Club57OrderItemRow[];
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeStyle: "short" });
const pesosFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

// Mismo criterio de "nunca depender del catálogo/dirección actual" que ya
// usa el detalle de pedido del admin (app/(admin).../pedidos/[id]/page.tsx)
// — se lee tal cual quedó guardado en el pedido, sin recalcular nada.
function AddressSummary({ order }: { order: Club57OrderDetail }) {
  if (order.fulfillment_type === "pickup") {
    return <p className="font-sans text-sm text-brand-slate/70">Recoges en tienda — sin envío.</p>;
  }

  const address = order.shipping_address;
  if (!address) {
    return <p className="font-sans text-sm text-brand-slate/70">Sin dirección registrada.</p>;
  }

  return (
    <div className="font-sans text-sm text-brand-black">
      {order.fulfillment_type === "local_delivery" && order.colonia && (
        <p className="font-medium">Colonia: {order.colonia}</p>
      )}
      {order.fulfillment_type === "foraneo" && address.colonia && (
        <p className="font-medium">Colonia: {address.colonia}</p>
      )}
      <p>
        {address.street} {address.exteriorNumber}
        {address.interiorNumber ? `, int. ${address.interiorNumber}` : ""}
      </p>
      <p>
        {address.city}, {address.state} — C.P. {address.postalCode}
      </p>
    </div>
  );
}

// Reutiliza el mismo cascarón de modal que Club57ItemQuickView
// (components/ui/Modal.tsx) — pedido explícito de no construir un patrón
// de detalle nuevo desde cero.
export function Club57OrderDetailModal({ order, onClose }: { order: Club57OrderDetail; onClose: () => void }) {
  const titleId = useId();

  return (
    <Modal titleId={titleId} onClose={onClose}>
      <div className="flex flex-col gap-4 text-left">
        <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
          <h2 id={titleId} className="font-display text-lg uppercase text-brand-slate">
            Pedido {order.order_number}
          </h2>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS_BADGE_CLASS[order.status]}`}
          >
            {ORDER_STATUS_LABEL[order.status]}
          </span>
        </div>
        <p className="-mt-2 font-sans text-xs text-brand-slate/60">
          {dateFormatter.format(new Date(order.created_at))} · {FULFILLMENT_TYPE_LABEL[order.fulfillment_type]}
        </p>

        <div>
          <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
            Entrega
          </h3>
          <AddressSummary order={order} />
        </div>

        <div>
          <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
            Artículos
          </h3>
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[380px] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                  <th className="py-2">Producto</th>
                  <th className="py-2">Cant.</th>
                  <th className="py-2">Importe</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-brand-slate/10 last:border-0">
                    <td className="py-2 text-brand-black">
                      {item.product_name}
                      {item.variant_label && <span className="text-brand-slate/70"> — {item.variant_label}</span>}
                    </td>
                    <td className="py-2 text-brand-slate">{item.quantity}</td>
                    <td className="py-2 font-medium text-brand-black">
                      {pesosFormatter.format(item.unit_price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 border-t border-brand-slate/10 pt-3 font-sans text-sm">
          <div className="flex w-full max-w-[220px] justify-between text-brand-slate">
            <span>Subtotal</span>
            <span>{pesosFormatter.format(order.subtotal)}</span>
          </div>
          <div className="flex w-full max-w-[220px] justify-between text-brand-slate">
            <span>Envío</span>
            <span>{order.shipping_cost === 0 ? "Gratis" : pesosFormatter.format(order.shipping_cost)}</span>
          </div>
          <div className="flex w-full max-w-[220px] justify-between font-semibold text-brand-black">
            <span>Total</span>
            <span>{pesosFormatter.format(order.total)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
