import { AlertTriangle, Clock, PieChart, Table2, TrendingUp, Truck, Wallet, type LucideIcon } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { SalesDateRangeSelector } from "./SalesDateRangeSelector";
import { formatPrice } from "@/lib/formatPrice";
import { ALL_ORDER_STATUSES, ORDER_STATUS_BADGE_CLASS, ORDER_STATUS_LABEL } from "@/lib/orders/status";
import type { OrderMetrics } from "@/lib/admin/dashboardMetrics";

const RESERVED_MESSAGE = "Se activa cuando haya suficiente historial de pedidos para graficarlo.";

// Tratamiento visual para lo que todavía no tiene datos reales detrás
// (gráfica de ingresos por periodo, top de productos) — borde punteado en
// vez de sólido, para que a simple vista se lea distinto de una tarjeta
// con datos reales. Los 3 pedidos/estatus de arriba SÍ son reales desde
// que existe el módulo de Pedidos — solo esto de abajo sigue pendiente
// (necesita una librería de gráficas + agregación por producto, fuera del
// alcance de esta pasada).
function ReservedNote({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-center gap-1.5 font-sans text-xs text-brand-slate/60 ${className}`}>
      <Clock className="size-3.5 shrink-0" aria-hidden="true" />
      {RESERVED_MESSAGE}
    </p>
  );
}

function LineChartDecoration() {
  return (
    <svg
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      className="absolute inset-0 size-full text-brand-slate/10"
      aria-hidden="true"
    >
      <polyline
        points="0,80 25,68 50,72 75,45 100,55 125,25 150,35 175,15 200,22"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReservedChartPanel({
  title,
  icon: Icon,
  decoration,
  headerExtra,
}: {
  title: string;
  icon: LucideIcon;
  decoration: React.ReactNode;
  /** Control real ya funcional que vive aquí a la espera de la gráfica
   *  real (ver SalesDateRangeSelector) — para no dejarlo huérfano ni
   *  fingir que ya filtra algo que todavía no existe. */
  headerExtra?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border-2 border-dashed border-brand-slate/20 bg-white/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="size-5 text-brand-slate/50" aria-hidden="true" strokeWidth={1.75} />
          <p className="font-sans text-sm font-semibold text-brand-black">{title}</p>
        </div>
        {headerExtra}
      </div>
      <div className="relative mt-4 flex h-48 flex-1 items-center justify-center overflow-hidden rounded-md bg-brand-gray/60">
        {decoration}
        <div className="relative z-10 flex flex-col items-center gap-1.5 px-4 text-center">
          <Clock className="size-5 text-brand-slate/40" aria-hidden="true" />
          <p className="font-sans text-xs text-brand-slate/60">{RESERVED_MESSAGE}</p>
        </div>
      </div>
    </div>
  );
}

// Filas fantasma (barras translúcidas, sin texto/números inventados) para
// sugerir la forma de una tabla real, cubiertas por un mensaje central —
// mismo patrón que un contenido "bloqueado hasta activar X" de cualquier
// producto SaaS, no un simple "sin datos".
function ReservedTablePanel() {
  return (
    <div className="flex flex-col rounded-lg border-2 border-dashed border-brand-slate/20 bg-white/60 p-5">
      <div className="flex items-center gap-2">
        <Table2 className="size-5 text-brand-slate/50" aria-hidden="true" strokeWidth={1.75} />
        <p className="font-sans text-sm font-semibold text-brand-black">Productos más vendidos</p>
      </div>
      <div className="relative mt-4 overflow-hidden rounded-md bg-brand-gray/60 p-4">
        <div className="flex flex-col gap-3 opacity-50" aria-hidden="true">
          {[70, 55, 40, 30].map((width, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="size-8 shrink-0 rounded bg-brand-slate/15" />
              <div className="h-2.5 flex-1 rounded-full bg-brand-slate/15" style={{ maxWidth: `${width}%` }} />
              <div className="h-2.5 w-12 shrink-0 rounded-full bg-brand-slate/15" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <ReservedNote className="rounded-full bg-white px-3 py-1.5 shadow-sm" />
        </div>
      </div>
    </div>
  );
}

// Desglose por estatus: lista simple con el mismo color que ya usa
// /admin/pedidos para cada badge (ver lib/orders/status.ts) — un vistazo
// rápido sin necesitar una librería de gráficas para algo que es, en el
// fondo, 7 conteos.
function StatusBreakdown({ byStatus }: { byStatus: OrderMetrics["byStatus"] }) {
  const total = ALL_ORDER_STATUSES.reduce((sum, status) => sum + byStatus[status], 0);

  return (
    <div className="flex h-full flex-col rounded-lg bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <PieChart className="size-5 text-brand-slate/50" aria-hidden="true" strokeWidth={1.75} />
        <p className="font-sans text-sm font-semibold text-brand-black">Pedidos por estatus</p>
      </div>
      {total === 0 ? (
        <p className="mt-4 font-sans text-sm text-brand-slate/60">Todavía no hay pedidos.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {ALL_ORDER_STATUSES.map((status) => {
            const count = byStatus[status];
            const badgeClass = ORDER_STATUS_BADGE_CLASS[status].split(" ")[0]; // solo el bg-*
            return (
              <li key={status} className="flex items-center justify-between gap-3 font-sans text-sm">
                <span className="flex items-center gap-2 text-brand-slate">
                  <span className={`size-2.5 shrink-0 rounded-full ${badgeClass}`} aria-hidden="true" />
                  {ORDER_STATUS_LABEL[status]}
                </span>
                <span className="font-semibold text-brand-black">{count}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Layout de la sección de pedidos del dashboard de Inicio: las 3 tarjetas
// y el desglose por estatus ya son reales (el módulo de Pedidos existe);
// la gráfica de ingresos por periodo y el top de productos siguen
// reservados — necesitan una librería de gráficas y una agregación por
// producto que todavía no se construyó, ver nota en cada panel.
export function OrdersDashboardSection({ orders }: { orders: OrderMetrics }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg uppercase text-brand-slate">Ventas y pedidos</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={AlertTriangle}
          value={String(orders.needsAttention)}
          label="Pedidos que requieren tu atención"
          caption="Pagados, todavía sin empezar a preparar"
          href="/admin/pedidos?estatus=pagado"
          linkLabel="Ver pedidos pagados"
        />
        <MetricCard
          icon={Truck}
          value={String(orders.inProgress)}
          label="Pedidos en curso"
          caption="Preparando, listos o enviados"
        />
        <MetricCard icon={Wallet} value={formatPrice(orders.totalRevenue)} label="Ingresos totales" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReservedChartPanel
            title="Ingresos en el periodo"
            icon={TrendingUp}
            decoration={<LineChartDecoration />}
            headerExtra={<SalesDateRangeSelector />}
          />
        </div>
        <StatusBreakdown byStatus={orders.byStatus} />
      </div>

      <ReservedTablePanel />
    </section>
  );
}
