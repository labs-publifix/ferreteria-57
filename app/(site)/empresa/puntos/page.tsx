import { PuntosEmpresa, type CanjeEmpresa, type ItemCanje, type MovimientoPuntos } from "@/components/empresa/PuntosEmpresa";
import { getPortalEmpresa } from "@/lib/club57/empresas/portal";

// Portal Empresa · Puntos Club 57 de la empresa: los generan las compras con
// cargo a la empresa y solo se usan para canjear artículos del catálogo.
export default async function PortalEmpresaPuntos() {
  const { supabase, empresa } = await getPortalEmpresa();
  if (!empresa) return null;
  const [{ data, error }, { data: catalogo }] = await Promise.all([
    supabase.rpc("club57_portal_puntos"),
    supabase
      .from("club57_redemption_catalog")
      .select("id, nombre, descripcion, costo_puntos, stock, image_url")
      .eq("active", true)
      .order("costo_puntos", { ascending: true }),
  ]);
  if (error || !data) {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
        No se pudieron cargar los puntos de tu empresa. Intenta de nuevo.
      </p>
    );
  }
  const puntos = data as { disponible: number; pendiente: number; movimientos: MovimientoPuntos[]; canjes: CanjeEmpresa[] };
  return (
    <PuntosEmpresa
      disponible={Number(puntos.disponible)}
      pendiente={Number(puntos.pendiente)}
      movimientos={puntos.movimientos}
      canjes={puntos.canjes}
      catalogo={(catalogo ?? []) as ItemCanje[]}
      suspendida={empresa.estado === "suspendida"}
    />
  );
}
