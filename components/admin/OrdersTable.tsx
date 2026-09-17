import Link from "next/link";
import { formatPrice } from "@/lib/formatPrice";
import { FULFILLMENT_TYPE_LABEL, ORDER_STATUS_LABEL, type FulfillmentType, type OrderStatus } from "@/lib/orders/status";

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

const STATUS_CLASS: Record<OrderStatus, string> = {
  pendiente_pago: "bg-amber-100 text-amber-800",
  pagado: "bg-blue-100 text-blue-800",
  preparando: "bg-blue-100 text-blue-800",
  listo: "bg-blue-100 text-blue-800",
  enviado: "bg-blue-100 text-blue-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-brand-gray text-brand-slate",
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});

// Tabla de solo lectura (a diferencia de ReviewsTable/ProductsTable): la
// acción de cambiar estatus vive en la vista de detalle, no aquí — cada
// fila es un enlace a /admin/pedidos/[id].
export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
        No hay pedidos que coincidan con esos filtros.
      </p>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left font-sans text-sm">
        <thead>
          <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
            <th className="px-4 py-3">Pedido</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Entrega</th>
            <th className="px-4 py-3">Estatus</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-brand-slate/10 last:border-0 hover:bg-brand-gray/40">
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
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[order.status]}`}>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
