import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { buttonClassName } from "@/components/ui";
import {
  PROMO_ESTADO_BADGE_CLASS,
  PROMO_ESTADO_LABEL,
  formatRangoLegible,
  type PromoRango,
} from "@/lib/club57/promociones/vigencia";

export interface PromoPublishedSummary extends PromoRango {
  tipoLabel: string;
  titulo: string;
  estadoVisible: "programada" | "vigente";
}

// Paso 4 del asistente. Componente propio (no inline en el asistente) para
// que una fase posterior agregue aquí la pregunta del aviso por email a
// los miembros a través de `children`, sin tocar el resto del flujo.
export function PromoPublishedConfirmation({
  summary,
  listHref,
  children,
}: {
  summary: PromoPublishedSummary;
  listHref: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <CircleCheck className="size-12 text-green-700" aria-hidden="true" strokeWidth={1.5} />
      <div>
        <h2 className="font-display text-lg uppercase text-brand-slate sm:text-xl">Documento cargado con éxito</h2>
        <p className="mt-1 font-sans text-sm text-brand-slate">{summary.titulo}</p>
      </div>

      <dl className="grid w-full max-w-md grid-cols-1 gap-3 rounded-lg bg-brand-gray/60 p-4 text-left font-sans text-sm sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold text-brand-slate">Tipo</dt>
        <dd className="text-brand-black">{summary.tipoLabel}</dd>
        <dt className="font-semibold text-brand-slate">Vigencia</dt>
        <dd className="text-brand-black">{formatRangoLegible(summary)}</dd>
        <dt className="font-semibold text-brand-slate">Estado</dt>
        <dd>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${PROMO_ESTADO_BADGE_CLASS[summary.estadoVisible]}`}
          >
            {PROMO_ESTADO_LABEL[summary.estadoVisible]}
          </span>
        </dd>
      </dl>

      {children}

      <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href={listHref} className={buttonClassName("primary", "w-full sm:w-auto")}>
          Ver promociones de este tipo
        </Link>
        <Link href="/admin/lealtad/promociones" className={buttonClassName("secondary", "w-full sm:w-auto")}>
          Ir a Promociones
        </Link>
      </div>
    </div>
  );
}
