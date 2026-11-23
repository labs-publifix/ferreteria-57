// Club 57 Empresarial: reglas de los empleados de una empresa (línea de
// crédito, precarga por Excel, etiquetas). Funciones puras: las comparten
// el Portal Empresa, Mi cuenta y el panel de Ferretería 57. La base vuelve a
// validar todo (club57_calcular_linea, migración 20261128010000).

import { normalizeText } from "@/lib/normalizeText";
import { esCorreoValido, type FrecuenciaNomina } from "./datos";

export type EstadoEmpleado = "pendiente" | "activo" | "rechazado" | "cancelado" | "baja";
export type LineaTipo = "porcentaje" | "monto";

export const ESTADO_EMPLEADO_LABEL: Record<EstadoEmpleado, string> = {
  pendiente: "En revisión",
  activo: "Activo",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
  baja: "Baja",
};

/** Texto que el empleado acepta al vincularse (queda registrado con fecha). */
export function textoAutorizacion(empresa: string): string {
  return `Autorizo que ${empresa} vea los pedidos que haga con cargo a ella y que me descuente su importe vía nómina.`;
}

export function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Línea final del empleado: % de su salario neto o monto fijo, nunca más
 * del 100 % del salario. Mismo cálculo que club57_calcular_linea().
 */
export function calcularLinea(
  tipo: LineaTipo,
  valor: number | null,
  salario: number | null
): { linea: number } | { error: string } {
  if (valor === null || !Number.isFinite(valor) || valor <= 0) {
    return { error: tipo === "porcentaje" ? "Escribe el porcentaje." : "Escribe el monto de la línea." };
  }
  if (salario !== null && (!Number.isFinite(salario) || salario <= 0)) return { error: "El salario debe ser mayor a 0." };
  if (tipo === "porcentaje") {
    if (salario === null) return { error: "Para una línea en porcentaje, captura el salario mensual neto." };
    if (valor > 100) return { error: "La línea no puede pasar del 100 % del salario." };
    return { linea: redondear((salario * valor) / 100) };
  }
  if (salario !== null && valor > salario) return { error: "La línea no puede pasar del salario mensual neto." };
  return { linea: redondear(valor) };
}

export function parseNumero(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const text = String(value).replace(/[$\s,%]/g, "").trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : NaN;
}

// --- Precarga por Excel ---------------------------------------------------

export const PRECARGA_COLUMNAS = [
  { key: "nombre", header: "Nombre", required: false },
  { key: "correo", header: "Correo", required: false },
  { key: "numero de empleado", header: "Número de empleado", required: false },
  { key: "salario mensual neto", header: "Salario mensual neto", required: false },
  { key: "linea", header: "Línea", required: true },
] as const;

export interface PrecargaFila {
  fila: number;
  nombre: string | null;
  correo: string | null;
  numero_empleado: string | null;
  salario_mensual: number | null;
  linea_tipo: LineaTipo;
  linea_valor: number;
  linea_credito: number;
}

export interface PrecargaError {
  fila: number;
  motivo: string;
}

/**
 * Valida una fila del Excel de precarga. «Línea» acepta un porcentaje
 * («50 %», «50%») o un monto («3000», «$3,000»). Se identifica al empleado
 * por correo o por número de empleado.
 */
export function validarFilaPrecarga(
  fila: number,
  raw: { nombre?: unknown; correo?: unknown; numero?: unknown; salario?: unknown; linea?: unknown },
  exigeNumero: boolean
): { ok: PrecargaFila } | { error: PrecargaError } {
  const nombre = String(raw.nombre ?? "").replace(/\s+/g, " ").trim().slice(0, 120) || null;
  const correo = String(raw.correo ?? "").trim().toLowerCase() || null;
  const numero = String(raw.numero ?? "").trim().slice(0, 40) || null;
  const salario = parseNumero(raw.salario);
  const lineaTexto = String(raw.linea ?? "").trim();
  const esPorcentaje = /%$/.test(lineaTexto.replace(/\s/g, ""));
  const valor = parseNumero(lineaTexto);

  if (!correo && !numero) return { error: { fila, motivo: "Falta el correo o el número de empleado." } };
  if (correo && !esCorreoValido(correo)) return { error: { fila, motivo: "El correo no es válido." } };
  if (exigeNumero && !numero) return { error: { fila, motivo: "Falta el número de empleado." } };
  if (Number.isNaN(salario)) return { error: { fila, motivo: "El salario no es un número." } };
  if (Number.isNaN(valor) || valor === null) return { error: { fila, motivo: "Falta la línea (porcentaje o monto)." } };

  const tipo: LineaTipo = esPorcentaje ? "porcentaje" : "monto";
  const calculo = calcularLinea(tipo, valor, salario);
  if ("error" in calculo) return { error: { fila, motivo: calculo.error } };

  return {
    ok: {
      fila,
      nombre,
      correo,
      numero_empleado: numero,
      salario_mensual: salario === null ? null : redondear(salario),
      linea_tipo: tipo,
      linea_valor: redondear(valor),
      linea_credito: calculo.linea,
    },
  };
}

/** Busca la columna por encabezado, sin acentos ni mayúsculas. */
export function claveColumna(header: string): string {
  const h = normalizeText(header).replace(/\s+/g, " ");
  if (h === "numero empleado" || h === "no. de empleado" || h === "no de empleado" || h === "numero") return "numero de empleado";
  if (h === "salario" || h === "salario neto" || h === "salario mensual") return "salario mensual neto";
  if (h === "linea de credito" || h === "linea credito") return "linea";
  if (h === "email" || h === "correo electronico") return "correo";
  return h;
}

/** Detecta filas repetidas (mismo correo o número) dentro del archivo. */
export function marcarDuplicados(filas: PrecargaFila[]): { validas: PrecargaFila[]; errores: PrecargaError[] } {
  const correos = new Set<string>();
  const numeros = new Set<string>();
  const validas: PrecargaFila[] = [];
  const errores: PrecargaError[] = [];
  for (const fila of filas) {
    if ((fila.correo && correos.has(fila.correo)) || (fila.numero_empleado && numeros.has(fila.numero_empleado))) {
      errores.push({ fila: fila.fila, motivo: "Empleado repetido en el archivo." });
      continue;
    }
    if (fila.correo) correos.add(fila.correo);
    if (fila.numero_empleado) numeros.add(fila.numero_empleado);
    validas.push(fila);
  }
  return { validas, errores };
}

export function lineaLabel(tipo: LineaTipo | null, porcentaje: number | null): string {
  if (tipo === "porcentaje" && porcentaje !== null) return `${porcentaje} % del salario`;
  if (tipo === "monto") return "Monto fijo";
  return "—";
}

export type NominaEmpleado = {
  frecuencia: FrecuenciaNomina | null;
  diaSemana: number | null;
  diaMes: number | null;
};
