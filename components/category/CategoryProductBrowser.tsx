"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { buttonClassName } from "@/components/ui";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CategoryFilters } from "./CategoryFilters";
import type { Product } from "@/types/catalog";

type SortOption = "relevancia" | "precio-asc" | "precio-desc";

// Recibe los productos YA filtrados por categoría (desde el Server
// Component de la página): este componente solo aplica precio/stock/orden
// en memoria sobre ese arreglo, sin volver a tocar la fuente de datos.
export function CategoryProductBrowser({ products }: { products: Product[] }) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevancia");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const sortId = useId();
  const drawerId = useId();

  // Mismo mecanismo de cierre con Escape que el menú móvil del Header.
  useEffect(() => {
    if (!mobileFiltersOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileFiltersOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileFiltersOpen]);

  function resetFilters() {
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
  }

  const visibleProducts = useMemo(() => {
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    const filtered = products.filter((product) => {
      const variant = product.variants[0];
      const price = variant?.price ?? 0;
      const stock = variant?.stock ?? 0;
      if (min !== null && !Number.isNaN(min) && price < min) return false;
      if (max !== null && !Number.isNaN(max) && price > max) return false;
      if (inStockOnly && stock <= 0) return false;
      return true;
    });

    if (sort === "precio-asc") {
      return [...filtered].sort(
        (a, b) => (a.variants[0]?.price ?? 0) - (b.variants[0]?.price ?? 0)
      );
    }
    if (sort === "precio-desc") {
      return [...filtered].sort(
        (a, b) => (b.variants[0]?.price ?? 0) - (a.variants[0]?.price ?? 0)
      );
    }
    return filtered;
  }, [products, minPrice, maxPrice, inStockOnly, sort]);

  const filtersActive = minPrice !== "" || maxPrice !== "" || inStockOnly;

  const filtersProps = {
    minPrice,
    maxPrice,
    onMinPriceChange: setMinPrice,
    onMaxPriceChange: setMaxPrice,
    inStockOnly,
    onInStockOnlyChange: setInStockOnly,
    onReset: resetFilters,
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr] md:gap-10">
      {/* Sidebar de escritorio: mismo <CategoryFilters> que el drawer de
          abajo, sin chrome de overlay. */}
      <aside className="hidden md:block">
        <CategoryFilters {...filtersProps} />
      </aside>

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            aria-expanded={mobileFiltersOpen}
            aria-controls={drawerId}
            className="flex min-h-11 items-center gap-2 rounded-md border border-brand-slate/30 px-4 font-sans text-sm font-medium text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate md:hidden"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" strokeWidth={1.75} />
            Filtros
            {filtersActive && (
              <span className="size-2 rounded-full bg-brand-orange" aria-hidden="true" />
            )}
          </button>

          <label htmlFor={sortId} className="ml-auto flex items-center gap-2 font-sans text-sm text-brand-black">
            <span className="hidden sm:inline">Ordenar por:</span>
            <select
              id={sortId}
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="min-h-11 rounded-md border border-brand-slate/30 bg-brand-white px-3 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            >
              <option value="relevancia">Relevancia</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
            </select>
          </label>
        </div>

        {visibleProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg bg-brand-gray px-6 py-16 text-center">
            <p className="font-sans text-sm text-brand-black sm:text-base">
              No hay productos que coincidan con estos filtros.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="font-sans text-sm font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <ProductGrid products={visibleProducts} />
        )}
      </div>

      {/* Drawer de filtros en móvil: desliza desde la derecha (a propósito
          distinto del menú de categorías del Header, que desliza desde la
          izquierda, para no confundir ambos overlays), mismo mecanismo de
          overlay + Escape que ya usa Header.tsx. */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar filtros"
            className="absolute inset-0 bg-brand-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-brand-white p-4 shadow-lg"
          >
            <div className="flex items-center justify-between pb-2">
              <span className="font-display text-sm uppercase text-brand-slate">
                Filtros
              </span>
              <button
                type="button"
                aria-label="Cerrar filtros"
                className="flex size-11 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <X className="size-5" aria-hidden="true" strokeWidth={1.75} />
              </button>
            </div>

            <CategoryFilters {...filtersProps} />

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className={buttonClassName("primary", "mt-4 w-full")}
            >
              Ver {visibleProducts.length}{" "}
              {visibleProducts.length === 1 ? "resultado" : "resultados"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
