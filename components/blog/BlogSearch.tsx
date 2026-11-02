"use client";

import { useId, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { normalizeText } from "@/lib/normalizeText";
import type { BlogCardData } from "@/lib/blog/card";
import { BlogCardGrid } from "./BlogCard";

// Buscador del blog: filtra en el cliente por título, keyword y categoría
// sobre TODOS los artículos visibles (no solo la página actual) y no
// genera URLs. Sin texto, muestra el contenido normal de la página
// (`children`, pintado en el servidor).
export function BlogSearch({
  cards,
  intro,
  children,
}: {
  cards: BlogCardData[];
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  const inputId = useId();
  const statusId = useId();
  const [query, setQuery] = useState("");
  const q = normalizeText(query);

  const results = useMemo(() => {
    if (!q) return [];
    const terms = q.split(/\s+/);
    return cards.filter((card) => {
      const haystack = normalizeText(`${card.title} ${card.keyword} ${card.clusterNombre}`);
      return terms.every((term) => haystack.includes(term));
    });
  }, [cards, q]);

  return (
    <>
      <div className="border-b border-brand-slate/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="min-w-0 lg:max-w-2xl">{intro}</div>
          <div role="search" className="block w-full sm:max-w-md lg:w-96 lg:shrink-0">
            <label htmlFor={inputId} className="sr-only">
              Buscar en el blog
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand-slate"
                aria-hidden="true"
              />
              <input
                id={inputId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar: brocas, tubería, pintura…"
                maxLength={80}
                aria-describedby={statusId}
                className="min-h-12 w-full rounded-full border border-brand-slate/25 bg-white py-3 pl-12 pr-12 font-sans text-base text-brand-black shadow-sm placeholder:text-brand-slate/75 focus-visible:border-brand-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Borrar búsqueda"
                  className="absolute right-1.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <p id={statusId} aria-live="polite" className="sr-only">
              {q ? `${results.length} ${results.length === 1 ? "artículo encontrado" : "artículos encontrados"}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {q ? (
          <section aria-labelledby={`${inputId}-resultados`} className="mt-10">
            <h2
              id={`${inputId}-resultados`}
              className="mb-5 font-display text-lg uppercase text-brand-slate sm:text-xl"
            >
              {results.length === 0 ? "Sin resultados" : `Resultados (${results.length})`}
            </h2>
            {results.length > 0 ? (
              <BlogCardGrid cards={results} />
            ) : (
              <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-brand-slate/10">
                <p className="font-sans text-base text-brand-black">No encontramos artículos con «{query.trim()}».</p>
                <p className="mt-1 font-sans text-sm text-brand-slate">
                  Prueba con otra palabra, como «broca» o «pintura».
                </p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-4 inline-flex min-h-11 items-center rounded-full px-4 font-sans text-sm font-semibold text-brand-black underline underline-offset-4 hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                >
                  Ver todos los artículos
                </button>
              </div>
            )}
          </section>
        ) : (
          children
        )}
      </div>
    </>
  );
}
