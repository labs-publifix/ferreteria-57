"use client";

import { useId } from "react";
import { FilterSection } from "./FilterSection";

export interface CategoryFiltersProps {
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  inStockOnly: boolean;
  onInStockOnlyChange: (value: boolean) => void;
  onReset: () => void;
}

// Contenido de filtros compartido por el sidebar de escritorio y el drawer
// de móvil (ver CategoryProductBrowser) — el mismo componente, sin chrome
// de overlay propio, así que solo vive una vez la lógica de cada control.
//
// Hoy son 2 secciones (precio y disponibilidad). El filtro de subcategoría
// que se agregará más adelante, una vez definida la taxonomía completa de
// Truper, es una tercera <FilterSection> aquí mismo — no requiere tocar el
// sidebar/drawer que lo envuelve.
export function CategoryFilters({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  inStockOnly,
  onInStockOnlyChange,
  onReset,
}: CategoryFiltersProps) {
  const stockCheckboxId = useId();

  return (
    <div>
      <FilterSection title="Precio">
        <div className="flex items-center gap-2">
          <label className="flex-1">
            <span className="sr-only">Precio mínimo</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Mín"
              value={minPrice}
              onChange={(event) => onMinPriceChange(event.target.value)}
              className="w-full rounded-md border border-brand-slate/30 px-3 py-2 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            />
          </label>
          <span className="text-brand-slate/50" aria-hidden="true">
            –
          </span>
          <label className="flex-1">
            <span className="sr-only">Precio máximo</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Máx"
              value={maxPrice}
              onChange={(event) => onMaxPriceChange(event.target.value)}
              className="w-full rounded-md border border-brand-slate/30 px-3 py-2 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            />
          </label>
        </div>
      </FilterSection>

      <FilterSection title="Disponibilidad">
        <label
          htmlFor={stockCheckboxId}
          className="flex min-h-11 items-center gap-2 font-sans text-sm text-brand-black"
        >
          <input
            id={stockCheckboxId}
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => onInStockOnlyChange(event.target.checked)}
            className="size-5 rounded border-brand-slate/40 accent-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          />
          Solo en stock
        </label>
      </FilterSection>

      <button
        type="button"
        onClick={onReset}
        className="mt-1 font-sans text-sm font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
