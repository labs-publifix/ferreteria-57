import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Solo si hay algo específico que aclarar además del label (ej. "de 53 en total"). */
  caption?: string;
  /** Si se pasa, la tarjeta completa se vuelve un link (mismo patrón de
   *  "link estirado" que ProductCard) a la vista ya filtrada correspondiente. */
  href?: string;
  linkLabel?: string;
}

// Una sola tarjeta de métrica, reusada en Salud del Catálogo y en
// Actividad y Engagement — mismo look sin importar si es un número plano
// (Clientes registrados) o uno con link a una vista filtrada (Sin imagen).
export function MetricCard({ icon: Icon, label, value, caption, href, linkLabel }: MetricCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="flex size-10 items-center justify-center rounded-full bg-brand-orange/10 text-brand-orange">
          <Icon className="size-5" aria-hidden="true" strokeWidth={1.75} />
        </span>
        {href && (
          <ArrowRight
            className="size-4 text-brand-slate/40 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-slate"
            aria-hidden="true"
          />
        )}
      </div>

      <p className="mt-3 font-display text-2xl text-brand-black">{value}</p>
      <p className="mt-1 font-sans text-sm text-brand-slate/70">{label}</p>
      {caption && <p className="mt-0.5 font-sans text-xs text-brand-slate/50">{caption}</p>}
      {href && linkLabel && (
        <p className="mt-2 font-sans text-xs font-semibold text-brand-slate group-hover:text-brand-black">
          {linkLabel}
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group flex flex-col rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
      >
        {content}
      </Link>
    );
  }

  return <div className="flex flex-col rounded-lg bg-white p-5 shadow-sm">{content}</div>;
}
