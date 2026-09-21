"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Club57ConfigActionResult {
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

// Misma validación que ya aplican los CHECK de la migración — repetida
// aquí para poder mostrar un mensaje de error específico por campo en vez
// de que el primer intento de guardar reviente con el mensaje genérico de
// Postgres. La base sigue siendo la segunda capa real (ver
// 20260921010000_club57.sql), esto solo mejora el mensaje.
export async function updateClub57Config(formData: FormData): Promise<Club57ConfigActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const montoPorPunto = Number.parseFloat(String(formData.get("montoPorPunto") ?? ""));
  const tasaCanjePct = Number.parseFloat(String(formData.get("tasaCanjePct") ?? ""));
  const diasEsperaPendiente = Number.parseInt(String(formData.get("diasEsperaPendiente") ?? ""), 10);
  const puntosReferidor = Number.parseInt(String(formData.get("puntosReferidor") ?? ""), 10);
  const puntosReferido = Number.parseInt(String(formData.get("puntosReferido") ?? ""), 10);

  if (Number.isNaN(montoPorPunto) || montoPorPunto < 1) {
    return { error: "El monto por punto debe ser de al menos $1." };
  }
  if (Number.isNaN(tasaCanjePct) || tasaCanjePct < 1 || tasaCanjePct > 50) {
    return { error: "La tasa de canje debe estar entre 1% y 50%." };
  }
  if (Number.isNaN(diasEsperaPendiente) || diasEsperaPendiente < 0 || diasEsperaPendiente > 30) {
    return { error: "Los días de espera deben estar entre 0 y 30." };
  }
  if (Number.isNaN(puntosReferidor) || puntosReferidor < 1 || puntosReferidor > 100) {
    return { error: "Los puntos por referido (referidor) deben estar entre 1 y 100." };
  }
  if (Number.isNaN(puntosReferido) || puntosReferido < 1 || puntosReferido > 100) {
    return { error: "Los puntos por referido (referido) deben estar entre 1 y 100." };
  }

  const { error } = await supabase
    .from("club57_config")
    .update({
      monto_por_punto: montoPorPunto,
      tasa_canje_pct: tasaCanjePct,
      dias_espera_pendiente: diasEsperaPendiente,
      puntos_referidor: puntosReferidor,
      puntos_referido: puntosReferido,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return { error: `No se pudo guardar la configuración: ${error.message}` };

  revalidatePath("/admin/lealtad/configuracion");
  return {};
}
