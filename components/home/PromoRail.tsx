"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { promos } from "@/lib/mock-data/promos";
import { PromoCard } from "./PromoCard";

// Riel de tarjetas de promoción (reemplaza el carrusel de portada única):
// scroll horizontal en TODOS los tamaños (a diferencia de FeaturedProducts,
// que en escritorio cambia a grid) — aquí siempre hay más tarjetas de las
// que caben, así que el scroll con snap sigue siendo el patrón correcto
// incluso en escritorio, con flechas como atajo para mouse/teclado.
export function PromoRail() {
  const scrollerRef = useRef<HTMLDivElement>(null);
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
  }, []);

  function scrollByAmount(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    // Respeta prefers-reduced-motion (guía de ui-ux-pro-max sobre
    // sensibilidad al movimiento): mismo desplazamiento, sin animación.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <div className="relative" role="region" aria-label="Promociones y beneficios">
      <div
        ref={scrollerRef}
        className="scrollbar-hide -mx-4 flex snap-x gap-4 overflow-x-auto scroll-pl-4 px-4 pb-2 sm:-mx-6 sm:scroll-pl-6 sm:px-6 lg:-mx-8 lg:scroll-pl-8 lg:px-8"
      >
        {promos.map((promo) => (
          <PromoCard key={promo.id} promo={promo} />
        ))}
      </div>

      {/* Flechas solo desde sm: en móvil el swipe nativo + el borde de la
          siguiente tarjeta ya asomando son pista suficiente (mismo
          criterio que se usó para el carrusel anterior); se ocultan solas
          en cada extremo en vez de quedar ahí sin hacer nada. */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label="Ver promociones anteriores"
          className="absolute left-0 top-1/2 hidden size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-slate shadow-md transition-colors hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:flex"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label="Ver más promociones"
          className="absolute right-0 top-1/2 hidden size-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-slate shadow-md transition-colors hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:flex"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
