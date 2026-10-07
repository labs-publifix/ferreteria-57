// Estimación de cuándo termina de llegar un aviso — función pura (sin
// I/O), usada igual por el diálogo del panel (antes de enviar) y por el
// progreso de un aviso en curso. Simula día por día la cola de avisos
// activos con la capacidad diaria: cada día se reparte en orden de
// programación (el primero en la cola se llena primero), y lo que no
// alcanza a salir antes del fin de vigencia de su promoción se omite.
import { addDaysInStoreTimezone, todayInStoreTimezone } from "@/lib/marketing/visibility";
import { AVISOS_HORA_ENVIO } from "./config";
import { diffDays } from "@/lib/club57/promociones/vigencia";

export interface CampanaEnCola {
  id: string;
  /** Primer día (YYYY-MM-DD, CDMX) en que puede salir. */
  inicioDia: string;
  /** Orden en la cola (programado_para en ms; empate: creación). */
  orden: number;
  pendientes: number;
  /** Último día de vigencia de su promoción (inclusive). */
  finVigencia: string;
}

export interface EstimacionCampana {
  id: string;
  /** Día del último envío; null si con la capacidad actual no termina. */
  fechaFin: string | null;
  /** Días de envío contando el primero y el último. */
  dias: number;
  /** Destinatarios que reciben el aviso a más tardar el fin de vigencia. */
  alcanzan: number;
  /** Destinatarios que se omitirían por vencimiento. */
  noAlcanzan: number;
  /** Envíos estimados por día (YYYY-MM-DD -> n). */
  porDia: Record<string, number>;
}

export interface SimulacionInput {
  hoy: string;
  /** Lo que todavía se puede enviar hoy (0 si ya no queda). */
  restantesHoy: number;
  capDiario: number;
  campanas: CampanaEnCola[];
}

const MAX_DIAS = 3650;

export function simularCola({ hoy, restantesHoy, capDiario, campanas }: SimulacionInput): Map<string, EstimacionCampana> {
  const cola = [...campanas].sort((a, b) => a.orden - b.orden).map((c) => ({ ...c, restante: c.pendientes }));
  const resultado = new Map<string, EstimacionCampana>();
  for (const c of cola) {
    resultado.set(c.id, { id: c.id, fechaFin: null, dias: 0, alcanzan: 0, noAlcanzan: 0, porDia: {} });
  }

  let dia = hoy;
  for (let i = 0; i < MAX_DIAS && cola.some((c) => c.restante > 0); i += 1) {
    let capacidad = i === 0 ? Math.max(0, Math.min(restantesHoy, capDiario)) : capDiario;
    for (const c of cola) {
      if (c.restante <= 0) continue;
      const est = resultado.get(c.id)!;
      if (dia > c.finVigencia) {
        est.noAlcanzan += c.restante;
        c.restante = 0;
        continue;
      }
      if (dia < c.inicioDia || capacidad <= 0) continue;
      const n = Math.min(capacidad, c.restante);
      capacidad -= n;
      c.restante -= n;
      est.alcanzan += n;
      est.porDia[dia] = n;
      if (c.restante === 0) est.fechaFin = dia;
    }
    if (capDiario <= 0 && i > 0) break;
    dia = addDaysInStoreTimezone(1, dia);
  }

  for (const c of cola) {
    const est = resultado.get(c.id)!;
    if (c.restante > 0) est.noAlcanzan += c.restante;
    const diasConEnvio = Object.keys(est.porDia).sort();
    if (diasConEnvio.length > 0) {
      est.dias = diffDays(diasConEnvio[0], diasConEnvio[diasConEnvio.length - 1]) + 1;
    }
    if (est.noAlcanzan > 0) est.fechaFin = null;
  }
  return resultado;
}

// Atajo para el diálogo: un aviso nuevo detrás de la cola actual.
export function estimarAvisoNuevo(input: {
  hoy: string;
  restantesHoy: number;
  capDiario: number;
  cola: CampanaEnCola[];
  total: number;
  inicioDia: string;
  finVigencia: string;
  orden: number;
}): EstimacionCampana {
  const nueva: CampanaEnCola = {
    id: "__nueva__",
    inicioDia: input.inicioDia,
    orden: input.orden,
    pendientes: input.total,
    finVigencia: input.finVigencia,
  };
  const sim = simularCola({
    hoy: input.hoy,
    restantesHoy: input.restantesHoy,
    capDiario: input.capDiario,
    campanas: [...input.cola, nueva],
  });
  return sim.get("__nueva__")!;
}

// Instante UTC en que es `hora`:00 del día `isoDate` en CDMX. Se calcula
// con el desfase real del huso (no un -06:00 fijo) por si algún día
// vuelve el horario de verano.
export function instanteNegocio(isoDate: string, hora: number = AVISOS_HORA_ENVIO): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hora, 0, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(guess);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const localAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  const offsetMs = localAsUtc - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
}

// Día de negocio (CDMX) de un instante.
export function diaNegocio(instante: Date | string): string {
  return todayInStoreTimezone(typeof instante === "string" ? new Date(instante) : instante);
}
