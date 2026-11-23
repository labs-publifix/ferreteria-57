import { EmpleadosManager } from "@/components/empresa/EmpleadosManager";
import { PrecargaPanel } from "@/components/empresa/PrecargaPanel";
import { getPortalEmpresa, mapPortalEmpleado, mapPortalSaldos } from "@/lib/club57/empresas/portal";

// Portal Empresa · Empleados: solicitudes, activos, historial y precarga.
export default async function PortalEmpresaEmpleados() {
  const { supabase, empresa } = await getPortalEmpresa();
  if (!empresa) return null;
  const [{ data, error }, { data: saldosData }] = await Promise.all([
    supabase.rpc("club57_portal_empleados"),
    supabase.rpc("club57_portal_saldos"),
  ]);
  const empleados = ((data ?? []) as Record<string, unknown>[]).map(mapPortalEmpleado);
  const saldos = mapPortalSaldos((saldosData ?? []) as Record<string, unknown>[]);

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudieron cargar los empleados. Intenta de nuevo.
        </p>
      ) : (
        <EmpleadosManager
          empleados={empleados}
          saldos={saldos}
          empresa={{
            exigeNumero: empresa.exige_numero_empleado,
            politica: empresa.politica_porcentaje,
            nomina: { frecuencia: empresa.nomina_frecuencia, diaSemana: empresa.nomina_dia_semana, diaMes: empresa.nomina_dia_mes },
          }}
        />
      )}
      <PrecargaPanel pendientesPrevias={empleados.filter((e) => e.estado === "pendiente").length} />
    </div>
  );
}
