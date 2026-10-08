import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const linkBase =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-3 font-sans text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";

// Paginación del backlog: enlaces GET con ?pagina=N; el resto de los filtros
// viaja intacto en la URL (buildHref decide la query completa).
export function BlogPagination({
  pagina,
  totalPaginas,
  buildHref,
}: {
  pagina: number;
  totalPaginas: number;
  buildHref: (pagina: number) => string;
}) {
  if (totalPaginas <= 1) return null;
  const esPrimera = pagina <= 1;
  const esUltima = pagina >= totalPaginas;
  const disabled = "pointer-events-none opacity-40";

  return (
    <nav aria-label="Paginación de temas del blog" className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-2 shadow-sm sm:px-3">
      <Link
        href={buildHref(pagina - 1)}
        aria-disabled={esPrimera}
        tabIndex={esPrimera ? -1 : undefined}
        className={`${linkBase} text-brand-slate hover:bg-brand-gray ${esPrimera ? disabled : ""}`}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Anterior</span>
        <span className="sr-only sm:hidden">Página anterior</span>
      </Link>

      <ol className="flex items-center gap-1">
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <Link
              href={buildHref(n)}
              aria-current={n === pagina ? "page" : undefined}
              aria-label={`Página ${n}`}
              className={`${linkBase} tabular-nums ${n === pagina ? "bg-brand-slate text-white" : "text-brand-slate hover:bg-brand-gray"}`}
            >
              {n}
            </Link>
          </li>
        ))}
      </ol>

      <Link
        href={buildHref(pagina + 1)}
        aria-disabled={esUltima}
        tabIndex={esUltima ? -1 : undefined}
        className={`${linkBase} text-brand-slate hover:bg-brand-gray ${esUltima ? disabled : ""}`}
      >
        <span className="hidden sm:inline">Siguiente</span>
        <span className="sr-only sm:hidden">Página siguiente</span>
        <ChevronRight className="size-4" aria-hidden="true" />
      </Link>
    </nav>
  );
}
