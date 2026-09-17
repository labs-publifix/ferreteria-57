import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { formatPrice } from "@/lib/formatPrice";
import { FULFILLMENT_TYPE_LABEL, ORDER_STATUS_LABEL, type FulfillmentType, type OrderStatus } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Detalle de pedido — Panel de administración" };

interface OrderDetail {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  fulfillment_type: FulfillmentType;
  colonia: string | null;
  shipping_address: Record<string, string> | null;
  shipping_cost: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  created_at: string;
}

interface OrderItemRow {
  id: string;
  product_name: string;
  variant_label: string | null;
  sku: string;
  unit_price: number;
  quantity: number;
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});

function AddressBlock({ order }: { order: OrderDetail }) {
  if (order.fulfillment_type === "pickup") {
    return <p className="font-sans text-sm text-brand-slate/70">Sin dirección — el cliente recoge en tienda.</p>;
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
      {address.references && <p className="mt-1 text-brand-slate/70">Referencias: {address.references}</p>}
    </div>
  );
}

export default async function AdminPedidoDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_email, customer_name, customer_phone, fulfillment_type, colonia, shipping_address, shipping_cost, subtotal, total, status, created_at"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_name, variant_label, sku, unit_price, quantity")
    .eq("order_id", params.id);

  const orderDetail = order as OrderDetail;
  const orderItems = (items ?? []) as OrderItemRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/pedidos"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Volver a pedidos
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">
            Pedido {orderDetail.order_number}
          </h1>
          <span className="rounded-full bg-brand-gray px-3 py-1 font-sans text-xs font-semibold uppercase text-brand-slate">
            {ORDER_STATUS_LABEL[orderDetail.status]}
          </span>
        </div>
        <p className="mt-1 font-sans text-sm text-brand-slate/70">
          {dateFormatter.format(new Date(orderDetail.created_at))} · {FULFILLMENT_TYPE_LABEL[orderDetail.fulfillment_type]}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Cliente</h2>
          <dl className="font-sans text-sm text-brand-black">
            <div className="flex justify-between gap-3 py-1">
              <dt className="text-brand-slate/70">Nombre</dt>
              <dd className="text-right font-medium">{orderDetail.customer_name}</dd>
            </div>
            <div className="flex justify-between gap-3 py-1">
              <dt className="text-brand-slate/70">Correo</dt>
              <dd className="text-right font-medium">{orderDetail.customer_email}</dd>
            </div>
            <div className="flex justify-between gap-3 py-1">
              <dt className="text-brand-slate/70">Teléfono</dt>
              <dd className="text-right font-medium">{orderDetail.customer_phone}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Entrega</h2>
          <AddressBlock order={orderDetail} />
        </div>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Productos</h2>
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                <th className="py-2">Producto</th>
                <th className="py-2">SKU</th>
                <th className="py-2">Cant.</th>
                <th className="py-2">Precio unit.</th>
                <th className="py-2">Importe</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item) => (
                <tr key={item.id} className="border-b border-brand-slate/10 last:border-0">
                  <td className="py-2 text-brand-black">
                    {item.product_name}
                    {item.variant_label && (
                      <span className="text-brand-slate/70"> — {item.variant_label}</span>
                    )}
                  </td>
                  <td className="py-2 text-brand-slate">{item.sku}</td>
                  <td className="py-2 text-brand-slate">{item.quantity}</td>
                  <td className="py-2 text-brand-slate">{formatPrice(item.unit_price)}</td>
                  <td className="py-2 font-medium text-brand-black">
                    {formatPrice(item.unit_price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col items-end gap-1 border-t border-brand-slate/10 pt-3 font-sans text-sm">
          <div className="flex w-full max-w-[220px] justify-between text-brand-slate">
            <span>Subtotal</span>
            <span>{formatPrice(orderDetail.subtotal)}</span>
          </div>
          <div className="flex w-full max-w-[220px] justify-between text-brand-slate">
            <span>Envío</span>
            <span>{orderDetail.shipping_cost === 0 ? "Gratis" : formatPrice(orderDetail.shipping_cost)}</span>
          </div>
          <div className="flex w-full max-w-[220px] justify-between font-semibold text-brand-black">
            <span>Total</span>
            <span>{formatPrice(orderDetail.total)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Avanzar estatus</h2>
        <OrderStatusControl
          orderId={orderDetail.id}
          status={orderDetail.status}
          fulfillmentType={orderDetail.fulfillment_type}
        />
      </div>
    </div>
  );
}
