"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { buttonClassName } from "@/components/ui";
import { getLastOrder, type ConfirmedOrder } from "@/lib/checkout/lastOrder";
import { formatPrice } from "@/lib/formatPrice";
import { LOCAL_SHIPPING_BUSINESS_DAYS, FORANEO_SHIPPING_BUSINESS_DAYS } from "@/lib/checkout/constants";
import { computePickupReadyTime, computeShippingEta, formatEtaDate, formatReadyAt } from "@/lib/checkout/fulfillmentTiming";

// El mensaje de tiempo de entrega se arma aquí (no en fulfillmentTiming.ts):
// esa utilidad solo calcula fechas/horas, la redacción exacta por
// modalidad es texto de interfaz, no lógica de negocio. `order.createdAt`
// (capturado en CheckoutView al confirmar) es el punto de partida del
// cálculo — nunca la hora en que se ve esta pantalla, que podría ser
// unos segundos o minutos después.
function getFulfillmentMessage(order: ConfirmedOrder): string {
  const orderTime = new Date(order.createdAt);
  if (order.deliveryMethod === "retiro") {
    const readyAt = computePickupReadyTime(orderTime);
    return `Tu pedido estará listo para recoger a partir del ${formatReadyAt(readyAt)}.`;
  }
  if (order.deliveryMethod === "envio_local") {
    const eta = computeShippingEta(orderTime, LOCAL_SHIPPING_BUSINESS_DAYS);
    return `Recibe tu pedido en un plazo no mayor a ${LOCAL_SHIPPING_BUSINESS_DAYS} días hábiles — llega a más tardar el ${formatEtaDate(eta)}.`;
  }
  const eta = computeShippingEta(orderTime, FORANEO_SHIPPING_BUSINESS_DAYS);
  return `Tu pedido llegará a más tardar el ${formatEtaDate(eta)}.`;
}

export function ConfirmationView() {
  // undefined = todavía no leímos sessionStorage; null = no había nada;
  // objeto = pedido encontrado. Distinguir "todavía no sabemos" de "no
  // hay nada" evita un parpadeo mostrando el estado de error de más.
  const [order, setOrder] = useState<ConfirmedOrder | null | undefined>(undefined);

  useEffect(() => {
    setOrder(getLastOrder());
  }, []);

  if (order === undefined) return null;

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-brand-gray px-6 py-16 text-center">
        <p className="font-sans text-base text-brand-black">
          No encontramos un pedido reciente.
        </p>
        <Link href="/" className={buttonClassName("primary")}>
          Ir al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-brand-orange text-brand-black">
        <CheckCircle2 className="size-8" aria-hidden="true" strokeWidth={1.75} />
      </span>

      <div>
        <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
          ¡Pedido confirmado!
        </h1>
        <p className="mt-2 font-sans text-sm text-brand-slate">
          Folio de pedido:{" "}
          <span className="font-semibold text-brand-black">{order.orderNumber}</span>
        </p>
      </div>

      <div className="w-full rounded-lg bg-brand-gray p-4 text-left sm:p-6">
        <p className="mb-3 font-sans text-sm font-semibold text-brand-black">
          {getFulfillmentMessage(order)}
        </p>
        {order.address && (
          <p className="mb-3 font-sans text-xs text-brand-slate">
            {order.address.street} {order.address.exteriorNumber}
            {order.address.interiorNumber ? ` Int. ${order.address.interiorNumber}` : ""}, {order.address.colonia}
            {order.address.city ? `, ${order.address.city}` : ""}
            {order.address.state ? `, ${order.address.state}` : ""}, C.P. {order.address.postalCode}
          </p>
        )}
        <div className="flex flex-col gap-2 border-t border-brand-slate/15 pt-3">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between gap-3 font-sans text-sm text-brand-black">
              <span>
                {item.quantity}× {item.name}
                {item.variantLabel ? ` (${item.variantLabel})` : ""}
              </span>
              <span className="shrink-0">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-1 border-t border-brand-slate/15 pt-3 font-sans text-sm text-brand-slate">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Envío</span>
            <span>{order.shipping === 0 ? "Gratis" : formatPrice(order.shipping)}</span>
          </div>
        </div>
        <div className="mt-2 flex justify-between border-t border-brand-slate/15 pt-3 font-sans text-base font-bold text-brand-black">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <p className="max-w-prose font-sans text-xs text-brand-slate/70">
        Esta es una confirmación simulada — todavía no se procesó ningún
        pago real ni se envió este pedido. Cuando conectemos Mercado Pago,
        la confirmación real llegará a {order.email}.
      </p>

      <Link href="/" className={buttonClassName("primary")}>
        Volver al inicio
      </Link>
    </div>
  );
}
