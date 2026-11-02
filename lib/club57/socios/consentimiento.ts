import { normalizeText } from "@/lib/normalizeText";

// Medio por el que un socio autorizó compartir sus datos de contacto con los
// miembros de Club 57 (LFPDPPP). Junto con la fecha y quién lo registró deja
// trazabilidad de cada autorización. Los valores deben coincidir con el
// check de la migración 20261103010000_club57_socios_consentimiento_medio.sql.
export const MEDIOS_CONSENTIMIENTO = [
  { value: "firma", label: "Firma en papel" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "correo", label: "Correo electrónico" },
  { value: "formulario", label: "Formulario" },
  { value: "verbal", label: "Verbal (en persona o por teléfono)" },
  { value: "otro", label: "Otro" },
] as const;

export type MedioConsentimiento = (typeof MEDIOS_CONSENTIMIENTO)[number]["value"];

export function esMedioConsentimiento(value: unknown): value is MedioConsentimiento {
  return MEDIOS_CONSENTIMIENTO.some((medio) => medio.value === value);
}

export function medioLabel(value: string | null | undefined): string | null {
  return MEDIOS_CONSENTIMIENTO.find((medio) => medio.value === value)?.label ?? null;
}

const ALIASES: Record<string, MedioConsentimiento> = {
  firma: "firma",
  "firma en papel": "firma",
  papel: "firma",
  whatsapp: "whatsapp",
  wa: "whatsapp",
  correo: "correo",
  "correo electronico": "correo",
  email: "correo",
  "e-mail": "correo",
  formulario: "formulario",
  verbal: "verbal",
  telefono: "verbal",
  "en persona": "verbal",
  llamada: "verbal",
  otro: "otro",
};

/** Lee el medio escrito en la carga masiva («WhatsApp», «correo electrónico»…). Vacío = null. */
export function normalizarMedio(value: string): { value: MedioConsentimiento | null; error?: string } {
  const raw = normalizeText(value).replace(/\s*\(.*\)\s*$/, "").trim();
  if (!raw) return { value: null };
  const medio = ALIASES[raw];
  if (medio) return { value: medio };
  return {
    value: null,
    error: `Medio de autorización «${value.trim()}» no válido: usa ${MEDIOS_CONSENTIMIENTO.map((m) => m.label.replace(/ \(.*\)$/, "")).join(", ")}.`,
  };
}
