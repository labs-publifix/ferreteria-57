"use client";

import { useState } from "react";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "12m", label: "12 meses" },
  { value: "custom", label: "Personalizado" },
] as const;

type RangeValue = (typeof RANGE_OPTIONS)[number]["value"];

// Funcional de verdad (recuerda la selección, revela los campos de fecha
// en "Personalizado") aunque todavía no filtre nada — no hay datos reales
// de pedidos/ingresos que filtrar hasta que ese módulo exista. El estado
// vive aquí, no en la URL: cuando el módulo de Pedidos se conecte, este
// mismo control pasa a disparar la consulta real sin cambiar su interfaz.
export function SalesDateRangeSelector() {
  const [range, setRange] = useState<RangeValue>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Rango de fechas"
        className="flex flex-wrap gap-1 rounded-md bg-brand-gray p-1"
      >
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={range === option.value}
            onClick={() => setRange(option.value)}
            className={`min-h-8 rounded px-2.5 font-sans text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate ${
              range === option.value
                ? "bg-white text-brand-black shadow-sm"
                : "text-brand-slate/70 hover:text-brand-black"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {range === "custom" && (
        <div className="mt-2 flex items-center gap-2">
          <label className="flex-1">
            <span className="sr-only">Desde</span>
            <input
              type="date"
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
              className="w-full rounded-md border border-brand-slate/30 px-2 py-1.5 font-sans text-xs text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            />
          </label>
          <span className="text-brand-slate/40" aria-hidden="true">
            –
          </span>
          <label className="flex-1">
            <span className="sr-only">Hasta</span>
            <input
              type="date"
              value={customEnd}
              onChange={(event) => setCustomEnd(event.target.value)}
              className="w-full rounded-md border border-brand-slate/30 px-2 py-1.5 font-sans text-xs text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            />
          </label>
        </div>
      )}
    </div>
  );
}
