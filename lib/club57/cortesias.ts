// Puntos de cortesía de Club 57: los que el administrador o el operador
// otorgan desde el panel. La regla real (quién, máximo, motivos, anulación)
// vive en club57_otorgar_puntos() y club57_anular_cortesia() — ver
// migración 20261020010000_club57_puntos_cortesia.sql. Aquí solo están los
// textos que muestra cada pantalla.

export const CLUB57_MAX_PUNTOS_CORTESIA_DEFAULT = 500;

export type Club57MotivoCortesia = "compensacion" | "promocion" | "agradecimiento" | "ajuste_autorizado" | "otro";
export type Club57MotivoAnulacionCortesia = "otorgado_por_error" | "otro";

// `label`: lo que ve el personal. `cliente`: lo que ve el cliente en su
// historial (null = sin motivo visible, solo «Puntos de cortesía»).
export const CLUB57_MOTIVOS_CORTESIA: { value: Club57MotivoCortesia; label: string; cliente: string | null }[] = [
  { value: "compensacion", label: "Compensación por una mala experiencia", cliente: "Compensación" },
  { value: "promocion", label: "Promoción o dinámica", cliente: "Promoción" },
  { value: "agradecimiento", label: "Cliente frecuente / agradecimiento", cliente: "Agradecimiento por tu preferencia" },
  { value: "ajuste_autorizado", label: "Ajuste autorizado", cliente: "Ajuste a tu saldo" },
  { value: "otro", label: "Otro", cliente: null },
];

export const CLUB57_MOTIVOS_ANULACION_CORTESIA: {
  value: Club57MotivoAnulacionCortesia;
  label: string;
  cliente: string | null;
}[] = [
  { value: "otorgado_por_error", label: "Se otorgaron por error", cliente: "Se otorgaron por error" },
  { value: "otro", label: "Otro", cliente: null },
];

const STAFF_LABEL: Record<string, string> = Object.fromEntries(
  [...CLUB57_MOTIVOS_CORTESIA, ...CLUB57_MOTIVOS_ANULACION_CORTESIA].map((m) => [m.value, m.label])
);
const CLIENTE_LABEL: Record<string, string | null> = Object.fromEntries(
  [...CLUB57_MOTIVOS_CORTESIA, ...CLUB57_MOTIVOS_ANULACION_CORTESIA].map((m) => [m.value, m.cliente])
);

export function esMovimientoCortesia(tipo: string): boolean {
  return tipo === "cortesia" || tipo === "anulacion_cortesia";
}

// Para el personal: «Promoción o dinámica», o la nota cuando el motivo es
// «Otro» (la nota solo existe en la bitácora, nunca en el ledger).
export function club57MotivoCortesiaTexto(motivo: string | null | undefined, nota?: string | null): string | null {
  if (!motivo) return null;
  if (motivo === "otro") return nota?.trim() || STAFF_LABEL.otro;
  return STAFF_LABEL[motivo] ?? motivo;
}

// Para el cliente: nunca la nota interna; con «Otro», sin motivo.
export function club57MotivoCortesiaCliente(motivo: string | null | undefined): string | null {
  if (!motivo) return null;
  return CLIENTE_LABEL[motivo] ?? null;
}

// Valida lo que captura el diálogo antes de llamar al servidor (la base
// vuelve a validarlo todo). null = sin errores.
export function validarOtorgamiento(input: {
  puntos: string;
  motivo: string;
  nota: string;
  max: number;
}): string | null {
  const texto = input.puntos.trim();
  if (!/^\d+$/.test(texto) || Number(texto) <= 0) return "Los puntos deben ser un número entero mayor a 0.";
  if (Number(texto) > input.max) return `El máximo por otorgamiento es de ${input.max} puntos.`;
  if (!CLUB57_MOTIVOS_CORTESIA.some((m) => m.value === input.motivo)) return "Elige el motivo.";
  if (input.motivo === "otro" && !input.nota.trim()) return "Escribe el motivo en la nota.";
  if (input.nota.trim().length > 300) return "La nota es muy larga (máximo 300 caracteres).";
  return null;
}
