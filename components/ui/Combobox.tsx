"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { normalizeText } from "@/lib/normalizeText";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  /** Nombre accesible del control (se anuncia a lectores de pantalla). */
  label: string;
  placeholder?: string;
  emptyMessage?: string;
  /**
   * Opción fija que siempre aparece al final de la lista, sin importar el
   * texto buscado (p. ej. "Mi colonia no aparece en la lista") — a
   * diferencia de `options`, nunca se filtra fuera de la vista.
   */
  pinnedOption?: ComboboxOption;
  className?: string;
  id?: string;
  required?: boolean;
}

// Patrón WAI-ARIA "combobox" (input de texto + listbox filtrado emergente),
// distinto del Listbox Button de components/ui/Select.tsx: ese componente
// no tiene buscador, y con 230+ colonias desplazarse a mano por la lista
// completa no es utilizable.
export function Combobox({
  value,
  onChange,
  options,
  label,
  placeholder,
  emptyMessage = "Sin resultados",
  pinnedOption,
  className = "",
  id,
  required,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const allOptions = pinnedOption ? [...options, pinnedOption] : options;
  const selectedOption = allOptions.find((option) => option.value === value) ?? null;

  // Mientras no se esté editando, el input muestra la etiqueta de la opción
  // elegida, no el `value` crudo (puede ser un sentinel como
  // "__NO_LISTADA__" sin sentido para quien compra).
  const displayValue = open ? query : (selectedOption?.label ?? "");

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    if (normalizedQuery === "") return options;
    return options.filter((option) => normalizeText(option.label).includes(normalizedQuery));
  }, [options, query]);

  // La opción fija va siempre al final, sin filtrar — así "Mi colonia no
  // aparece en la lista" sigue siendo alcanzable aunque la búsqueda no
  // encuentre ninguna colonia real.
  const selectable = pinnedOption ? [...filtered, pinnedOption] : filtered;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function openList() {
    setOpen(true);
    setQuery("");
    setActiveIndex(-1);
  }

  function closeList() {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }

  function selectOption(option: ComboboxOption) {
    onChange(option.value);
    closeList();
    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActiveIndex((index) => Math.min(index + 1, selectable.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      if (open && activeIndex >= 0 && selectable[activeIndex]) {
        event.preventDefault();
        selectOption(selectable[activeIndex]);
      }
    } else if (event.key === "Escape") {
      closeList();
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && activeIndex >= 0 && selectable[activeIndex]
            ? `${listboxId}-${activeIndex}`
            : undefined
        }
        aria-label={label}
        autoComplete="off"
        required={required}
        // El input real siempre queda vacío para la validación nativa del
        // <form> cuando no hay selección — value refleja lo que se escribe,
        // pero lo que "cuenta" como respuesta es `value` (el value elegido),
        // no el texto de búsqueda.
        value={displayValue}
        placeholder={placeholder}
        onFocus={openList}
        onChange={(event) => {
          setQuery(event.target.value);
          if (!open) setOpen(true);
          setActiveIndex(-1);
        }}
        onBlur={closeList}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 pr-9 font-sans text-sm text-brand-black placeholder:text-brand-slate/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
      />
      <ChevronDown
        className={`pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-brand-slate transition-transform ${open ? "rotate-180" : ""}`}
        aria-hidden="true"
        strokeWidth={1.75}
      />

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-brand-slate/15 bg-brand-white py-1 shadow-lg"
        >
          {selectable.length === 0 ? (
            <li className="px-3 py-2 font-sans text-sm text-brand-slate/60">{emptyMessage}</li>
          ) : (
            selectable.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              const isPinned = pinnedOption?.value === option.value;
              return (
                <li
                  key={option.value}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => {
                    // preventDefault: sin esto el blur del input dispara
                    // antes que el click y cierra la lista antes de poder
                    // registrar la selección.
                    event.preventDefault();
                    selectOption(option);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 px-3 text-left font-sans text-sm ${
                    isPinned ? "border-t border-brand-slate/15" : ""
                  } ${isActive ? "bg-brand-gray" : ""} ${
                    isSelected ? "font-semibold text-brand-black" : "text-brand-slate"
                  }`}
                >
                  <Check
                    className={`size-4 shrink-0 text-brand-orange ${isSelected ? "opacity-100" : "opacity-0"}`}
                    aria-hidden="true"
                    strokeWidth={2}
                  />
                  {option.label}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
