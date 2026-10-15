// Cancelar o corregir compras de Club 57 registradas en tienda: lo que la
// UI necesita saber de cada movimiento del historial. La regla real (plazo,
// permisos, saldo) vive en club57_corregir_compra() — ver migración
// 20261015010000_club57_correcciones_compras.sql. Esto solo replica el
// cálculo del plazo para decidir qué botón mostrar; si se desfasara (p. ej.
// justo a la medianoche), la función de la base responde con el error y la
// UI lo muestra.

export const CLUB57_PLAZO_CORRECCION_DIAS = 7;

export type Club57Motivo = "no_era_lo_que_necesitaba" | "producto_danado" | "error_de_captura" | "otro";

export const CLUB57_MOTIVOS: { value: Club57Motivo; label: string }[] = [
  { value: "no_era_lo_que_necesitaba", label: "No era lo que necesitaba" },
  { value: "producto_danado", label: "Producto dañado" },
  { value: "error_de_captura", label: "Error de captura" },
  { value: "otro", label: "Otro" },
];

export const CLUB57_MOTIVO_LABEL: Record<string, string> = Object.fromEntries(
  CLUB57_MOTIVOS.map((motivo) => [motivo.value, motivo.label])
);

// "Producto dañado", o la nota cuando el motivo es «Otro».
export function club57MotivoTexto(motivo: string | null | undefined, nota: string | null | undefined): string | null {
  if (!motivo) return null;
  if (motivo === "otro") return nota?.trim() || CLUB57_MOTIVO_LABEL.otro;
  return CLUB57_MOTIVO_LABEL[motivo] ?? motivo;
}

// Fecha de calendario (YYYY-MM-DD) de un timestamp en el huso de la tienda,
// igual que (created_at at time zone 'America/Mexico_City')::date.
export function fechaLocalTienda(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

// Días naturales entre dos fechas YYYY-MM-DD (hoy − desde).
export function diasNaturalesEntre(desde: string, hoy: string): number {
  const toUtc = (fecha: string) => {
    const [y, m, d] = fecha.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(hoy) - toUtc(desde)) / 86_400_000);
}

export interface Club57LedgerMovimiento {
  id: string;
  cantidad: number;
  tipo: string;
  estado: "pendiente" | "disponible";
  created_at: string;
  anula_a?: string | null;
  corrige_a?: string | null;
  motivo?: string | null;
  motivo_nota?: string | null;
}

export interface Club57CorreccionInfo<T extends Club57LedgerMovimiento> {
  /** La compra ya fue cancelada o corregida (tiene compensatorio). */
  estadoCompra: "cancelada" | "corregida" | null;
  /** El movimiento compensatorio que anuló esta compra. */
  anulacion: T | null;
  /** Para una compra corregida: la compra que la reemplaza. */
  reemplazo: T | null;
  /** Para una compra que es corrección de otra: la compra original. */
  original: T | null;
  /** Para un compensatorio: la compra que anula. */
  compraAnulada: T | null;
  /** Fecha (timestamp) de la primera compra de la cadena: de ahí cuenta el plazo. */
  fechaCompraRaiz: string;
  /** Días naturales transcurridos desde fechaCompraRaiz (huso de la tienda). */
  diasDesdeCompra: number;
  /** Se puede cancelar/corregir: compra en tienda sin compensatorio. */
  corregible: boolean;
  dentroDePlazo: boolean;
}

// Relaciona cada movimiento con su compensatorio, su reemplazo y su
// original, y calcula el plazo desde la compra original de la cadena.
export function club57AnotarCorrecciones<T extends Club57LedgerMovimiento>(
  rows: T[],
  hoy: string
): Map<string, Club57CorreccionInfo<T>> {
  const porId = new Map(rows.map((row) => [row.id, row]));
  const anulacionDe = new Map<string, T>();
  const reemplazoDe = new Map<string, T>();
  for (const row of rows) {
    if (row.anula_a) anulacionDe.set(row.anula_a, row);
    if (row.corrige_a) reemplazoDe.set(row.corrige_a, row);
  }

  const result = new Map<string, Club57CorreccionInfo<T>>();
  for (const row of rows) {
    let raiz: T = row;
    const visitados = new Set<string>([row.id]);
    while (raiz.corrige_a && porId.has(raiz.corrige_a) && !visitados.has(raiz.corrige_a)) {
      visitados.add(raiz.corrige_a);
      raiz = porId.get(raiz.corrige_a)!;
    }
    const anulacion = anulacionDe.get(row.id) ?? null;
    const reemplazo = reemplazoDe.get(row.id) ?? null;
    const diasDesdeCompra = diasNaturalesEntre(fechaLocalTienda(raiz.created_at), hoy);
    result.set(row.id, {
      estadoCompra: anulacion ? (reemplazo ? "corregida" : "cancelada") : null,
      anulacion,
      reemplazo,
      original: row.corrige_a ? porId.get(row.corrige_a) ?? null : null,
      compraAnulada: row.anula_a ? porId.get(row.anula_a) ?? null : null,
      fechaCompraRaiz: raiz.created_at,
      diasDesdeCompra,
      corregible: row.tipo === "compra_manual" && !anulacion,
      dentroDePlazo: diasDesdeCompra <= CLUB57_PLAZO_CORRECCION_DIAS,
    });
  }
  return result;
}
