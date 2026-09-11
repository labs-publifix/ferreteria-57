"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Nombre accesible del control (se anuncia a lectores de pantalla). */
  label: string;
  className?: string;
}

// Listbox propio (patrón WAI-ARIA "Listbox Button") en vez de un <select>
// nativo: una vez abierto, el menú de un <select> lo dibuja el sistema
// operativo con su propio look — no se puede re-estilizar por CSS para que
// combine con el resto de la UI (visto en la captura del cliente: el menú
// de "Ordenar por" salía con estilo nativo oscuro de Windows/Chrome, no
// con el de la marca). Este componente sí queda consistente en cualquier
// plataforma.
export function Select({ value, onChange, options, label, className = "" }: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const buttonId = useId();
  const labelId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectOption(optionValue: string) {
    onChange(optionValue);
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        id={buttonId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${buttonId}`}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-brand-slate/30 bg-brand-white px-3 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-brand-slate transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-labelledby={labelId}
          // max-h + overflow-y-auto: sin esto, una lista larga (p. ej. el
          // filtro "Producto" de /admin/resenas con decenas de productos)
          // dibuja un menú más alto que la pantalla en vez de scrollear.
          className="absolute right-0 z-10 mt-1 max-h-64 min-w-full overflow-y-auto overflow-x-hidden whitespace-nowrap rounded-md border border-brand-slate/15 bg-brand-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectOption(option.value)}
                className={`flex min-h-11 w-full items-center gap-2 px-3 text-left font-sans text-sm hover:bg-brand-gray ${
                  isSelected ? "font-semibold text-brand-black" : "text-brand-slate"
                }`}
              >
                <Check
                  className={`size-4 shrink-0 text-brand-orange ${isSelected ? "opacity-100" : "opacity-0"}`}
                  aria-hidden="true"
                  strokeWidth={2}
                />
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
