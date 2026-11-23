// Solo servidor: usa la llave de servicio (no importar desde componentes de cliente).
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/sendEmail";
import { buildSolicitudEmpleadoEmail, buildVinculoResueltoEmail } from "@/lib/email/empresarialEmails";
import { SITE_URL } from "@/lib/seo";

// Correos de Club 57 Empresarial que dependen de datos que la sesión no
// puede leer (el correo del responsable, el del empleado): se arman con la
// llave de servicio, solo desde el servidor y después de que la acción ya
// validó el permiso. Nunca lanzan: un correo fallido no deshace la acción.

export function appUrl(path: string): string {
  const base = (process.env.APP_BASE_URL || SITE_URL).replace(/\/$/, "");
  return `${base}${path}`;
}

/** Avisa al responsable que un colaborador pidió vincularse (una sola vez). */
export async function notificarSolicitudVinculo(empleadoId: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("club57_empresa_empleados")
      .select(
        "id, estado, numero_empleado, notificado_at, club57_members(full_name, email), club57_empresas(nombre_comercial, responsable_nombre, responsable_correo, responsable_user_id)"
      )
      .eq("id", empleadoId)
      .maybeSingle();
    if (!data || data.estado !== "pendiente" || data.notificado_at) return;
    const member = (Array.isArray(data.club57_members) ? data.club57_members[0] : data.club57_members) as
      | { full_name: string; email: string }
      | null;
    const empresa = (Array.isArray(data.club57_empresas) ? data.club57_empresas[0] : data.club57_empresas) as
      | { nombre_comercial: string; responsable_nombre: string; responsable_correo: string; responsable_user_id: string | null }
      | null;
    if (!member || !empresa) return;

    const email = buildSolicitudEmpleadoEmail({
      responsableNombre: empresa.responsable_nombre,
      empresa: empresa.nombre_comercial,
      empleadoNombre: member.full_name,
      empleadoCorreo: member.email,
      numeroEmpleado: data.numero_empleado,
      portalUrl: appUrl("/empresa/empleados"),
    });
    const result = await sendEmail({ to: empresa.responsable_correo, ...email });
    if (result.error) {
      console.error("[club57 empresarial] aviso de solicitud", result.error);
      return;
    }
    await supabase.from("club57_empresa_empleados").update({ notificado_at: new Date().toISOString() }).eq("id", empleadoId);
  } catch (error) {
    console.error("[club57 empresarial] aviso de solicitud", error instanceof Error ? error.message : error);
  }
}

/** Avisa al empleado que su empresa aprobó, rechazó o dio de baja su vínculo. */
export async function notificarVinculoResuelto(empleadoId: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("club57_empresa_empleados")
      .select("estado, motivo, linea_credito, club57_members(full_name, email), club57_empresas(nombre_comercial)")
      .eq("id", empleadoId)
      .maybeSingle();
    if (!data || !["activo", "rechazado", "baja"].includes(data.estado)) return;
    const member = (Array.isArray(data.club57_members) ? data.club57_members[0] : data.club57_members) as
      | { full_name: string; email: string }
      | null;
    const empresa = (Array.isArray(data.club57_empresas) ? data.club57_empresas[0] : data.club57_empresas) as
      | { nombre_comercial: string }
      | null;
    if (!member || !empresa) return;
    const email = buildVinculoResueltoEmail({
      empleadoNombre: member.full_name,
      empresa: empresa.nombre_comercial,
      estado: data.estado as "activo" | "rechazado" | "baja",
      motivo: data.motivo,
      lineaCredito: data.linea_credito === null ? null : Number(data.linea_credito),
      cuentaUrl: appUrl("/cuenta?tab=empresarial"),
    });
    const result = await sendEmail({ to: member.email, ...email });
    if (result.error) console.error("[club57 empresarial] aviso al empleado", result.error);
  } catch (error) {
    console.error("[club57 empresarial] aviso al empleado", error instanceof Error ? error.message : error);
  }
}
