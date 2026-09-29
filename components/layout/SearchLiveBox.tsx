"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductImagePlaceholder } from "@/components/ui";
import { formatPrice } from "@/lib/formatPrice";
import { buildSearchNotFoundWhatsAppUrl } from "@/lib/checkout/whatsapp";
import { isQueryWorthSearching, type SearchResultItem } from "@/lib/catalog/search";
import { SearchIcon } from "./header-icons";

const DEBOUNCE_MS = 200;

type Status = "idle" | "loading" | "results" | "empty" | "error";

// Patrón WAI-ARIA "combobox" (mismo rol/estructura que components/ui/Combobox.tsx:
// input + listbox emergente, flechas/Enter/Escape), pero para resultados
// remotos con miniatura/precio en vez de una lista local de opciones — por
// eso es un componente propio y no una reutilización forzada de ese otro.
export function SearchLiveBox({
  autoFocus = false,
  className = "",
  onNavigate,
}: {
  autoFocus?: boolean;
  className?: string;
  /** Se llama justo antes de navegar (Enter, click en un resultado, "Ver
   *  todos") — el Header lo usa para cerrar el panel de búsqueda móvil. */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const inputId = useId();
  const listboxId = useId();

  // "Ver todos los resultados" cuenta como una fila más de la lista
  // navegable con flechas — se arma junto con `results` para que
  // activeIndex pueda apuntarle igual que a cualquier producto.
  const showViewAll = status === "results" || status === "empty";
  const rowCount = results.length + (showViewAll ? 1 : 0);

  useEffect(() => {
    // Cancela la búsqueda en vuelo Y el debounce pendiente al escribir de
    // nuevo — sin esto, una respuesta lenta de una letra anterior podía
    // llegar después que la de la letra actual y pisar resultados más
    // nuevos con unos viejos ya obsoletos.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    const trimmed = query.trim();
    if (!isQueryWorthSearching(trimmed)) {
      setStatus("idle");
      setResults([]);
      setActiveIndex(-1);
      return;
    }

    setActiveIndex(-1);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`status ${response.status}`);
        const data = (await response.json()) as { results: SearchResultItem[] };
        setResults(data.results);
        setStatus(data.results.length > 0 ? "results" : "empty");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
        setResults([]);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const viewAllHref = useMemo(
    () => `/buscar?q=${encodeURIComponent(query.trim())}`,
    [query]
  );

  function goToProduct(item: SearchResultItem) {
    onNavigate?.();
    setOpen(false);
    router.push(`/producto/${item.slug}`);
  }

  function goToAllResults() {
    onNavigate?.();
    setOpen(false);
    router.push(viewAllHref);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    goToAllResults();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (rowCount > 0) setActiveIndex((index) => Math.min(index + 1, rowCount - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      if (open && activeIndex >= 0) {
        event.preventDefault();
        if (activeIndex < results.length) {
          goToProduct(results[activeIndex]);
        } else {
          goToAllResults();
        }
      }
      // activeIndex === -1: deja que el submit normal del <form> mande a
      // /buscar con lo que haya escrito, mismo comportamiento que
      // SearchForm.tsx de siempre.
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
      }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <form role="search" onSubmit={handleSubmit}>
        <label htmlFor={inputId} className="sr-only">
          Buscar productos
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
          }
          autoComplete="off"
          placeholder="Buscar productos..."
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full rounded-md border border-brand-slate/30 bg-brand-white py-2 pl-4 pr-11 font-sans text-sm text-brand-black placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-brand-slate hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        >
          <SearchIcon />
        </button>
      </form>

      {open && status !== "idle" && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Resultados de búsqueda"
          // w-[calc(100vw-2rem)] en móvil: el desplegable no puede
          // desbordar la pantalla a los lados (el input vive dentro de un
          // header con paddings), pero sí debe poder ser más ancho que un
          // input angosto en el header colapsado — right-0 lo ancla al
          // borde del input para que ese ancho crezca hacia la izquierda,
          // nunca fuera del viewport a la derecha. Desde sm: vuelve a
          // medir exactamente lo que mide el input (w-full).
          className="absolute right-0 z-20 mt-1 max-h-[70vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-md border border-brand-slate/15 bg-brand-white shadow-lg sm:w-full"
        >
          {status === "loading" && (
            <li className="px-4 py-3 font-sans text-sm text-brand-slate/70">Buscando...</li>
          )}

          {status === "error" && (
            <li className="px-4 py-3 font-sans text-sm text-red-600">
              No se pudo buscar en este momento. Intenta de nuevo.
            </li>
          )}

          {status === "empty" && (
            <li className="flex flex-col items-start gap-2 px-4 py-4">
              <p className="font-sans text-sm text-brand-black">
                No encontramos resultados para &quot;{query.trim()}&quot;. Revisa la ortografía o
                prueba con otro término.
              </p>
              <a
                href={buildSearchNotFoundWhatsAppUrl(query.trim())}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
              >
                ¿No lo encuentras? Pregúntanos por WhatsApp
              </a>
            </li>
          )}

          {status === "results" &&
            results.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  key={item.id}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={isActive}
                >
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      goToProduct(item);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left ${
                      isActive ? "bg-brand-gray" : ""
                    }`}
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <ProductImagePlaceholder className="size-10 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans text-sm text-brand-black">{item.name}</p>
                      <p className="truncate font-sans text-xs text-brand-slate/70">
                        {item.brand}
                        {item.clave ? ` · Clave ${item.clave}` : item.sku ? ` · Cód. ${item.sku}` : ""}
                        {!item.inStock && " · Agotado"}
                      </p>
                    </div>
                    <p className="shrink-0 font-sans text-sm font-semibold text-brand-black">
                      {formatPrice(item.price)}
                    </p>
                  </button>
                </li>
              );
            })}

          {showViewAll && (
            <li
              id={`${listboxId}-${results.length}`}
              role="option"
              aria-selected={activeIndex === results.length}
            >
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  goToAllResults();
                }}
                onMouseEnter={() => setActiveIndex(results.length)}
                className={`flex min-h-11 w-full items-center justify-center border-t border-brand-slate/10 px-3 font-sans text-sm font-semibold text-brand-slate hover:text-brand-black ${
                  activeIndex === results.length ? "bg-brand-gray" : ""
                }`}
              >
                Ver todos los resultados
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
