import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  name: string;
  path?: string;
}

// Ruta de navegación visible (la misma que va en el JSON-LD BreadcrumbList).
export function BlogBreadcrumbs({ items, tone = "default" }: { items: Crumb[]; tone?: "default" | "muted" }) {
  return (
    <nav aria-label="Ruta de navegación" className="font-sans text-sm">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {item.path && !last ? (
                <Link
                  href={item.path}
                  className="rounded text-brand-slate underline-offset-4 hover:text-brand-black hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                >
                  {item.name}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={`${tone === "muted" ? "text-brand-slate" : "text-brand-black"} line-clamp-1`}>
                  {item.name}
                </span>
              )}
              {!last && <ChevronRight className="size-3.5 shrink-0 text-brand-slate/70" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
