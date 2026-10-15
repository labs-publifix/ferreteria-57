"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { ProductImagePlaceholder } from "@/components/ui";
import { formatPrice } from "@/lib/formatPrice";
import { isQueryWorthSearching, type SearchResultItem } from "@/lib/catalog/search";

const DEBOUNCE_MS = 200;

type Status = "idle" | "loading" | "results" | "empty" | "error";

// Campos «Producto» y «Código» de la compra en tienda (y de su corrección)
// con sugerencias del catálogo mientras se escribe: mismo endpoint y mismos
// resultados que el buscador del Header (/api/search → search_products,
// que busca por nombre, marca, categoría, clave o SKU). Siguen siendo texto
// libre: si lo vendido no está en la tienda en línea, se escribe a mano y
// listo. Elegir una sugerencia llama a onSelect y el formulario completa
// producto, código y monto de una vez.
export function ProductCatalogAutocomplete({
  id,
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  inputClassName,
  labelClassName,
  minChars = 2,
  listAlign = "left",
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: SearchResultItem) => void;
  /** Texto mínimo para buscar: 2 para nombres, 1 basta para una clave. */
  minChars?: number;
  /** Lado del campo al que se ancla la lista cuando es más ancha que él. */
  listAlign?: "left" | "right";
  placeholder?: string;
  inputClassName: string;
  labelClassName: string;
}) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  // El texto que se buscó por última vez por escribirlo la persona. Cuando
  // `value` cambia porque se eligió una sugerencia (o el formulario se
  // limpió), no se vuelve a buscar.
  const [searchTerm, setSearchTerm] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    const trimmed = searchTerm.trim();
    if (!isQueryWorthSearching(trimmed) || trimmed.length < minChars) {
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
  }, [searchTerm, minChars]);

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

  function choose(item: SearchResultItem) {
    onSelect(item);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (status !== "results") return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      if (status !== "results") return;
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      // Enter con una sugerencia marcada la elige; sin sugerencia marcada,
      // deja pasar el submit normal del formulario.
      if (open && activeIndex >= 0 && activeIndex < results.length) {
        event.preventDefault();
        choose(results[activeIndex]);
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
      }
    }
  }

  const showList = open && status !== "idle";

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={inputId} className={labelClassName}>
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={showList && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setSearchTerm(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (status === "results" || status === "empty") setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={inputClassName}
      />

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Productos del catálogo"
          // Más ancha que un campo angosto (Código) para que quepan nombre y
          // precio, sin salirse de la pantalla en celular.
          className={`absolute z-20 mt-1 max-h-72 w-[min(26rem,calc(100vw-2rem))] min-w-full overflow-y-auto rounded-md border border-brand-slate/15 bg-brand-white shadow-lg ${
            listAlign === "right" ? "right-0" : "left-0"
          }`}
        >
          {status === "loading" && (
            <li className="px-4 py-3 font-sans text-sm text-brand-slate/70">Buscando en el catálogo…</li>
          )}
          {status === "error" && (
            <li className="px-4 py-3 font-sans text-sm text-brand-slate/70">
              No se pudo consultar el catálogo. Puedes escribir el producto a mano.
            </li>
          )}
          {status === "empty" && (
            <li className="px-4 py-3 font-sans text-sm text-brand-slate/70">
              No está en el catálogo en línea. Puedes escribirlo a mano.
            </li>
          )}
          {status === "results" &&
            results.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={item.id} id={`${listboxId}-${index}`} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      choose(item);
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
                        width={36}
                        height={36}
                        className="size-9 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <ProductImagePlaceholder className="size-9 shrink-0" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-sans text-sm text-brand-black">{item.name}</span>
                      <span className="block truncate font-sans text-xs text-brand-slate/70">
                        {item.brand}
                        {item.clave ? ` · Clave ${item.clave}` : item.sku ? ` · Cód. ${item.sku}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 font-sans text-sm font-semibold text-brand-black">
                      {formatPrice(item.price)}
                    </span>
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
