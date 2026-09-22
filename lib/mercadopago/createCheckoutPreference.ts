import { getSellerAccessToken } from "@/lib/mercadopago/getSellerAccessToken";

export interface CheckoutPreferenceItem {
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateCheckoutPreferenceInput {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: CheckoutPreferenceItem[];
  /** 0 se omite del arreglo de items — Mercado Pago no necesita un
   *  renglón de $0 para "envío gratis". */
  shippingCost: number;
}

export interface CheckoutPreference {
  preferenceId: string;
  initPoint: string;
}

// Arma y crea la preferencia de Checkout Pro a nombre de la cuenta de
// Mercado Pago del cliente (Authorization: Bearer <token del vendedor>,
// nunca MP_ACCESS_TOKEN estático — ver getSellerAccessToken) para que el
// dinero le llegue directo a él, modo Marketplace. external_reference
// lleva el id real del pedido: es lo único que el webhook necesita para
// encontrarlo de vuelta (ver app/api/mercadopago/webhook/route.ts).
export async function createCheckoutPreference(
  input: CreateCheckoutPreferenceInput
): Promise<CheckoutPreference> {
  const accessToken = await getSellerAccessToken();
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) {
    throw new Error("Falta configurar APP_BASE_URL en el servidor.");
  }

  const items = input.items.map((item) => ({
    title: item.title,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    currency_id: "MXN",
  }));
  if (input.shippingCost > 0) {
    items.push({ title: "Envío", quantity: 1, unit_price: input.shippingCost, currency_id: "MXN" });
  }

  const confirmationUrl = `${appBaseUrl}/checkout/confirmacion?order=${encodeURIComponent(input.orderNumber)}`;

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      items,
      payer: { name: input.customerName, email: input.customerEmail },
      external_reference: input.orderId,
      back_urls: {
        success: confirmationUrl,
        pending: confirmationUrl,
        failure: confirmationUrl,
      },
      auto_return: "approved",
      notification_url: `${appBaseUrl}/api/mercadopago/webhook`,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[createCheckoutPreference] Mercado Pago respondió", response.status, errorBody);
    throw new Error("Mercado Pago no pudo generar el enlace de pago.");
  }

  const data = await response.json();
  return { preferenceId: data.id, initPoint: data.init_point };
}
