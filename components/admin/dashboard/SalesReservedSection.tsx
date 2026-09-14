import { AlertTriangle, Clock, PieChart, Table2, TrendingUp, Truck, Wallet, type LucideIcon } from "lucide-react";
import { SalesDateRangeSelector } from "./SalesDateRangeSelector";

const RESERVED_MESSAGE = "Se activa cuando el módulo de Pedidos esté conectado.";

// Tratamiento visual consistente para TODO lo reservado de este bloque —
// borde punteado (nunca sólido, para que a simple vista se lea distinto de
// una tarjeta con datos reales) + el mismo ícono de reloj + el mismo
// mensaje, sin importar si es una tarjeta chica, una gráfica o una tabla.
// La idea es que se sienta "todavía no", nunca "esto se rompió".
function ReservedNote({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-center gap-1.5 font-sans text-xs text-brand-slate/60 ${className}`}>
      <Clock className="size-3.5 shrink-0" aria-hidden="true" />
      {RESERVED_MESSAGE}
    </p>
  );
}

function ReservedMetricCard({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex flex-col rounded-lg border-2 border-dashed border-brand-slate/20 bg-white/60 p-5">
      <span className="flex size-10 items-center justify-center rounded-full bg-brand-slate/10 text-brand-slate/50">
        <Icon className="size-5" aria-hidden="true" strokeWidth={1.75} />
      </span>
      <p className="mt-3 font-sans text-sm font-semibold text-brand-black">{title}</p>
      <ReservedNote className="mt-2" />
    </div>
  );
}

function RevenueCardReserved() {
  return (
    <div className="flex flex-col rounded-lg border-2 border-dashed border-brand-slate/20 bg-white/60 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-sans text-sm font-semibold text-brand-black">Ingresos totales</p>
        <Wallet className="size-5 text-brand-slate/40" aria-hidden="true" strokeWidth={1.75} />
      </div>
      <div className="mt-3">
        <SalesDateRangeSelector />
      </div>
      <ReservedNote className="mt-3" />
    </div>
  );
}

// Silueta decorativa (aria-hidden, sin datos) de una gráfica de línea —
// solo para que el espacio se lea como "aquí va una gráfica de ingresos",
// no como un rectángulo vacío sin ninguna pista de qué va a vivir ahí.
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

// Misma idea que arriba, para la gráfica de dona de estatus de pedidos —
// pegada a una esquina (no centrada detrás del mensaje, a diferencia de la
// de línea): un anillo SÍ concéntrico con el mensaje se veía cortado por
// arriba y por abajo (el bloque de ícono + 2 líneas de texto es más alto
// que el hueco del donut a este tamaño), leyéndose como dos paréntesis
// sueltos en vez de un anillo — en una esquina no compite con el mensaje.
function DonutChartDecoration() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute bottom-2 right-2 size-16 text-brand-slate/10"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="16" />
    </svg>
  );
}

function ReservedChartPanel({
  title,
  icon: Icon,
  decoration,
}: {
  title: string;
  icon: LucideIcon;
  decoration: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border-2 border-dashed border-brand-slate/20 bg-white/60 p-5">
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-brand-slate/50" aria-hidden="true" strokeWidth={1.75} />
        <p className="font-sans text-sm font-semibold text-brand-black">{title}</p>
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
          <p className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-sans text-xs text-brand-slate/70 shadow-sm">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            {RESERVED_MESSAGE}
          </p>
        </div>
      </div>
    </div>
  );
}

// Layout FINAL de la sección (mismo grid/tamaño de tarjetas que tendrá con
// datos reales) — cuando el módulo de Pedidos exista, cada pieza reservada
// se reemplaza por su versión con datos sin tocar esta estructura.
export function SalesReservedSection() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg uppercase text-brand-slate">Ventas y pedidos</h2>
        <p className="mt-1 max-w-prose font-sans text-sm text-brand-slate/60">
          El diseño de esta sección ya está listo — se llena solo en cuanto el módulo de Pedidos
          quede conectado, sin que nada de aquí abajo cambie de lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReservedMetricCard icon={AlertTriangle} title="Pedidos que requieren tu atención" />
        <ReservedMetricCard icon={Truck} title="Pedidos en curso" />
        <RevenueCardReserved />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReservedChartPanel
            title="Ingresos en el periodo"
            icon={TrendingUp}
            decoration={<LineChartDecoration />}
          />
        </div>
        <ReservedChartPanel title="Pedidos por estatus" icon={PieChart} decoration={<DonutChartDecoration />} />
      </div>

      <ReservedTablePanel />
    </section>
  );
}
