import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSellerAccessToken, MercadoPagoNotConnectedError } from "@/lib/mercadopago/getSellerAccessToken";
import { sendEmail } from "@/lib/email/sendEmail";
import {
  buildCustomerConfirmationEmail,
  buildInternalNotificationEmail,
  type OrderEmailAddress,
} from "@/lib/email/orderEmails";
import type { FulfillmentType } from "@/lib/orders/status";

const INTERNAL_NOTIFICATION_EMAIL = "ferreteria57@proton.me";

interface MpPaymentResource {
  id: number;
  status: string;
  external_reference: string | null;
}

// Nunca se confía en el cuerpo del webhook por sí solo (cualquiera puede
// mandarle un POST a esta URL) — siempre se vuelve a pedir el pago
// directo a la API de Mercado Pago con el token del vendedor antes de
// tocar el pedido. Esta es la única fuente de verdad.
async function fetchPayment(paymentId: string): Promise<MpPaymentResource | null> {
  const accessToken = await getSellerAccessToken();
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    console.error("[mercadopago/webhook] GET /v1/payments respondió", response.status);
    return null;
  }
  return response.json();
}

// Mercado Pago manda "al menos una vez" — puede repetir el mismo aviso.
// Ambos casos (confirmar/cancelar) ya son idempotentes en la base (ver
// confirm_order_payment / mark_order_payment_failed), así que un mismo
// payment_id procesado dos veces nunca duplica puntos ni correos: el
// segundo intento de confirmar ve el pedido ya 'pagado' y no hace nada,
// así que esta ruta tampoco reenvía correos en ese caso.
export async function POST(request: NextRequest) {
  let paymentId: string | null = null;
  try {
    const body = await request.json().catch(() => ({}) as Record<string, unknown>);
    const type = (body as { type?: string; topic?: string }).type ?? (body as { topic?: string }).topic;
    const dataId = (body as { data?: { id?: string | number } }).data?.id;

    // Formato alterno (poco común, pero MP también lo soporta): query
    // params en vez de body JSON.
    const searchParams = request.nextUrl.searchParams;
    const queryType = searchParams.get("type") ?? searchParams.get("topic");
    const queryId = searchParams.get("data.id") ?? searchParams.get("id");

    const effectiveType = type ?? queryType;
    paymentId = dataId != null ? String(dataId) : queryId;

    if (effectiveType !== "payment" || !paymentId) {
      // Cualquier otro tipo de notificación (p. ej. "merchant_order") no
      // nos interesa — 200 para que Mercado Pago no reintente algo que
      // nunca vamos a procesar.
      return NextResponse.json({ ok: true, ignored: true });
    }
  } catch (err) {
    console.error("[mercadopago/webhook] no se pudo leer el body", err);
    return NextResponse.json({ ok: true, ignored: true });
  }

  let payment: MpPaymentResource | null;
  try {
    payment = await fetchPayment(paymentId);
  } catch (err) {
    if (err instanceof MercadoPagoNotConnectedError) {
      // No debería poder pasar (si hay pagos es porque sí se conectó
      // alguna vez), pero si pasa, no hay nada que hacer todavía —
      // devolver 200 evita reintentos infinitos de algo que no se puede
      // resolver solo.
      console.error("[mercadopago/webhook] Mercado Pago no está conectado.");
      return NextResponse.json({ ok: true, ignored: true });
    }
    console.error("[mercadopago/webhook] fallo al pedir el pago a Mercado Pago", err);
    return NextResponse.json({ error: "No se pudo verificar el pago." }, { status: 500 });
  }

  if (!payment || !payment.external_reference) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const orderId = payment.external_reference;
  const adminClient = createAdminClient();

  if (payment.status === "approved") {
    const { error } = await adminClient.rpc("confirm_order_payment", {
      p_order_id: orderId,
      p_mp_payment_id: String(payment.id),
    });
    if (error) {
      console.error("[mercadopago/webhook] confirm_order_payment falló", orderId, error.message);
      return NextResponse.json({ error: "No se pudo confirmar el pedido." }, { status: 500 });
    }
    await sendOrderConfirmationEmails(adminClient, orderId);
  } else if (payment.status === "rejected" || payment.status === "cancelled") {
    const { error } = await adminClient.rpc("mark_order_payment_failed", {
      p_order_id: orderId,
      p_mp_payment_id: String(payment.id),
    });
    if (error) {
      console.error("[mercadopago/webhook] mark_order_payment_failed falló", orderId, error.message);
      return NextResponse.json({ error: "No se pudo cancelar el pedido." }, { status: 500 });
    }
  }
  // Otros estatus (pending, in_process, refunded, charged_back, ...): sin
  // acción automática por ahora — el pedido se queda como está y el
  // admin lo resuelve a mano desde /admin/pedidos si hace falta.

  return NextResponse.json({ ok: true });
}

// Reconstruye el mismo shape que antes armaba createOrder() para los dos
// correos de pedido, pero leyendo de la fila real en vez de los datos del
// formulario — este código corre en el webhook, sin acceso al request
// original del checkout. Un correo que falle aquí no debe poder tirar la
// confirmación del pago en sí (ya se aplicó antes de llamar esto): se
// registra el error y ya.
async function sendOrderConfirmationEmails(
  adminClient: ReturnType<typeof createAdminClient>,
  orderId: string
) {
  try {
    const [{ data: order, error: orderError }, { data: items, error: itemsError }] = await Promise.all([
      adminClient
        .from("orders")
        .select(
          "order_number, created_at, customer_name, customer_phone, customer_email, fulfillment_type, colonia, shipping_address, subtotal, shipping_cost, total"
        )
        .eq("id", orderId)
        .single(),
      adminClient
        .from("order_items")
        .select("product_name, variant_label, quantity, unit_price")
        .eq("order_id", orderId),
    ]);

    if (orderError || !order) {
      console.error("[mercadopago/webhook] no se pudo leer el pedido para el correo", orderId, orderError?.message);
      return;
    }

    const emailData = {
      orderNumber: order.order_number as string,
      createdAt: order.created_at as string,
      customerName: order.customer_name as string,
      customerPhone: order.customer_phone as string,
      customerEmail: order.customer_email as string,
      fulfillmentType: order.fulfillment_type as FulfillmentType,
      colonia: order.colonia as string | null,
      shippingAddress: order.shipping_address as OrderEmailAddress | null,
      items: (items ?? []).map((item) => ({
        productName: item.product_name as string,
        variantLabel: item.variant_label as string | null,
        quantity: item.quantity as number,
        unitPrice: item.unit_price as number,
      })),
      subtotal: order.subtotal as number,
      shippingCost: order.shipping_cost as number,
      total: order.total as number,
    };

    const internalEmail = buildInternalNotificationEmail(emailData);
    const customerEmailContent = buildCustomerConfirmationEmail(emailData);

    const [internalResult, customerResult] = await Promise.all([
      sendEmail({ to: INTERNAL_NOTIFICATION_EMAIL, subject: internalEmail.subject, html: internalEmail.html }),
      sendEmail({ to: emailData.customerEmail, subject: customerEmailContent.subject, html: customerEmailContent.html }),
    ]);
    if (internalResult.error) console.error("[mercadopago/webhook] correo interno:", internalResult.error);
    if (customerResult.error) console.error("[mercadopago/webhook] correo de confirmación:", customerResult.error);
  } catch (err) {
    console.error("[mercadopago/webhook] fallo al mandar correos de confirmación", orderId, err);
  }
}
