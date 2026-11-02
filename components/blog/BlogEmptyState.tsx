import Link from "next/link";
import { FileText } from "lucide-react";

// Blog sin artículos publicados todavía.
export function BlogEmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-brand-slate/10">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-gray text-brand-slate" aria-hidden="true">
        <FileText className="size-7" strokeWidth={1.75} />
      </span>
      <h2 className="mt-5 font-display text-xl uppercase text-brand-slate">Muy pronto, las primeras guías</h2>
      <p className="mt-2 max-w-[48ch] font-sans text-base text-brand-black/75">
        Estamos preparando guías prácticas de ferretería para tu casa y tu negocio. Mientras tanto, conoce Club 57 o
        visita nuestro catálogo.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/cuenta"
          className="inline-flex min-h-11 items-center rounded-full bg-brand-orange px-5 font-sans text-sm font-semibold text-brand-black hover:bg-[#E65C00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2"
        >
          Conoce Club 57
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full px-5 font-sans text-sm font-semibold text-brand-black ring-1 ring-brand-slate/25 hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        >
          Ir a la tienda
        </Link>
      </div>
    </div>
  );
}
