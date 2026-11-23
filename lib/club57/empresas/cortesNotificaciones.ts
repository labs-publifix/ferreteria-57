// Solo servidor: usa la llave de servicio (no importar desde componentes de cliente).
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/sendEmail";
import { getBusinessNotificationRecipients } from "@/lib/email/businessRecipients";
import { buildCorteCerradoEmail, buildCorteMovimientoEmail, buildEmpresaSuspensionEmail } from "@/lib/email/empresarialEmails";
import { ultimoDiaPlazo } from "./pedidos";
import { fechaCorta, periodoLabel } from "./cortes";
import { appUrl } from "./notificaciones";

// Correos del corte mensual de Club 57 Empresarial. Igual que los demás
// avisos: corren después de la acción y nunca lanzan.

interface CicloEmpresa {
  id: string;
  empresa_id: string;
  periodo_inicio: string;
  periodo_fin: string;
  revision_vence_at: string | null;
  factura_folio: string | null;
  factura_monto: number | null;
  pago_vence: string | null;
  pago_monto: number | null;
  empresa: { nombre_comercial: string; responsable_nombre: string; responsable_correo: string };
}

function registrar(contexto: string, error: unknown) {
  console.error(`[club57 empresarial] ${contexto}`, error instanceof Error ? error.message : error);
}

async function enviar(contexto: string, to: string | string[], email: { subject: string; html: string }) {
  const result = await sendEmail({ to, ...email });
  if (result.error) registrar(contexto, result.error);
}

async function leerCiclo(cicloId: string): Promise<CicloEmpresa | null> {
  const { data } = await createAdminClient()
    .from("club57_ciclos")
    .select(
      "id, empresa_id, periodo_inicio, periodo_fin, revision_vence_at, factura_folio, factura_monto, pago_vence, pago_monto, club57_empresas(nombre_comercial, responsable_nombre, responsable_correo)"
    )
    .eq("id", cicloId)
    .maybeSingle();
  if (!data) return null;
  const empresa = Array.isArray(data.club57_empresas) ? data.club57_empresas[0] : data.club57_empresas;
  if (!empresa) return null;
  return {
    ...(data as unknown as CicloEmpresa),
    factura_monto: data.factura_monto === null ? null : Number(data.factura_monto),
    pago_monto: data.pago_monto === null ? null : Number(data.pago_monto),
    empresa: empresa as CicloEmpresa["empresa"],
  };
}

/** Corte cerrado: estado de cuenta listo para la empresa y aviso a Ferretería 57. */
export async function notificarCorteCerrado(cicloId: string): Promise<void> {
  try {
    const ciclo = await leerCiclo(cicloId);
    if (!ciclo) return;
    const supabase = createAdminClient();
    const [{ data: total }, { count }] = await Promise.all([
      supabase.rpc("club57_ciclo_total", { p_ciclo_id: cicloId }),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("ciclo_id", cicloId).neq("status", "cancelado"),
    ]);
    const comun = {
      responsableNombre: ciclo.empresa.responsable_nombre,
      empresa: ciclo.empresa.nombre_comercial,
      periodo: periodoLabel(ciclo.periodo_inicio, ciclo.periodo_fin),
      total: Number(total ?? 0),
      pedidos: count ?? 0,
      revisionHasta: ciclo.revision_vence_at ? ultimoDiaPlazo(ciclo.revision_vence_at) : "—",
    };
    await Promise.all([
      enviar("corte cerrado (empresa)", ciclo.empresa.responsable_correo, buildCorteCerradoEmail({ ...comun, destino: "empresa", url: appUrl("/empresa/cortes") })),
      enviar(
        "corte cerrado (interno)",
        getBusinessNotificationRecipients(),
        buildCorteCerradoEmail({ ...comun, destino: "interno", url: appUrl(`/admin/lealtad/empresas/${ciclo.empresa_id}#cortes`) })
      ),
    ]);
  } catch (error) {
    registrar("aviso de corte cerrado", error);
  }
}

/** Factura o pago registrados: aviso al responsable (y a todos si se reactivó). */
export async function notificarMovimientoCorte(cicloId: string, tipo: "factura" | "pago", reactivada = false): Promise<void> {
  try {
    const ciclo = await leerCiclo(cicloId);
    if (!ciclo) return;
    await enviar(
      `${tipo} registrada`,
      ciclo.empresa.responsable_correo,
      buildCorteMovimientoEmail({
        tipo,
        responsableNombre: ciclo.empresa.responsable_nombre,
        empresa: ciclo.empresa.nombre_comercial,
        periodo: periodoLabel(ciclo.periodo_inicio, ciclo.periodo_fin),
        folio: ciclo.factura_folio,
        monto: (tipo === "factura" ? ciclo.factura_monto : ciclo.pago_monto) ?? 0,
        fechaLimite: tipo === "factura" && ciclo.pago_vence ? fechaCorta(ciclo.pago_vence) : null,
        reactivada,
        url: appUrl("/empresa/cortes"),
      })
    );
    if (reactivada) await notificarSuspension(ciclo.empresa_id, "reactivada", null, { omitirResponsable: true });
  } catch (error) {
    registrar(`aviso de ${tipo}`, error);
  }
}

/** Empresa suspendida, reactivada o dada de baja: responsable y colaboradores activos. */
export async function notificarSuspension(
  empresaId: string,
  tipo: "suspendida" | "reactivada" | "baja",
  periodo: string | null,
  opciones: { omitirResponsable?: boolean; motivo?: string | null } = {}
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const [{ data: empresa }, { data: empleados }] = await Promise.all([
      supabase.from("club57_empresas").select("nombre_comercial, responsable_nombre, responsable_correo").eq("id", empresaId).maybeSingle(),
      supabase.from("club57_empresa_empleados").select("club57_members(full_name, email)").eq("empresa_id", empresaId).eq("estado", "activo"),
    ]);
    if (!empresa) return;
    if (!opciones.omitirResponsable) {
      await enviar(
        `empresa ${tipo} (responsable)`,
        empresa.responsable_correo,
        buildEmpresaSuspensionEmail({
          tipo,
          destino: "responsable",
          nombre: empresa.responsable_nombre,
          empresa: empresa.nombre_comercial,
          periodo,
          motivo: opciones.motivo ?? null,
          url: appUrl(tipo === "baja" ? "/cuenta" : "/empresa/cortes"),
        })
      );
    }
    // Un correo por colaborador (nunca todos en el mismo «Para»).
    for (const row of (empleados ?? []) as { club57_members: { full_name: string; email: string } | { full_name: string; email: string }[] | null }[]) {
      const m = Array.isArray(row.club57_members) ? row.club57_members[0] : row.club57_members;
      if (!m?.email) continue;
      await enviar(
        `empresa ${tipo} (empleado)`,
        m.email,
        buildEmpresaSuspensionEmail({ tipo, destino: "empleado", nombre: m.full_name, empresa: empresa.nombre_comercial, periodo, url: appUrl("/cuenta?tab=empresarial") })
      );
    }
  } catch (error) {
    registrar(`aviso de empresa ${tipo}`, error);
  }
}

/**
 * Tarea diaria del corte: cierra los ciclos cuyo día de corte pasó (y avisa),
 * da conformidad tácita a los que vencieron su revisión sin observaciones y
 * suspende a las empresas con pago vencido (y avisa).
 */
export async function procesarCortesDiario(): Promise<{ cerrados: number; conciliados: number; vencidos: number }> {
  const supabase = createAdminClient();
  const { data: cerrados, error: cerrarError } = await supabase.rpc("club57_cerrar_ciclos");
  if (cerrarError) throw new Error(cerrarError.message);
  const cerradosIds = ((cerrados ?? []) as (string | Record<string, string>)[]).map((row) => (typeof row === "string" ? row : Object.values(row)[0]));
  for (const id of cerradosIds) await notificarCorteCerrado(id);

  const { data: conciliados, error: concError } = await supabase.rpc("club57_conciliar_ciclos_tacitos");
  if (concError) throw new Error(concError.message);

  const { data: vencidos, error: vencerError } = await supabase.rpc("club57_vencer_ciclos");
  if (vencerError) throw new Error(vencerError.message);
  const filas = (vencidos ?? []) as { ciclo_id: string; empresa_id: string; suspendida: boolean }[];
  for (const fila of filas) {
    if (!fila.suspendida) continue;
    const ciclo = await leerCiclo(fila.ciclo_id);
    await notificarSuspension(fila.empresa_id, "suspendida", ciclo ? periodoLabel(ciclo.periodo_inicio, ciclo.periodo_fin) : null);
  }
  return { cerrados: cerradosIds.length, conciliados: Number(conciliados ?? 0), vencidos: filas.length };
}
