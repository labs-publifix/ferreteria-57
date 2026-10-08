import { FileText } from "lucide-react";
import type { TopicView } from "@/lib/blog/backlog-view";

const pill = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold";

/** Guía PDF del tema: disponible (con PDF válido) o pendiente. Solo lectura. */
export function GuiaEstadoBadge({ topic }: { topic: TopicView }) {
  return topic.guiaDisponible ? (
    <span className={`${pill} bg-green-100 text-green-900`}>Disponible</span>
  ) : (
    <span className={`${pill} bg-brand-slate/10 text-brand-slate`}>Pendiente</span>
  );
}

/** El mismo PDF que descarga un miembro, en una pestaña nueva, aunque el artículo no esté publicado. */
export function VerGuia({ topic, className }: { topic: TopicView; className: string }) {
  if (!topic.guiaDisponible || !topic.slug) return null;
  return (
    <a
      href={`/admin/blog/guias/${topic.slug}/vista-previa`}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} whitespace-nowrap text-brand-black underline-offset-2 hover:underline`}
    >
      <FileText className="size-4" aria-hidden="true" />
      Ver guía
      <span className="sr-only"> de {topic.id} (PDF, se abre en otra pestaña)</span>
    </a>
  );
}

export function descargasLabel(descargas: number | undefined): string {
  const total = descargas ?? 0;
  return total === 1 ? "1 descarga" : `${total} descargas`;
}
