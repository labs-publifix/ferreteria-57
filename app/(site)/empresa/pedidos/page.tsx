import { PedidosManager } from "@/components/empresa/PedidosManager";
import { getPortalEmpresa, mapPortalPedido } from "@/lib/club57/empresas/portal";

// Portal Empresa · Pedidos con cargo a la empresa: autorizar o rechazar, e historial.
export default async function PortalEmpresaPedidos() {
  const { supabase, empresa } = await getPortalEmpresa();
  if (!empresa) return null;
  const { data, error } = await supabase.rpc("club57_portal_pedidos");
  if (error) {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
        No se pudieron cargar los pedidos. Intenta de nuevo.
      </p>
    );
  }
  const pedidos = ((data ?? []) as Record<string, unknown>[]).map(mapPortalPedido);
  return <PedidosManager pedidos={pedidos} suspendida={empresa.estado === "suspendida"} />;
}
