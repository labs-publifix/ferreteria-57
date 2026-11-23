import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { PortalNav } from "@/components/empresa/PortalNav";
import { buttonClassName } from "@/components/ui";
import { getPortalEmpresa } from "@/lib/club57/empresas/portal";
import { agruparNominas, mapPortalDescuento } from "@/lib/club57/empresas/nomina";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";
import { NO_INDEX_NO_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Portal Empresa — Club 57 Empresarial", robots: NO_INDEX_NO_FOLLOW };
export const dynamic = "force-dynamic";

// Portal Empresa: solo el responsable de una empresa activa o suspendida.
// Cada acción vuelve a validarlo en la base.
export default async function PortalEmpresaLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, empresa } = await getPortalEmpresa();
  if (!user) redirect("/cuenta?next=/empresa");

  if (!empresa) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Building2 className="size-10 text-brand-orange" aria-hidden="true" strokeWidth={1.5} />
        <h1 className="font-display text-2xl uppercase text-brand-slate">Portal Empresa</h1>
        <p className="font-sans text-sm text-brand-slate sm:text-base">
          Tu cuenta no administra ninguna empresa de Club 57 Empresarial. Si eres el responsable del programa en tu empresa,
          entra con el correo que registraste en el convenio.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/cuenta" className={buttonClassName("secondary")}>
            Ir a Mi cuenta
          </Link>
          <Link href="/club57/empresarial" className={buttonClassName("primary")}>
            Conocer el programa
          </Link>
        </div>
      </main>
    );
  }

  const [{ data: empleados }, { data: pedidos }, { data: descuentos }] = await Promise.all([
    supabase.rpc("club57_portal_empleados"),
    supabase.rpc("club57_portal_pedidos"),
    supabase.rpc("club57_portal_descuentos"),
  ]);
  const nominasPorConfirmar = agruparNominas(
    ((descuentos ?? []) as Record<string, unknown>[]).map(mapPortalDescuento),
    todayInStoreTimezone()
  ).porConfirmar.length;
  const pendientes = ((empleados ?? []) as { estado: string }[]).filter((e) => e.estado === "pendiente").length;
  const pedidosPendientes = ((pedidos ?? []) as { status: string }[]).filter((p) => p.status === "pendiente_autorizacion").length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
      <div className="flex flex-col gap-1">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">Portal Empresa · Club 57 Empresarial</p>
        <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">{empresa.nombre_comercial}</h1>
      </div>
      {empresa.estado === "suspendida" && (
        <p role="status" className="mt-4 rounded-md border-l-4 border-red-600 bg-red-50 px-4 py-3 font-sans text-sm text-red-800">
          Las compras con cargo a tu empresa están suspendidas
          {empresa.motivo_estado ? `: ${empresa.motivo_estado}` : ""}. Escríbenos para reactivarlas.
        </p>
      )}
      <div className="mt-6">
        <PortalNav pendientes={pendientes} pedidosPendientes={pedidosPendientes} nominasPorConfirmar={nominasPorConfirmar} />
      </div>
      <div className="mt-6">{children}</div>
    </main>
  );
}
