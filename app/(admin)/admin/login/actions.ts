"use server";

import { createClient } from "@/lib/supabase/server";

export interface RequestStaffPasswordResetResult {
  error?: string;
}

// «¿Olvidaste tu contraseña?» del login del panel (admin y vendedores).
// Mismo mecanismo que el de clientes (requestPasswordReset en
// app/(site)/cuenta/actions.ts): resetPasswordForEmail() nunca revela si
// el correo existe, y la pantalla siempre muestra el mismo mensaje. Solo
// cambia a dónde regresa el enlace: /admin/restablecer-contrasena, con la
// imagen del panel. Si la plantilla del correo apunta fija a la página de
// clientes, también funciona: ResetPasswordView manda al personal de
// vuelta a /admin/login al terminar.
export async function requestStaffPasswordReset(email: string): Promise<RequestStaffPasswordResetResult> {
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) {
    console.error("[requestStaffPasswordReset] falta configurar APP_BASE_URL en el servidor.");
    return { error: "No se pudo procesar tu solicitud. Intenta más tarde." };
  }

  const normalizedEmail = email.replace(/\s+/g, "").toLowerCase();
  if (!normalizedEmail.includes("@")) return { error: "Escribe un correo válido." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${appBaseUrl}/admin/restablecer-contrasena`,
  });

  if (error) {
    console.error("[requestStaffPasswordReset]", error.message);
    return { error: "No se pudo procesar tu solicitud. Intenta más tarde." };
  }

  return {};
}
