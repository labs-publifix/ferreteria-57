"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sendEmail";
import { buildRedemptionRequestedEmail } from "@/lib/email/club57Emails";

export interface RequestPasswordResetResult {
  error?: string;
}

// Server Action (no llamado directo desde el navegador) para poder leer
// APP_BASE_URL del servidor al armar el redirectTo — mismo criterio que ya
// usa createCheckoutPreference.ts con Mercado Pago. resetPasswordForEmail()
// de Supabase ya está diseñado para no distinguir "correo no registrado" de
// "correo enviado" (nunca revela si una cuenta existe): este Server Action
// no le agrega ninguna lógica que pudiera romper esa protección, solo
// pasa cualquier error real (límite de envíos, config faltante) tal cual.
export async function requestPasswordReset(email: string): Promise<RequestPasswordResetResult> {
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) {
    console.error("[requestPasswordReset] falta configurar APP_BASE_URL en el servidor.");
    return { error: "No se pudo procesar tu solicitud. Intenta más tarde." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appBaseUrl}/cuenta/restablecer-contrasena`,
  });

  if (error) {
    console.error("[requestPasswordReset]", error.message);
    return { error: "No se pudo procesar tu solicitud. Intenta más tarde." };
  }

  return {};
}

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

  const redemption = data as { id: string; puntos_usados: number };

  // El canje ya quedó registrado en este punto — un correo que falle
  // nunca debe deshacerlo ni bloquear la respuesta de éxito al cliente
  // (mismo criterio que checkout/actions.ts con sus correos de pedido).
  const [{ data: item }, { data: profile }] = await Promise.all([
    supabase.from("club57_redemption_catalog").select("nombre").eq("id", itemId).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  if (item && user.email) {
    const emailContent = buildRedemptionRequestedEmail({
      customerName: profile?.full_name?.trim() || "cliente",
      itemName: item.nombre,
      pointsUsed: redemption.puntos_usados,
    });
    const emailResult = await sendEmail({ to: user.email, subject: emailContent.subject, html: emailContent.html });
    if (emailResult.error) console.error("[requestClub57Redemption] correo de confirmación:", emailResult.error);
  }

  revalidatePath("/cuenta");
  return { redemptionId: redemption.id };
}
