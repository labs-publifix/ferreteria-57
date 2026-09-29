"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "./Select";

export interface DateTimePickerProps {
  id?: string;
  /** "YYYY-MM-DDTHH:mm" — mismo formato que <input type="datetime-local">, sin información de huso. */
  value: string;
  onChange: (value: string) => void;
  /** Nombre accesible del control (se anuncia a lectores de pantalla). */
  label: string;
  className?: string;
}

const WEEKDAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

interface ParsedValue {
  year: number;
  month: number; // 0-based
  day: number;
  hour: number;
  minute: number;
}

function parseValue(value: string): ParsedValue | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  return { year: Number(y), month: Number(mo) - 1, day: Number(d), hour: Number(h), minute: Number(mi) };
}

function formatValue(parsed: ParsedValue): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parsed.year}-${pad(parsed.month + 1)}-${pad(parsed.day)}T${pad(parsed.hour)}:${pad(parsed.minute)}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => {
  const label = String(h).padStart(2, "0");
  return { value: label, label };
});
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, m) => {
  const label = String(m).padStart(2, "0");
  return { value: label, label };
});

// Calendario propio en vez de <input type="datetime-local">: igual que
// Select.tsx (ver su comentario), el calendario/reloj que dibuja el
// sistema operativo para ese tipo de input no se puede re-estilizar por
// CSS — sale con el look nativo de Windows/Android/iOS/macOS, no con el de
// la marca (hallazgo del cliente sobre /admin/pop-up-banner/nuevo). Mismo
// patrón visual y de interacción que Select/Combobox: botón disparador con
// el mismo look que los demás campos del formulario + panel flotante,
// cierre con clic-afuera o Escape.
export function DateTimePicker({ id, value, onChange, label, className = "" }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseValue(value), [value]);
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const generatedId = useId();
  const buttonId = id ?? generatedId;

  // Al abrir, el mes visible salta al de la fecha ya elegida — reabrir el
  // picker no debe dejarlo a medio camino de un mes distinto al valor real.
  useEffect(() => {
    if (!open) return;
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
    // Solo debe reaccionar a la apertura, no a cada cambio de `parsed`
    // (si no, seleccionar un día movería la vista mientras el panel sigue
    // abierto, justo cuando no hace falta).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  const displayLabel = parsed
    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(parsed.year, parsed.month, parsed.day, parsed.hour, parsed.minute)
      )
    : "Selecciona fecha y hora";

  function selectDay(day: number) {
    const hour = parsed?.hour ?? 0;
    const minute = parsed?.minute ?? 0;
    onChange(formatValue({ year: viewYear, month: viewMonth, day, hour, minute }));
  }

  function setHour(hourStr: string) {
    const base = parsed ?? { year: viewYear, month: viewMonth, day: today.getDate(), hour: 0, minute: 0 };
    onChange(formatValue({ ...base, hour: Number(hourStr) }));
  }

  function setMinute(minuteStr: string) {
    const base = parsed ?? { year: viewYear, month: viewMonth, day: today.getDate(), hour: 0, minute: 0 };
    onChange(formatValue({ ...base, minute: Number(minuteStr) }));
  }

  function goToPreviousMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const totalDays = daysInMonth(viewYear, viewMonth);
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 = domingo
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        id={buttonId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${buttonId}`}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-brand-slate/30 bg-brand-white px-4 py-2.5 text-left font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
      >
        <span className={parsed ? "" : "text-brand-slate/50"}>{displayLabel}</span>
        <CalendarIcon className="size-4 shrink-0 text-brand-slate" aria-hidden="true" strokeWidth={1.75} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`Selector de ${label}`}
          className="absolute z-20 mt-1 w-72 rounded-lg border border-brand-slate/15 bg-brand-white p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousMonth}
              aria-label="Mes anterior"
              className="flex size-8 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            >
              <ChevronLeft className="size-4" aria-hidden="true" strokeWidth={1.75} />
            </button>
            <span className="font-sans text-sm font-semibold capitalize text-brand-black">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Mes siguiente"
              className="flex size-8 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            >
              <ChevronRight className="size-4" aria-hidden="true" strokeWidth={1.75} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAY_LABELS.map((weekday, index) => (
              <span key={index} className="font-sans text-xs font-medium text-brand-slate/60">
                {weekday}
              </span>
            ))}
            {cells.map((day, index) => {
              if (day === null) return <span key={`empty-${index}`} aria-hidden="true" />;
              const isSelected =
                parsed?.year === viewYear && parsed?.month === viewMonth && parsed?.day === day;
              const isToday =
                today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  aria-pressed={isSelected}
                  className={`mx-auto flex size-8 items-center justify-center rounded-md font-sans text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate ${
                    isSelected
                      ? "bg-brand-orange font-semibold text-brand-black"
                      : isToday
                        ? "font-semibold text-brand-orange ring-1 ring-inset ring-brand-orange/40"
                        : "text-brand-black hover:bg-brand-gray"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-brand-slate/10 pt-3">
            <span className="font-sans text-xs font-medium text-brand-slate/70">Hora:</span>
            <Select
              value={parsed ? String(parsed.hour).padStart(2, "0") : "00"}
              onChange={setHour}
              options={HOUR_OPTIONS}
              label={`Hora — ${label}`}
              className="w-20"
            />
            <span className="font-sans text-sm text-brand-slate/70">:</span>
            <Select
              value={parsed ? String(parsed.minute).padStart(2, "0") : "00"}
              onChange={setMinute}
              options={MINUTE_OPTIONS}
              label={`Minutos — ${label}`}
              className="w-20"
            />
          </div>
        </div>
      )}
    </div>
  );
}
