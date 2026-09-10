"use client";

import { CATEGORY_ICON_OPTIONS } from "@/lib/category-icons";

// Selector visual (no un <select> de texto): para elegir un ícono ayuda
// verlo, no solo leer su nombre en inglés. Mismo catálogo de 10 íconos
// que ya usaba el grid de categorías del Home. El valor viaja en un
// input oculto para que el formulario lo mande como cualquier otro campo
// de FormData — un <button> no participa de eso por sí solo.
export function IconPicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {CATEGORY_ICON_OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              aria-label={option.value}
              className={`flex size-11 items-center justify-center rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 ${
                selected
                  ? "border-brand-orange bg-brand-orange/10 text-brand-black"
                  : "border-brand-slate/20 text-brand-slate hover:bg-brand-gray"
              }`}
            >
              <Icon className="size-5" aria-hidden="true" strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
