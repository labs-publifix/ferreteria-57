"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Select } from "@/components/ui";
import type { BacklogFiltros, EstadoFiltro } from "@/lib/blog/backlog-view";

const TABS: { estado: EstadoFiltro; label: string }[] = [
  { estado: "todos", label: "Todos" },
  { estado: "pendiente", label: "Pendientes" },
  { estado: "programado", label: "Programados" },
  { estado: "publicado", label: "Publicados" },
  { estado: "descartado", label: "Descartados" },
];

// Filtros del backlog: viven en la URL (?estado=&cluster=&q=) para poder
// compartir la vista. Las pestañas son enlaces; clúster y búsqueda
// reemplazan la URL sin recargar (la búsqueda con una pausa de 300 ms).
export function BlogFilters({
  filtros,
  clusters,
  conteoPorEstado,
}: {
  filtros: BacklogFiltros;
  clusters: string[];
  conteoPorEstado: Record<EstadoFiltro, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchId = useId();
  const [q, setQ] = useState(filtros.q);
  const [isPending, startTransition] = useTransition();
  const firstRender = useRef(true);

  function hrefCon(cambios: Partial<Record<"estado" | "cluster" | "q", string>>): string {
    const params = new URLSearchParams(searchParams.toString());
    // Cualquier cambio de filtro regresa a la primera página.
    params.delete("pagina");
    for (const [key, value] of Object.entries(cambios)) {
      if (!value || (key === "estado" && value === "todos")) params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function navegar(cambios: Partial<Record<"estado" | "cluster" | "q", string>>) {
    startTransition(() => router.replace(hrefCon(cambios), { scroll: false }));
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (q.trim() === filtros.q) return;
    const timer = window.setTimeout(() => navegar({ q: q.trim() }), 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hayFiltros = filtros.estado !== "todos" || filtros.cluster !== "" || filtros.q !== "";

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-white p-3 shadow-sm sm:p-4" aria-busy={isPending}>
      <nav aria-label="Filtrar por estado" className="-mx-1 overflow-x-auto">
        <ul className="flex min-w-max gap-1 px-1">
          {TABS.map((tab) => {
            const activo = filtros.estado === tab.estado;
            return (
              <li key={tab.estado}>
                <Link
                  href={hrefCon({ estado: tab.estado })}
                  scroll={false}
                  aria-current={activo ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 font-sans text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate ${
                    activo ? "bg-brand-slate text-white" : "text-brand-slate hover:bg-brand-gray"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${activo ? "bg-white/20 text-white" : "bg-brand-gray text-brand-slate"}`}
                  >
                    {conteoPorEstado[tab.estado]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor={searchId} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-slate" aria-hidden="true" />
            <input
              id={searchId}
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="ID, título o keyword"
              maxLength={100}
              className="min-h-11 w-full rounded-md border border-brand-slate/30 bg-white py-2 pl-9 pr-3 font-sans text-base text-brand-black placeholder:text-brand-slate/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:text-sm"
            />
          </div>
        </div>
        <div className="sm:w-72">
          <Select
            label="Clúster"
            value={filtros.cluster}
            onChange={(value) => navegar({ cluster: value })}
            options={[{ value: "", label: "Todos los clústeres" }, ...clusters.map((c) => ({ value: c, label: c }))]}
          />
        </div>
        {hayFiltros && (
          <Link
            href={pathname}
            scroll={false}
            onClick={() => setQ("")}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md px-3 font-sans text-sm font-medium text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          >
            <X className="size-4" aria-hidden="true" />
            Limpiar filtros
          </Link>
        )}
      </div>
    </div>
  );
}
