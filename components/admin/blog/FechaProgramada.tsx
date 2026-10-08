import { diaDeLaSemana, formatFechaProgramada } from "@/lib/blog/format";

// dd/mm/yyyy + día de la semana, sin conversión de zona horaria.
export function FechaProgramada({ fecha, inline = false }: { fecha: string | null; inline?: boolean }) {
  if (!fecha) return <span className="font-sans text-sm text-brand-slate">Sin fecha (Reserva)</span>;
  return (
    <span className={`font-sans tabular-nums ${inline ? "" : "flex flex-col"}`}>
      <time dateTime={fecha} className="whitespace-nowrap text-sm text-brand-black">
        {formatFechaProgramada(fecha)}
      </time>{" "}
      <span className={`text-xs text-brand-slate ${inline ? "ml-1.5" : ""}`}>{diaDeLaSemana(fecha)}</span>
    </span>
  );
}
