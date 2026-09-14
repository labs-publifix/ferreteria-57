import type { Metadata } from "next";
import { Boxes, CheckCircle2, FolderTree, ImageOff, PackageX, Star, Users } from "lucide-react";
import { MetricCard } from "@/components/admin/dashboard/MetricCard";
import { QuickActions } from "@/components/admin/dashboard/QuickActions";
import { SalesReservedSection } from "@/components/admin/dashboard/SalesReservedSection";
import { LOW_STOCK_THRESHOLD } from "@/lib/catalog/stockThresholds";
import { getDashboardMetrics, type DashboardMetrics } from "@/lib/admin/dashboardMetrics";
import { getAdminProfile } from "@/lib/supabase/adminProfile";

export const metadata: Metadata = { title: "Inicio — Panel de administración" };

export default async function AdminHomePage() {
  const admin = await getAdminProfile();
  const displayName = admin?.fullName?.trim() || admin?.email || "";

  let metrics: DashboardMetrics | null = null;
  let loadError: string | null = null;
  try {
    metrics = await getDashboardMetrics();
  } catch (err) {
    loadError = `No se pudieron cargar las métricas: ${err instanceof Error ? err.message : "error desconocido"}`;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">
          Bienvenido{displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
          Resumen del catálogo y la actividad de la tienda. Las ventas y pedidos se activan más
          abajo en cuanto ese módulo esté conectado.
        </p>
      </div>

      {loadError ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {loadError}
        </p>
      ) : (
        metrics && (
          <>
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-lg uppercase text-brand-slate">Salud del catálogo</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={Boxes}
                  value={`${metrics.products.active} / ${metrics.products.total}`}
                  label="Productos activos / total"
                />
                <MetricCard
                  icon={ImageOff}
                  value={String(metrics.products.withoutImage)}
                  label="Productos sin imagen"
                  href="/admin/productos?sinImagen=1"
                  linkLabel="Ver productos sin imagen"
                />
                <MetricCard
                  icon={FolderTree}
                  value={`${metrics.categories.active} / ${metrics.categories.total}`}
                  label="Categorías activas / total"
                />
                <MetricCard
                  icon={PackageX}
                  value={String(metrics.products.lowStock)}
                  label={`Stock bajo o agotado (≤${LOW_STOCK_THRESHOLD})`}
                  href="/admin/productos?stockBajo=1"
                  linkLabel="Ver productos con stock bajo"
                />
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-display text-lg uppercase text-brand-slate">
                Actividad y engagement
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard icon={Users} value={String(metrics.customers)} label="Clientes registrados" />
                <MetricCard
                  icon={Star}
                  value={String(metrics.pendingReviews)}
                  label="Reseñas pendientes de aprobación"
                  href="/admin/resenas?estado=pending"
                  linkLabel="Ver reseñas pendientes"
                />
                <MetricCard
                  icon={CheckCircle2}
                  value={String(metrics.products.recentlyActivated)}
                  label="Productos activados en los últimos 7 días"
                />
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-display text-lg uppercase text-brand-slate">Accesos rápidos</h2>
              <QuickActions />
            </section>
          </>
        )
      )}

      <SalesReservedSection />
    </div>
  );
}
