"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/navigation/categories";

// Riel de scroll horizontal para las categorías del mega-menú (Header) y
// de la barra condensada (StickyRevealHeader) — ambas comparten esta
// misma pieza en vez de duplicar la lógica de flechas. Reemplaza el
// flex-wrap anterior: con pocas categorías esto se ve idéntico a una fila
// normal (nada que desplazar), pero no tiene un techo de cuántas
// categorías soporta antes de verse mal — crece indefinidamente sin
// volver a tocar este componente, a diferencia de un umbral fijo tipo
// "a partir de 11 categorías". Sin snap (a diferencia de PromoRail): son
// links de texto de ancho variable, no tarjetas, no hay "posiciones" a
// las que encajar.
//
// Las flechas son necesarias aquí de una forma en que no lo eran en
// PromoRail: ahí las tarjetas asomando a medias ya insinúan que hay más
// contenido; aquí es una fila de texto que a simple vista podría
// confundirse con "esas son todas las categorías", así que la pista
// visual explícita importa más.
export function CategoryNavRail({
  categories,
  tabIndex,
}: {
  categories: Category[];
  tabIndex?: number;
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
    // Recalcula cuando cambia la lista de categorías (más/menos texto que desplazar).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  function scrollByAmount(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label="Ver categorías anteriores"
          tabIndex={tabIndex}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        >
          <ChevronLeft className="size-4" aria-hidden="true" strokeWidth={1.75} />
        </button>
      )}

      <ul
        ref={scrollerRef}
        className="scrollbar-hide flex min-w-0 flex-1 scroll-smooth items-center gap-x-6 overflow-x-auto"
      >
        {categories.map((category) => (
          <li key={category.href} className="shrink-0">
            <Link
              href={category.href}
              tabIndex={tabIndex}
              className="font-sans text-sm font-medium text-brand-slate hover:text-brand-black hover:underline underline-offset-4"
            >
              {category.label}
            </Link>
          </li>
        ))}
      </ul>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label="Ver más categorías"
          tabIndex={tabIndex}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        >
          <ChevronRight className="size-4" aria-hidden="true" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
