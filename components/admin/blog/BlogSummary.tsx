import Link from "next/link";
import type { BacklogResumen } from "@/lib/blog/backlog-view";
import { FechaProgramada } from "./FechaProgramada";
import { TopicEstadoBadge } from "./TopicEstadoBadge";

const TARJETAS = [
  { estado: "publicado", label: "Publicados" },
  { estado: "programado", label: "Programados" },
  { estado: "pendiente", label: "Pendientes" },
  { estado: "descartado", label: "Descartados" },
] as const;

export function BlogSummary({ resumen }: { resumen: BacklogResumen }) {
  const { siguiente } = resumen;
  return (
    <section aria-label="Resumen del backlog" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,2fr)]">
      {TARJETAS.map((t) => (
        <Link
          key={t.estado}
          href={`/admin/blog?estado=${t.estado}`}
          className="flex flex-col gap-1 rounded-lg bg-white p-4 shadow-sm transition-colors hover:bg-brand-gray/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        >
          <span className="font-sans text-sm font-medium text-brand-slate">{t.label}</span>
          <span className="font-display text-2xl tabular-nums text-brand-black">{resumen.conteo[t.estado]}</span>
          {t.estado === "pendiente" && resumen.atrasados > 0 && (
            <span className="font-sans text-xs font-semibold text-red-700">{resumen.atrasados} {resumen.atrasados === 1 ? "atrasado" : "atrasados"}</span>
          )}
        </Link>
      ))}
      <div className="col-span-2 flex flex-col gap-1.5 rounded-lg border-2 border-brand-orange bg-white p-4 shadow-sm md:col-span-4 xl:col-span-1">
        <span className="font-sans text-sm font-medium text-brand-slate">Siguiente a publicar</span>
        {siguiente ? (
          <>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-display text-sm text-brand-black">{siguiente.id}</span>
              <FechaProgramada fecha={siguiente.fecha_programada} inline />
              {siguiente.atrasado && <TopicEstadoBadge estado={siguiente.estado} atrasado />}
            </div>
            <p className="font-sans text-sm font-semibold leading-snug text-brand-black">{siguiente.titulo}</p>
          </>
        ) : (
          <p className="font-sans text-sm text-brand-slate">No hay temas pendientes con fecha.</p>
        )}
      </div>
    </section>
  );
}
