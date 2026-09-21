"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Club57RedemptionActionResult {
  error?: string;
}

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

// Único camino para resolver un canje — toda la lógica (reembolso de
// puntos y restauración de stock al cancelar, bloqueo de fila para que
// dos clics casi simultáneos no lo resuelvan dos veces) vive en el RPC
// update_club57_redemption_status() de la base (ver migración
// 20260924010000_club57_redemption_flow.sql).
export async function updateClub57RedemptionStatus(
  redemptionId: string,
  nuevoEstado: "entregado" | "cancelado"
): Promise<Club57RedemptionActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const { error } = await supabase.rpc("update_club57_redemption_status", {
    p_redemption_id: redemptionId,
    p_new_estado: nuevoEstado,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/lealtad/canjes");
  return {};
}
