import Link from "next/link";
import type { BlogCluster } from "@/content/blog/clusters";

// Chips de categoría: enlaces normales (rastreables) a /blog/categoria/...
export function CategoryChips({ clusters, active }: { clusters: BlogCluster[]; active?: string }) {
  const chip = (current: boolean) =>
    `inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-4 font-sans text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:ring-offset-brand-gray ${
      current ? "bg-brand-slate text-white" : "bg-white text-brand-slate ring-1 ring-brand-slate/20 hover:bg-brand-slate/10"
    }`;
  return (
    <nav aria-label="Categorías del blog" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-2 py-1 sm:min-w-0 sm:flex-wrap">
        <li>
          <Link href="/blog" aria-current={active ? undefined : "page"} className={chip(!active)}>
            Todos
          </Link>
        </li>
        {clusters.map((cluster) => (
          <li key={cluster.slug}>
            <Link
              href={`/blog/categoria/${cluster.slug}`}
              aria-current={active === cluster.slug ? "page" : undefined}
              className={chip(active === cluster.slug)}
            >
              {cluster.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
