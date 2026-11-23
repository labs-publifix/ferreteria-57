import { CortesManager, type ObservacionCorte } from "@/components/empresa/CortesManager";
import { getPortalEmpresa } from "@/lib/club57/empresas/portal";
import { mapCiclo, mapCicloLinea, type CicloLinea } from "@/lib/club57/empresas/cortes";
import { diaCorteLabel } from "@/lib/club57/empresas/datos";

// Portal Empresa · Estados de cuenta del corte mensual con Ferretería 57.
export default async function PortalEmpresaCortes() {
  const { supabase, empresa } = await getPortalEmpresa();
  if (!empresa) return null;
  const [{ data: ciclosData, error }, { data: obsData }, { data: creditoData }] = await Promise.all([
    supabase.rpc("club57_portal_ciclos"),
    supabase
      .from("club57_ciclo_observaciones")
      .select("id, ciclo_id, order_id, comentario, estado, respuesta, created_at")
      .order("created_at"),
    supabase.rpc("club57_empresa_credito", { p_empresa_id: empresa.id }),
  ]);
  if (error) {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
        No se pudieron cargar los estados de cuenta. Intenta de nuevo.
      </p>
    );
  }
  const ciclos = ((ciclosData ?? []) as Record<string, unknown>[]).map(mapCiclo);
  // Detalle (pedidos) de los cortes cerrados recientes: para observar y para
  // mostrar el folio de cada observación.
  const conDetalle = ciclos.filter((c) => c.estado !== "abierto").slice(0, 8);
  const detallesArr = await Promise.all(
    conDetalle.map(async (c) => {
      const { data } = await supabase.rpc("club57_ciclo_detalle", { p_ciclo_id: c.id });
      return [c.id, ((data ?? []) as Record<string, unknown>[]).map(mapCicloLinea)] as const;
    })
  );
  const detalles: Record<string, CicloLinea[]> = Object.fromEntries(detallesArr);
  const credito = ((creditoData ?? []) as Record<string, unknown>[])[0];

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-prose font-sans text-sm text-brand-slate">
        Cada corte ({diaCorteLabel(empresa.dia_corte).toLowerCase()}) reúne los pedidos que autorizaste. Revisa el estado de cuenta,
        da tu conformidad u observa algún pedido; con eso emitimos la factura. Al registrar tu pago se libera tu crédito y los puntos
        Club 57 de tus colaboradores.
      </p>
      <CortesManager
        ciclos={ciclos}
        detalles={detalles}
        observaciones={(obsData ?? []) as ObservacionCorte[]}
        credito={
          credito
            ? {
                limite: credito.limite === null ? null : Number(credito.limite),
                comprometido: Number(credito.comprometido),
                disponible: Number(credito.disponible),
              }
            : null
        }
      />
    </div>
  );
}
