"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/supabase/requireStaff";

export interface Club57RedemptionActionResult {
  error?: string;
}

// Único camino para resolver un canje — toda la lógica (reembolso de
// puntos y restauración de stock al cancelar, bloqueo de fila para que
// dos clics casi simultáneos no lo resuelvan dos veces, y ahora también
// "un vendedor solo resuelve canjes de sus propios clientes") vive en el
// RPC update_club57_redemption_status() de la base (ver migraciones
// 20260924010000_club57_redemption_flow.sql y
// 20260927010000_club57_vendedor_role.sql).
export async function updateClub57RedemptionStatus(
  redemptionId: string,
  nuevoEstado: "entregado" | "cancelado"
): Promise<Club57RedemptionActionResult> {
  const staff = await requireStaff();
  if (!staff) return { error: "No autorizado." };

  const { error } = await staff.supabase.rpc("update_club57_redemption_status", {
    p_redemption_id: redemptionId,
    p_new_estado: nuevoEstado,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/lealtad/canjes");
  revalidatePath("/admin/vendedor/canjes");
  return {};
}
