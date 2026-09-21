"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface RequestRedemptionResult {
  error?: string;
  redemptionId?: string;
}

// Único camino del cliente para pedir un canje — toda la validación real
// (saldo suficiente, stock disponible, descuento atómico) vive en la
// función request_club57_redemption() de la base (ver migración
// 20260924010000), esta Server Action solo llama al RPC y traduce sus
// errcodes a mensajes que ya tienen sentido mostrados tal cual.
export async function requestClub57Redemption(itemId: string): Promise<RequestRedemptionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión para canjear puntos." };

  const { data, error } = await supabase.rpc("request_club57_redemption", { p_item_id: itemId }).single();

  if (error) {
    if (error.code === "F57NS") return { error: "Este artículo ya no tiene stock disponible." };
    if (error.code === "F57PI") return { error: "No tienes puntos suficientes para canjear este artículo." };
    return { error: error.message };
  }

  revalidatePath("/cuenta");
  return { redemptionId: (data as { id: string })?.id };
}
