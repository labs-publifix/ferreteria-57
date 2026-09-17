"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidStatusTransition, type FulfillmentType, type OrderStatus } from "@/lib/orders/status";

export interface OrderActionResult {
  error?: string;
}

// Mismo criterio que el resto del admin: cada Server Action confirma
// is_admin() por su cuenta, sin confiar en que el middleware ya filtró la
// request.
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return null;

  return supabase;
}

// Vuelve a validar la transición contra la misma tabla que ya usó la UI
// para decidir qué botones ofrecer (lib/orders/status.ts) — nunca confía en
// que el estatus destino que mandó el cliente ya era una opción legítima.
export async function updateOrderStatus(
  orderId: string,
  currentStatus: OrderStatus,
  fulfillmentType: FulfillmentType,
  nextStatus: OrderStatus
): Promise<OrderActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  if (!isValidStatusTransition(currentStatus, nextStatus, fulfillmentType)) {
    return { error: "Ese cambio de estatus no es válido para este pedido." };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId)
    .eq("status", currentStatus);
  if (error) return { error: `No se pudo actualizar el pedido: ${error.message}` };

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  return {};
}
