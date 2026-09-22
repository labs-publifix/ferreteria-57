"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
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

type PaymentState = "approved" | "pending" | "rejected";

// Mercado Pago agrega "status" a las tres back_urls (éxito/pendiente/
// rechazo apuntan al mismo lugar, ver createCheckoutPreference.ts) — el
// estatus real y definitivo del pedido lo decide el webhook del lado del
// servidor (ver app/api/mercadopago/webhook/route.ts), esto solo decide
// qué mostrar mientras tanto. Sin el parámetro (p. ej. alguien vuelve a
// esta pantalla desde el historial del navegador) se asume aprobado —
// mismo comportamiento que tenía esta pantalla antes de conectar Mercado
// Pago.
function getPaymentState(status: string | null): PaymentState {
  if (status === "pending" || status === "in_process") return "pending";
  if (status === "rejected" || status === "cancelled") return "rejected";
  return "approved";
}

export function ConfirmationView() {
  // undefined = todavía no leímos sessionStorage; null = no había nada;
  // objeto = pedido encontrado. Distinguir "todavía no sabemos" de "no
  // hay nada" evita un parpadeo mostrando el estado de error de más.
  const [order, setOrder] = useState<ConfirmedOrder | null | undefined>(undefined);
  const searchParams = useSearchParams();
  const paymentState = getPaymentState(searchParams.get("status"));

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

  const stateIcon =
    paymentState === "approved" ? (
      <span className="flex size-16 items-center justify-center rounded-full bg-brand-orange text-brand-black">
        <CheckCircle2 className="size-8" aria-hidden="true" strokeWidth={1.75} />
      </span>
    ) : paymentState === "pending" ? (
      <span className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-800">
        <Clock className="size-8" aria-hidden="true" strokeWidth={1.75} />
      </span>
    ) : (
      <span className="flex size-16 items-center justify-center rounded-full bg-red-100 text-red-700">
        <XCircle className="size-8" aria-hidden="true" strokeWidth={1.75} />
      </span>
    );

  const stateHeading =
    paymentState === "approved"
      ? "¡Pedido confirmado!"
      : paymentState === "pending"
        ? "Tu pago está en proceso"
        : "No se pudo procesar tu pago";

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {stateIcon}

      <div>
        <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
          {stateHeading}
        </h1>
        <p className="mt-2 font-sans text-sm text-brand-slate">
          Folio de pedido:{" "}
          <span className="font-semibold text-brand-black">{order.orderNumber}</span>
        </p>
      </div>

      <div className="w-full rounded-lg bg-brand-gray p-4 text-left sm:p-6">
        {paymentState === "rejected" ? (
          <p className="mb-3 font-sans text-sm font-semibold text-brand-black">
            Tu pedido no se completó — el pago no se procesó.
          </p>
        ) : (
          <p className="mb-3 font-sans text-sm font-semibold text-brand-black">
            {getFulfillmentMessage(order)}
          </p>
        )}
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
        {paymentState === "approved"
          ? `Te mandamos la confirmación de tu pedido a ${order.email}.`
          : paymentState === "pending"
            ? `Tu pago está siendo procesado por Mercado Pago — te avisamos por correo a ${order.email} en cuanto se confirme.`
            : "Puedes intentar de nuevo desde el carrito, o contáctanos por WhatsApp si el problema sigue."}
      </p>

      <Link href="/" className={buttonClassName("primary")}>
        Volver al inicio
      </Link>
    </div>
  );
}
