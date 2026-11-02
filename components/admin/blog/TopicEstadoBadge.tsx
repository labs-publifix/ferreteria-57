import type { TopicEstado } from "@/lib/blog/types";

export const TOPIC_ESTADO_LABEL: Record<TopicEstado, string> = {
  publicado: "Publicado",
  programado: "Programado",
  pendiente: "Pendiente",
  descartado: "Descartado",
};

const ESTADO_CLASS: Record<TopicEstado, string> = {
  publicado: "bg-green-100 text-green-900",
  programado: "bg-sky-100 text-sky-900",
  pendiente: "bg-brand-slate/10 text-brand-slate",
  descartado: "bg-neutral-100 text-neutral-600",
};

const pill = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold";

// Estado del tema + "Atrasado" (solo en pendientes con fecha vencida).
export function TopicEstadoBadge({ estado, atrasado }: { estado: TopicEstado; atrasado: boolean }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <span className={`${pill} ${ESTADO_CLASS[estado]}`}>{TOPIC_ESTADO_LABEL[estado]}</span>
      {atrasado && <span className={`${pill} bg-red-100 text-red-800`}>Atrasado</span>}
    </span>
  );
}
