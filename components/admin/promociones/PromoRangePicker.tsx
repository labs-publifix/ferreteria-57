"use client";

import { useId, useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import "./promo-calendar.css";
import {
  findOverlappingPromo,
  formatRangoLegible,
  promoAtajos,
  type PromoRango,
} from "@/lib/club57/promociones/vigencia";

export interface PromoPublicadaRef extends PromoRango {
  id: string;
  titulo: string;
}

export type PromoRangoParcial = Partial<PromoRango>;

// "YYYY-MM-DD" <-> Date local a medianoche: el calendario trabaja con
// fechas de calendario puras, así que el huso del navegador no importa
// mientras la conversión sea simétrica.
function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateToIso(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function promoRangeConflict(
  value: PromoRangoParcial,
  publicadas: PromoPublicadaRef[],
  excludeId?: string
): PromoPublicadaRef | null {
  if (!value.inicio || !value.fin) return null;
  return findOverlappingPromo({ inicio: value.inicio, fin: value.fin }, publicadas, excludeId);
}

export function PromoRangePicker({
  hoy,
  minDate,
  value,
  onChange,
  publicadas,
  excludeId,
}: {
  /** Hoy en America/Mexico_City ("YYYY-MM-DD"), resuelto en el servidor. */
  hoy: string;
  minDate: string;
  value: PromoRangoParcial;
  onChange: (value: PromoRangoParcial) => void;
  /** Promociones publicadas del MISMO tipo — para marcar días ocupados y validar traslapes. */
  publicadas: PromoPublicadaRef[];
  excludeId?: string;
}) {
  const legendId = useId();
  const [month, setMonth] = useState(() => isoToDate(value.inicio ?? hoy));
  const atajos = useMemo(() => promoAtajos(hoy), [hoy]);
  const otras = useMemo(() => publicadas.filter((promo) => promo.id !== excludeId), [publicadas, excludeId]);
  const conflict = promoRangeConflict(value, publicadas, excludeId);

  const selected: DateRange | undefined = value.inicio
    ? { from: isoToDate(value.inicio), to: value.fin ? isoToDate(value.fin) : undefined }
    : undefined;

  const shortcuts: { label: string; rango: PromoRango }[] = [
    { label: "Este mes", rango: atajos.esteMes },
    { label: "Próximo mes", rango: atajos.proximoMes },
    { label: "Próximos 15 días", rango: atajos.proximos15Dias },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Atajos de vigencia">
        {shortcuts.map((shortcut) => {
          const active = value.inicio === shortcut.rango.inicio && value.fin === shortcut.rango.fin;
          return (
            <button
              key={shortcut.label}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onChange(shortcut.rango);
                setMonth(isoToDate(shortcut.rango.inicio));
              }}
              className={`min-h-11 rounded-full border px-4 font-sans text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 ${
                active
                  ? "border-brand-orange bg-brand-orange text-brand-black"
                  : "border-brand-slate/30 bg-white text-brand-slate hover:border-brand-slate/60 hover:bg-brand-gray"
              }`}
            >
              {shortcut.label}
            </button>
          );
        })}
      </div>

      <div className="promo-calendar flex justify-center rounded-lg border border-brand-slate/15 bg-white px-1 py-3 sm:justify-start sm:px-3">
        <DayPicker
          mode="range"
          locale={es}
          weekStartsOn={1}
          today={isoToDate(hoy)}
          month={month}
          onMonthChange={setMonth}
          selected={selected}
          onSelect={(range) =>
            onChange({
              inicio: range?.from ? dateToIso(range.from) : undefined,
              fin: range?.to ? dateToIso(range.to) : undefined,
            })
          }
          disabled={{ before: isoToDate(minDate) }}
          modifiers={{ ocupado: otras.map((promo) => ({ from: isoToDate(promo.inicio), to: isoToDate(promo.fin) })) }}
          modifiersClassNames={{ ocupado: "rdp-ocupado" }}
          aria-describedby={otras.length > 0 ? legendId : undefined}
        />
      </div>

      {otras.length > 0 && (
        <p id={legendId} className="flex items-center gap-2 font-sans text-xs text-brand-slate">
          <span
            aria-hidden="true"
            className="inline-block size-4 shrink-0 rounded-full"
            style={{ background: "repeating-linear-gradient(135deg, #f2f1ef 0 4px, #e2e0dc 4px 8px)" }}
          />
          Días tachados: ya ocupados por otra promoción publicada de este tipo.
        </p>
      )}

      <div aria-live="polite" className="flex flex-col gap-2">
        <p className="rounded-md bg-brand-gray px-4 py-3 font-sans text-sm font-medium text-brand-black">
          {value.inicio && value.fin
            ? formatRangoLegible({ inicio: value.inicio, fin: value.fin })
            : value.inicio
              ? "Ahora elige el último día de la promoción."
              : "Elige el primer y el último día de la promoción (ambos incluidos)."}
        </p>
        {conflict && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            Se traslapa con &ldquo;{conflict.titulo}&rdquo; ({formatRangoLegible(conflict)}). Solo puede haber una
            promoción vigente a la vez por tipo — ajusta las fechas.
          </p>
        )}
      </div>

      {value.inicio && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="self-start font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          Limpiar fechas
        </button>
      )}
    </div>
  );
}
