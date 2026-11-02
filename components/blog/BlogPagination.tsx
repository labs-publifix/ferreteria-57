import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listingPagePath, paginationItems } from "@/lib/blog/listing";

// Paginación de los listados del blog (/blog y /blog/categoria/…), con
// enlaces reales: cada página tiene su propia URL y canonical. Con muchas
// páginas muestra la primera, la última y las vecinas, con «…» en medio.
export function BlogPagination({ page, total, basePath = "/blog" }: { page: number; total: number; basePath?: string }) {
  if (total <= 1) return null;
  const base =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 font-sans text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black";
  return (
    <nav aria-label="Páginas del blog" className="mt-12 flex flex-wrap items-center justify-center gap-1">
      {page > 1 && (
        <Link href={listingPagePath(basePath, page - 1)} rel="prev" className={`${base} gap-1 text-brand-slate hover:bg-white`}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Anterior
        </Link>
      )}
      <ul className="flex items-center gap-1">
        {paginationItems(page, total).map((item, i) =>
          item === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="min-w-8 text-center font-sans text-sm text-brand-slate">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={listingPagePath(basePath, item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Página ${item}`}
                className={`${base} tabular-nums ${item === page ? "bg-brand-slate text-white" : "text-brand-slate hover:bg-white"}`}
              >
                {item}
              </Link>
            </li>
          )
        )}
      </ul>
      {page < total && (
        <Link href={listingPagePath(basePath, page + 1)} rel="next" className={`${base} gap-1 text-brand-slate hover:bg-white`}>
          Siguiente
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
