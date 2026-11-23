import { NominaManager } from "@/components/empresa/NominaManager";
import { getPortalEmpresa } from "@/lib/club57/empresas/portal";
import { agruparNominas, mapPortalDescuento } from "@/lib/club57/empresas/nomina";
import { nominaLabel } from "@/lib/club57/empresas/datos";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";

// Portal Empresa · Nómina: descuentos por fecha de pago, confirmación e historial.
export default async function PortalEmpresaNomina() {
  const { supabase, empresa } = await getPortalEmpresa();
  if (!empresa) return null;
  const { data, error } = await supabase.rpc("club57_portal_descuentos");
  if (error) {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
        No se pudo cargar la nómina. Intenta de nuevo.
      </p>
    );
  }
  const nominas = agruparNominas(((data ?? []) as Record<string, unknown>[]).map(mapPortalDescuento), todayInStoreTimezone());
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-prose font-sans text-sm text-brand-slate">
        Cada compra autorizada se reparte en {empresa.descuentos_por_compra}{" "}
        {empresa.descuentos_por_compra === 1 ? "descuento" : "descuentos"} de nómina, en las fechas de pago de cada colaborador (la de tu
        empresa es {nominaLabel(empresa.nomina_frecuencia, empresa.nomina_dia_semana, empresa.nomina_dia_mes).toLowerCase()}).
        Al confirmar cada nómina, el crédito de tus colaboradores se libera por lo que se descontó.
      </p>
      <NominaManager nominas={nominas} />
    </div>
  );
}
