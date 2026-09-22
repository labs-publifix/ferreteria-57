"use client";

import { useEffect, useRef, useState } from "react";

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  idPrefix: string;
}

// Patrón WAI-ARIA "Tabs" con activación automática: la flecha mueve el
// foco Y selecciona a la vez (a diferencia de "activación manual", que
// necesitaría Enter/Espacio aparte) — el estándar para pestañas que solo
// cambian contenido visible, sin efecto secundario costoso por selección.
// Riel con scroll horizontal (mismo "overflow-x-auto" + "scrollbar-hide"
// que ya usa CategoryNavRail) para cuando las etiquetas no caben en una
// pantalla angosta. En 375/390px, "Historial de puntos" sí se corta a
// medio texto — un difuminado en el borde derecho (mismo criterio que las
// flechas de CategoryNavRail: la pista visual de "hay más" importa más
// que con tarjetas que ya asoman a medias) avisa que se puede desplazar,
// sin necesitar botones de flecha para solo tres pestañas.
export function Tabs({ tabs, activeId, onChange, idPrefix }: TabsProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const el = scrollerRef.current;
    if (!el) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs]);

  function focusAndActivate(index: number) {
    const tab = tabs[index];
    if (!tab) return;
    onChange(tab.id);
    tabRefs.current[tab.id]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAndActivate((index + 1) % tabs.length);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAndActivate((index - 1 + tabs.length) % tabs.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAndActivate(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAndActivate(tabs.length - 1);
    }
  }

  return (
    <div className="relative border-b border-brand-slate/10">
      <div
        ref={scrollerRef}
        role="tablist"
        aria-label="Secciones de tu cuenta"
        className="scrollbar-hide flex gap-1 overflow-x-auto"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              role="tab"
              id={`${idPrefix}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${idPrefix}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`min-h-11 shrink-0 whitespace-nowrap border-b-2 px-4 font-sans text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 ${
                isActive
                  ? "border-brand-orange text-brand-black"
                  : "border-transparent text-brand-slate/70 hover:text-brand-black"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {/* Difuminado que avisa "hay más pestañas" cuando el riel puede
          desplazarse a la derecha — desaparece solo al llegar al final. */}
      {canScrollRight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 top-0 w-8 bg-gradient-to-l from-brand-gray to-transparent"
        />
      )}
    </div>
  );
}

export function TabPanel({
  id,
  idPrefix,
  activeId,
  children,
}: {
  id: string;
  idPrefix: string;
  activeId: string;
  children: React.ReactNode;
}) {
  if (id !== activeId) return null;
  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${id}`} aria-labelledby={`${idPrefix}-tab-${id}`} tabIndex={0}>
      {children}
    </div>
  );
}
