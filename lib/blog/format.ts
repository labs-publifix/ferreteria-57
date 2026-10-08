// Formato de fechas del backlog: fecha_programada es un día de calendario
// "AAAA-MM-DD" (columna `date`). Se formatea por partes, SIN pasar por
// new Date("AAAA-MM-DD") + toLocaleDateString: eso lo interpreta como
// medianoche UTC y en México lo mostraría un día antes.
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function partes(fecha: string): [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

// "2026-10-09" -> "09/10/2026"
export function formatFechaProgramada(fecha: string): string {
  const p = partes(fecha);
  if (!p) return fecha;
  return `${String(p[2]).padStart(2, "0")}/${String(p[1]).padStart(2, "0")}/${p[0]}`;
}

// "2026-10-09" -> "viernes" (aritmética de calendario pura en UTC).
export function diaDeLaSemana(fecha: string): string {
  const p = partes(fecha);
  if (!p) return "";
  return DIAS[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()];
}
