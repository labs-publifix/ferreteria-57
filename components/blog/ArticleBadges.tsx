import { Clock, FileText } from "lucide-react";
import type { ClusterTema } from "@/content/blog/clusters";
import { CLUSTER_THEME } from "@/lib/blog/theme";

// Píldoras del bloque de color: ARTÍCULO · INCLUYE PDF · N MIN DE LECTURA.
export function ArticleBadges({ tema, readingMinutes, className = "" }: { tema: ClusterTema; readingMinutes: number; className?: string }) {
  const pill = `inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-[11px] font-semibold uppercase leading-none tracking-[0.08em] ${CLUSTER_THEME[tema].pill}`;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      <li className={pill}>Artículo</li>
      <li className={pill}>
        <FileText className="size-3.5" strokeWidth={2} aria-hidden="true" />
        Incluye PDF
      </li>
      <li className={pill}>
        <Clock className="size-3.5" strokeWidth={2} aria-hidden="true" />
        {readingMinutes} min de lectura
      </li>
    </ul>
  );
}
