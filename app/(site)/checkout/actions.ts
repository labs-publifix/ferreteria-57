"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  FORANEO_COST,
  NO_LISTADA_KEY,
} from "@/lib/checkout/constants";
import { computeShipping, getLocalZoneCost, isForaneoOverLimit } from "@/lib/checkout/shippingCalculator";
import { getZonasEnvioServer } from "@/lib/checkout/getZonasEnvioServer";
import { isContactValid, isForaneoAddressValid, isLocalAddressValid } from "@/lib/checkout/validation";
import type { ContactForm, ForaneoAddressForm, LocalAddressForm } from "@/lib/checkout/validation";
import { createCheckoutPreference } from "@/lib/mercadopago/createCheckoutPreference";
import { MercadoPagoNotConnectedError } from "@/lib/mercadopago/getSellerAccessToken";
import { checkCartAgainstQuote, hasValidQuantities, roundMoney, type CartQuote, type QuotedLine } from "@/lib/checkout/priceCheck";
import { notificarPedidoEmpresaCreado } from "@/lib/club57/empresas/pedidosNotificaciones";

export interface CreateOrderItemInput {
  productName: string;
  variantLabel: string | null;
  sku: string;
  /** Id real de product_variants — usado por create_order() para
   *  descontar stock, nunca se guarda en el snapshot de order_items. */
  variantId: string;
  unitPrice: number;
  quantity: number;
}

interface CreateOrderBase {
  contact: ContactForm;
  items: CreateOrderItemInput[];
  subtotal: number;
  /** "empresa" = Club 57 Empresarial: el pedido se carga a la empresa del
   *  empleado y queda en espera de su autorización (no pasa por Mercado
   *  Pago). Por omisión, tarjeta en Mercado Pago. */
  paymentMethod?: "tarjeta" | "empresa";
}

export type CreateOrderInput =
  | (CreateOrderBase & { fulfillmentType: "pickup" })
  | (CreateOrderBase & { fulfillmentType: "local_delivery"; colonia: string; address: LocalAddressForm })
  | (CreateOrderBase & { fulfillmentType: "foraneo"; address: ForaneoAddressForm });

export interface CreateOrderResult {
  error?: string;
  orderNumber?: string;
  shippingCost?: number;
  total?: number;
  createdAt?: string;
  /** Presente solo en éxito — a dónde redirigir para pagar en Mercado
   *  Pago (Checkout Pro). El pedido ya existe en 'pendiente_pago'; pasa a
   *  'pagado' cuando el webhook confirma el cobro, ver
   *  app/api/mercadopago/webhook/route.ts. */
  redirectUrl?: string;
  /** true cuando los precios del carrito ya no son los vigentes para quien
   *  compra: el navegador vuelve a pedir los precios y el cliente revisa. */
  pricesChanged?: boolean;
  /** Solo en pedidos con cargo a la empresa. */
  cargoEmpresa?: { empresa: string; venceAt: string };
}

const PRICES_CHANGED_MESSAGE =
  "Los precios de tu carrito se actualizaron. Revisa el total antes de continuar con el pago.";

// Todo lo que ya validó el formulario en el navegador (botón deshabilitado
// hasta que los campos son válidos) se vuelve a validar aquí — nunca se
// confía en que el cliente mandó datos correctos, mismo criterio que el
// resto de las Server Actions del proyecto (ver resenas/actions.ts).
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!isContactValid(input.contact)) {
    return { error: "Revisa tus datos de contacto." };
  }
  if (input.items.length === 0) {
    return { error: "Tu carrito está vacío." };
  }

  if (!hasValidQuantities(input.items)) {
    return { error: "Revisa las cantidades de tu carrito." };
  }

  // Los precios NUNCA se toman del navegador: el servidor cotiza cada
  // presentación con el precio que le corresponde a quien compra (lista de
  // Club 57 o precio de tienda) y create_order() los vuelve a calcular al
  // guardar. Si lo que vio el cliente ya no coincide (precio actualizado o
  // datos manipulados), se le pide revisar en vez de cobrar otra cosa.
  const supabase = await createClient();
  const { data: quoteRows, error: quoteError } = await supabase.rpc("cotizar_carrito", {
    p_variant_ids: [...new Set(input.items.map((item) => item.variantId))],
  });
  if (quoteError) {
    console.error("[createOrder] cotizar_carrito", quoteError.message);
    return { error: "No se pudo registrar tu pedido. Intenta de nuevo." };
  }
  const check = checkCartAgainstQuote(input.items, (quoteRows ?? []) as CartQuote[]);
  if (!check.ok) {
    return check.reason === "unavailable"
      ? { error: "Un producto de tu carrito ya no está disponible. Actualiza tu carrito e intenta de nuevo.", pricesChanged: true }
      : { error: PRICES_CHANGED_MESSAGE, pricesChanged: true };
  }
  const subtotal = check.subtotal;

  let shippingCost: number;
  let colonia: string | null = null;
  let shippingAddress: Record<string, string> | null = null;

  if (input.fulfillmentType === "pickup") {
    shippingCost = 0;
  } else if (input.fulfillmentType === "local_delivery") {
    if (!isLocalAddressValid(input.address)) {
      return { error: "Revisa los datos de tu dirección." };
    }

    // Vuelve a consultar zonas_envio en el servidor — el combobox ya
    // restringe la elección a colonias reales o al sentinel de "no
    // listada", pero esta es la segunda capa: si de todos modos llega un
    // valor que no matchea nada, se rechaza el pedido en vez de guardar un
    // costo de envío inventado.
    const zonas = await getZonasEnvioServer();
    const isKnownColonia =
      input.colonia === NO_LISTADA_KEY || zonas.some((zona) => zona.colonia === input.colonia);
    if (!isKnownColonia) {
      return {
        error:
          "Esa colonia no está en nuestra zona de cobertura de envío local. Elige 'Mi colonia no aparece en la lista', o cambia a Retiro en tienda o Envío foráneo.",
      };
    }

    const zoneCost = getLocalZoneCost(input.colonia, zonas);
    const result = computeShipping({ method: "envio_local", subtotal, zoneCost });
    // result.cost solo es null cuando zoneCost es null, y aquí siempre se
    // le pasa un número — el `?? zoneCost` nada más satisface el tipo.
    shippingCost = result.cost ?? zoneCost;
    colonia = input.colonia === NO_LISTADA_KEY ? "No listada" : input.colonia;
    shippingAddress = { ...input.address, city: "Querétaro", state: "Querétaro" };
  } else {
    if (!isForaneoAddressValid(input.address)) {
      return { error: "Revisa los datos de tu dirección." };
    }
    // Igual que en el navegador: por encima del monto máximo no hay
    // checkout estándar que completar, así que ni siquiera se intenta
    // crear el pedido — la UI ya reemplaza el botón por el CTA de
    // WhatsApp en este caso, esta es la segunda capa de esa misma regla.
    if (isForaneoOverLimit(subtotal)) {
      return {
        error:
          "Tu pedido supera el monto máximo para envío foráneo estándar — contáctanos por WhatsApp para cotizar tu envío.",
      };
    }
    shippingCost = FORANEO_COST;
    shippingAddress = { ...input.address };
  }

  const expectedTotal = roundMoney(subtotal + shippingCost);

  if (input.paymentMethod === "empresa") {
    return createOrderConCargoAEmpresa(supabase, input, {
      colonia,
      shippingAddress,
      shippingCost,
      expectedTotal,
      lines: check.lines,
    });
  }

  const { data, error } = await supabase.rpc("create_order", {
    p_customer_email: input.contact.email,
    p_customer_name: `${input.contact.firstName} ${input.contact.lastName}`.trim(),
    p_customer_phone: input.contact.phone,
    p_fulfillment_type: input.fulfillmentType,
    p_colonia: colonia,
    p_shipping_address: shippingAddress,
    p_shipping_cost: shippingCost,
    // create_order() ignora subtotal, total y unit_price: los calcula en la
    // base. Se mandan por compatibilidad con la firma de la función.
    p_subtotal: subtotal,
    p_total: expectedTotal,
    p_items: check.lines.map((line) => ({
      variant_id: line.variantId,
      quantity: line.quantity,
      product_name: line.productName,
      variant_label: line.variantLabel,
      sku: line.sku,
      unit_price: line.unitPrice,
    })),
  });

  if (error) {
    // F57NS: errcode propio que create_order() usa solo para "no hay
    // stock suficiente" — ese mensaje ya está redactado para mostrarse
    // tal cual al cliente. Cualquier otro error de base de datos se
    // esconde detrás de un mensaje genérico, igual que antes.
    if (error.code === "F57NS") {
      return { error: error.message };
    }
    // F57NA: un producto del carrito se desactivó o se borró justo antes.
    if (error.code === "F57NA") {
      return { error: error.message, pricesChanged: true };
    }
    console.error("[createOrder]", error.message);
    return { error: "No se pudo registrar tu pedido. Intenta de nuevo." };
  }
  const row = data?.[0] as
    | { id: string; order_number: string; created_at: string; subtotal: number | string; total: number | string }
    | undefined;
  if (!row) {
    return { error: "No se pudo registrar tu pedido. Intenta de nuevo." };
  }

  // El total guardado es el que manda: si un precio cambió entre la
  // cotización y la creación (ventana de milisegundos), el pedido se cancela
  // y se le pide al cliente revisar, en vez de cobrar un monto distinto al
  // que vio.
  const total = roundMoney(Number(row.total));
  if (Math.abs(total - expectedTotal) > 0.005) {
    const { error: cancelError } = await createAdminClient().rpc("mark_order_payment_failed", { p_order_id: row.id });
    if (cancelError) console.error("[createOrder] no se pudo cancelar el pedido con precio cambiado", row.id, cancelError.message);
    return { error: PRICES_CHANGED_MESSAGE, pricesChanged: true };
  }

  // El pedido ya existe en 'pendiente_pago' (con su stock ya reservado)
  // en este punto — si algo falla de aquí en adelante, ese pedido se
  // queda huérfano sin forma de pagarse, así que se cancela por su cuenta
  // (libera el stock) y se le informa al cliente en vez de dejarlo
  // colgado. Los correos de confirmación YA NO se mandan aquí: se mandan
  // desde el webhook cuando el pago se confirma de verdad (ver
  // app/api/mercadopago/webhook/route.ts) — mandarlos antes de cobrar
  // sería avisarle al cliente de un pedido que todavía podría no
  // completarse.
  const customerName = `${input.contact.firstName} ${input.contact.lastName}`.trim();

  try {
    const preference = await createCheckoutPreference({
      orderId: row.id,
      orderNumber: row.order_number,
      customerName,
      customerEmail: input.contact.email,
      // Los mismos precios y nombres que quedaron guardados en el pedido.
      items: check.lines.map((line) => ({
        title: line.variantLabel && line.variantLabel !== "Único" ? `${line.productName} (${line.variantLabel})` : line.productName,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
      shippingCost,
    });

    // mp_preference_id es solo trazabilidad (el webhook encuentra el
    // pedido por external_reference, no por esto) — si este update
    // fallara no tiene sentido cancelar un pedido cuyo pago sí se pudo
    // armar, así que su error solo se registra.
    const { error: updateError } = await createAdminClient()
      .from("orders")
      .update({ mp_preference_id: preference.preferenceId })
      .eq("id", row.id);
    if (updateError) {
      console.error("[createOrder] no se pudo guardar mp_preference_id:", updateError.message);
    }

    return {
      orderNumber: row.order_number,
      shippingCost,
      total,
      createdAt: row.created_at,
      redirectUrl: preference.initPoint,
    };
  } catch (err) {
    const adminClient = createAdminClient();
    const { error: cancelError } = await adminClient.rpc("mark_order_payment_failed", {
      p_order_id: row.id,
    });
    if (cancelError) {
      console.error("[createOrder] no se pudo cancelar el pedido huérfano", row.id, cancelError.message);
    }

    if (err instanceof MercadoPagoNotConnectedError) {
      console.error("[createOrder] Mercado Pago no está conectado — no se puede cobrar.");
      return { error: "La tienda no puede procesar pagos en este momento. Contáctanos por WhatsApp." };
    }
    console.error("[createOrder] fallo al crear la preferencia de pago:", err);
    return { error: "No se pudo iniciar el pago. Intenta de nuevo." };
  }
}

// Club 57 Empresarial: «Cargo a mi empresa». club57_crear_pedido_empresa()
// crea el pedido con create_order() (mismos precios y stock) y valida en la
// misma transacción que el vínculo esté activo, que la empresa esté activa
// y que alcancen la línea del empleado y el crédito de la empresa. El
// pedido queda en espera de autorización y se guarda con el correo de la
// cuenta, para que aparezca en Mi cuenta.
const CARGO_EMPRESA_ERRORES = new Set(["F57E1", "F57E2", "F57E3", "F57E4", "F57NS"]);

async function createOrderConCargoAEmpresa(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: CreateOrderInput,
  datos: {
    colonia: string | null;
    shippingAddress: Record<string, string> | null;
    shippingCost: number;
    expectedTotal: number;
    lines: QuotedLine[];
  }
): Promise<CreateOrderResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión para cargar tu compra a tu empresa." };

  const { data: creditoRows } = await supabase.rpc("club57_mi_credito_empresa");
  const credito = ((creditoRows ?? []) as { empresa_nombre: string }[])[0];
  if (!credito) return { error: "No tienes una empresa vinculada activa. Puedes pagar con tarjeta." };

  const { data, error } = await supabase.rpc("club57_crear_pedido_empresa", {
    p_customer_name: `${input.contact.firstName} ${input.contact.lastName}`.trim(),
    p_customer_phone: input.contact.phone,
    p_fulfillment_type: input.fulfillmentType,
    p_colonia: datos.colonia,
    p_shipping_address: datos.shippingAddress,
    p_shipping_cost: datos.shippingCost,
    p_items: datos.lines.map((line) => ({ variant_id: line.variantId, quantity: line.quantity })),
  });
  if (error) {
    if (CARGO_EMPRESA_ERRORES.has(error.code)) return { error: error.message };
    if (error.code === "F57NA") return { error: error.message, pricesChanged: true };
    console.error("[createOrder empresa]", error.message);
    return { error: "No se pudo registrar tu pedido. Intenta de nuevo." };
  }
  const row = (data as { id: string; order_number: string; created_at: string; total: number | string; autorizacion_vence_at: string }[] | null)?.[0];
  if (!row) return { error: "No se pudo registrar tu pedido. Intenta de nuevo." };

  const total = roundMoney(Number(row.total));
  if (Math.abs(total - datos.expectedTotal) > 0.005) {
    const { error: cancelError } = await supabase.rpc("club57_cancelar_mi_pedido_empresa", { p_order_id: row.id });
    if (cancelError) console.error("[createOrder empresa] no se pudo cancelar el pedido con precio cambiado", row.id, cancelError.message);
    return { error: PRICES_CHANGED_MESSAGE, pricesChanged: true };
  }

  await notificarPedidoEmpresaCreado(row.id);

  return {
    orderNumber: row.order_number,
    shippingCost: datos.shippingCost,
    total,
    createdAt: row.created_at,
    redirectUrl: "/checkout/confirmacion?pago=empresa",
    cargoEmpresa: { empresa: credito.empresa_nombre, venceAt: row.autorizacion_vence_at },
  };
}
