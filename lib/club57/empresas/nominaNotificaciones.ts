// Solo servidor: usa la llave de servicio (no importar desde componentes de cliente).
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/sendEmail";
import { buildNominaPorAplicarEmail } from "@/lib/email/empresarialEmails";
import { fechaNominaLabel } from "./nomina";
import { appUrl } from "./notificaciones";

/**
 * Tarea diaria de nómina (Club 57 Empresarial):
 * 1) aplica completas las nóminas que la empresa no confirmó en 3 días
 *    hábiles después de su fecha;
 * 2) avisa a cada responsable de las nóminas con descuentos que llegan en
 *    los próximos 3 días (una sola vez por nómina).
 */
export async function procesarNominasDiario(): Promise<{ tacitas: number; avisos: number }> {
  const supabase = createAdminClient();

  const { data: tacitas, error: tacitasError } = await supabase.rpc("club57_confirmar_nominas_tacitas");
  if (tacitasError) throw new Error(tacitasError.message);

  const { data: porAvisar, error: avisarError } = await supabase.rpc("club57_nominas_por_avisar");
  if (avisarError) throw new Error(avisarError.message);
  const filas = (porAvisar ?? []) as { empresa_id: string; fecha: string; empleados: number; total: number | string }[];

  let avisos = 0;
  if (filas.length > 0) {
    const { data: empresas } = await supabase
      .from("club57_empresas")
      .select("id, nombre_comercial, responsable_nombre, responsable_correo")
      .in("id", [...new Set(filas.map((f) => f.empresa_id))]);
    const porId = new Map(((empresas ?? []) as { id: string; nombre_comercial: string; responsable_nombre: string; responsable_correo: string }[]).map((e) => [e.id, e]));
    for (const fila of filas) {
      const empresa = porId.get(fila.empresa_id);
      if (!empresa) continue;
      const result = await sendEmail({
        to: empresa.responsable_correo,
        ...buildNominaPorAplicarEmail({
          responsableNombre: empresa.responsable_nombre,
          empresa: empresa.nombre_comercial,
          fechaLabel: fechaNominaLabel(fila.fecha),
          empleados: Number(fila.empleados),
          total: Number(fila.total),
          portalUrl: appUrl("/empresa/nomina"),
          excelUrl: appUrl(`/api/empresa/nomina?fecha=${fila.fecha}`),
        }),
      });
      if (result.error) console.error("[club57 empresarial] aviso de nómina", result.error);
      else avisos += 1;
    }
  }
  return { tacitas: Number(tacitas ?? 0), avisos };
}
