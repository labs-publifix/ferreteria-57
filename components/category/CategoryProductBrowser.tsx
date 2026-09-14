"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { buttonClassName, Select } from "@/components/ui";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CategoryFilters } from "./CategoryFilters";
import type { Product } from "@/types/catalog";

type SortOption = "relevancia" | "precio-asc" | "precio-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
];

// Recibe los productos YA filtrados por categoría o por término de búsqueda
// (desde el Server Component de /categoria/[slug] o /buscar): este
// componente solo aplica precio/stock/marca/orden en memoria sobre ese
// arreglo, sin volver a tocar la fuente de datos.
export function CategoryProductBrowser({ products }: { products: Product[] }) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("relevancia");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const drawerId = useId();

  // Del set COMPLETO de productos de este contexto (categoría o búsqueda),
  // no del ya acotado por otros filtros — así la lista de casillas no se va
  // vaciando a medida que el visitante acota por precio/stock, mismo
  // criterio que un filtro de marca de e-commerce estándar. Orden alfabético
  // con locale es-MX (no el de inserción ni el fijo de detectBrandFromName)
  // porque acá pueden aparecer marcas no reconocidas si algún producto
  // quedó con texto libre en Marca.
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    for (const product of products) {
      if (product.brand.trim()) brands.add(product.brand);
    }
    return [...brands].sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  function toggleBrand(brand: string) {
    setSelectedBrands((current) =>
      current.includes(brand) ? current.filter((b) => b !== brand) : [...current, brand]
    );
  }

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
    setSelectedBrands([]);
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
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) return false;
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
  }, [products, minPrice, maxPrice, inStockOnly, selectedBrands, sort]);

  const filtersActive =
    minPrice !== "" || maxPrice !== "" || inStockOnly || selectedBrands.length > 0;

  const filtersProps = {
    minPrice,
    maxPrice,
    onMinPriceChange: setMinPrice,
    onMaxPriceChange: setMaxPrice,
    inStockOnly,
    onInStockOnlyChange: setInStockOnly,
    availableBrands,
    selectedBrands,
    onToggleBrand: toggleBrand,
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

          <div className="ml-auto flex items-center gap-2 font-sans text-sm text-brand-black">
            <span className="hidden sm:inline">Ordenar por:</span>
            <Select
              value={sort}
              onChange={(value) => setSort(value as SortOption)}
              options={SORT_OPTIONS}
              label="Ordenar por"
              className="min-w-[13rem]"
            />
          </div>
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
