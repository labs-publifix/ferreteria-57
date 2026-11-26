// Solo servidor: usa la llave de servicio (no importar desde componentes de cliente).
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/sendEmail";
import { getBusinessNotificationRecipients } from "@/lib/email/businessRecipients";
import { buildCanjeEmpresaEmail } from "@/lib/email/empresarialEmails";
import { appUrl } from "./notificaciones";

// Canje de puntos de la empresa: aviso a Ferretería 57 y confirmación al
// responsable. Corre después del canje y nunca lanza.
export async function notificarCanjeEmpresa(canjeId: string): Promise<void> {
  try {
    const { data } = await createAdminClient()
      .from("club57_empresa_canjes")
      .select("puntos_usados, club57_empresas(nombre_comercial, responsable_nombre, responsable_correo), club57_redemption_catalog(nombre)")
      .eq("id", canjeId)
      .maybeSingle();
    if (!data) return;
    const empresa = (Array.isArray(data.club57_empresas) ? data.club57_empresas[0] : data.club57_empresas) as
      | { nombre_comercial: string; responsable_nombre: string; responsable_correo: string }
      | null;
    const item = (Array.isArray(data.club57_redemption_catalog) ? data.club57_redemption_catalog[0] : data.club57_redemption_catalog) as
      | { nombre: string }
      | null;
    if (!empresa || !item) return;
    const comun = {
      empresa: empresa.nombre_comercial,
      responsableNombre: empresa.responsable_nombre,
      articulo: item.nombre,
      puntos: data.puntos_usados,
    };
    const envios = await Promise.all([
      sendEmail({ to: getBusinessNotificationRecipients(), ...buildCanjeEmpresaEmail({ ...comun, destino: "interno", url: appUrl("/admin/lealtad/canjes") }) }),
      sendEmail({ to: empresa.responsable_correo, ...buildCanjeEmpresaEmail({ ...comun, destino: "responsable", url: appUrl("/empresa/puntos") }) }),
    ]);
    for (const r of envios) if (r.error) console.error("[club57 empresarial] canje de empresa", r.error);
  } catch (error) {
    console.error("[club57 empresarial] canje de empresa", error instanceof Error ? error.message : error);
  }
}
