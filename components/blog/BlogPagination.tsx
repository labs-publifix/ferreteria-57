import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { blogPagePath } from "@/lib/blog/seo";

// Paginación del listado del blog: /blog, /blog/pagina/2, ... con enlaces
// reales (cada página tiene su propio canonical).
export function BlogPagination({ page, total }: { page: number; total: number }) {
  if (total <= 1) return null;
  const base =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 font-sans text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black";
  return (
    <nav aria-label="Páginas del blog" className="mt-10 flex flex-wrap items-center justify-center gap-1">
      {page > 1 && (
        <Link href={blogPagePath(page - 1)} rel="prev" className={`${base} gap-1 text-brand-slate hover:bg-white`}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Anterior
        </Link>
      )}
      <ul className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <Link
              href={blogPagePath(n)}
              aria-current={n === page ? "page" : undefined}
              aria-label={`Página ${n}`}
              className={`${base} tabular-nums ${n === page ? "bg-brand-slate text-white" : "text-brand-slate hover:bg-white"}`}
            >
              {n}
            </Link>
          </li>
        ))}
      </ul>
      {page < total && (
        <Link href={blogPagePath(page + 1)} rel="next" className={`${base} gap-1 text-brand-slate hover:bg-white`}>
          Siguiente
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
