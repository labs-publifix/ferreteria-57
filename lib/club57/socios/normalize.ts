import { normalizeText } from "@/lib/normalizeText";
import { normalizarMedio, type MedioConsentimiento } from "./consentimiento";
import { slugify } from "@/lib/slugify";

// Normalización y validación de un socio comercial del directorio de
// Club 57. La usan el formulario del admin, la carga masiva por Excel y el
// generador del seed (scripts/seed-directorio-socios.ts), para que un socio
// quede igual sin importar por dónde entró. Los CHECK de la tabla
// (migración 20261102010000) son la segunda capa.

export const ESTADO_DEFAULT = "Querétaro";
export const GIRO_POR_DEFINIR = "Por definir";

export interface PartnerInput {
  nombre_comercial: string;
  giro: string;
  contacto: string;
  telefono: string;
  correo: string;
  correo_2: string;
  calle: string;
  num_ext: string;
  num_int: string;
  colonia: string;
  cp: string;
  municipio: string;
  estado: string;
  logo_url: string;
  clave_origen: string;
  notas: string;
  consentimiento: string;
  /** Medio por el que autorizó (WhatsApp, firma…); opcional. */
  medio_consentimiento?: string;
}

export interface PartnerData {
  nombre_comercial: string;
  /** Nombre del giro tal cual se guardará (o null si está por definir). */
  giro: string | null;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  correo_2: string | null;
  calle: string | null;
  num_ext: string | null;
  num_int: string | null;
  colonia: string | null;
  cp: string | null;
  municipio: string | null;
  estado: string;
  logo_url: string | null;
  clave_origen: string | null;
  notas_internas: string | null;
  /** null = la fila no dice nada (en una actualización se conserva lo que haya). */
  consentimiento: boolean | null;
  /** Solo cuando consentimiento es true; null = no se indicó. */
  consentimiento_medio: MedioConsentimiento | null;
}

export interface NormalizedPartner {
  data: PartnerData;
  errors: string[];
  warnings: string[];
}

const CONECTORES = new Set(["de", "del", "la", "las", "los", "el", "y", "e", "en", "a", "con", "por", "para", "o"]);

function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function orNull(value: string): string | null {
  return value === "" ? null : value;
}

/**
 * Formato título sin destruir siglas ni marcas: solo se transforma un texto
 * escrito todo en mayúsculas o todo en minúsculas («TALLER EL GALLO» →
 * «Taller el Gallo»). Uno que ya mezcla mayúsculas («HICA Operaciones»,
 * «Fix-ride») se respeta tal cual.
 */
export function formatoTitulo(value: string): string {
  const text = clean(value);
  if (!text) return "";
  const letters = text.replace(/[^\p{L}]/gu, "");
  const mixed = letters !== letters.toUpperCase() && letters !== letters.toLowerCase();
  if (mixed) return text;
  return text
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (index > 0 && CONECTORES.has(word)) return word;
      return word.replace(/(^|[-/(])(\p{L})/gu, (_match, sep: string, char: string) => sep + char.toUpperCase());
    })
    .join(" ");
}

/** 10 dígitos, sin lada de país (52) ni el 1 de celular (521). */
export function normalizarTelefono(value: string): { value: string | null; error?: string } {
  const raw = clean(value);
  if (!raw) return { value: null };
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("521")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2);
  if (!/^\d{10}$/.test(digits)) {
    return { value: null, error: `Teléfono «${raw}» no válido: debe tener 10 dígitos.` };
  }
  return { value: digits };
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalizarCorreo(value: string): { value: string | null; error?: string } {
  const raw = clean(value).toLowerCase();
  if (!raw) return { value: null };
  if (!EMAIL_RE.test(raw)) return { value: null, error: `Correo «${raw}» no válido.` };
  return { value: raw };
}

export function normalizarCp(value: string): { value: string | null; error?: string } {
  const raw = clean(value).replace(/\.0$/, "");
  if (!raw) return { value: null };
  const digits = raw.replace(/\D/g, "");
  if (!/^\d{5}$/.test(digits)) return { value: null, error: `CP «${raw}» no válido: debe tener 5 dígitos.` };
  return { value: digits };
}

/** «S/N», «s/n» o «SN» se guardan como «S/N». */
function normalizarNumero(value: string): string | null {
  const raw = clean(value);
  if (!raw) return null;
  if (/^s\s*\/?\s*n$/i.test(raw)) return "S/N";
  return raw;
}

export function normalizarEstado(value: string): string {
  const raw = clean(value);
  if (!raw) return ESTADO_DEFAULT;
  if (normalizeText(raw) === normalizeText(ESTADO_DEFAULT) || normalizeText(raw) === "qro") return ESTADO_DEFAULT;
  return formatoTitulo(raw);
}

export function esGiroPorDefinir(value: string | null | undefined): boolean {
  const raw = normalizeText(value ?? "");
  return raw === "" || raw === normalizeText(GIRO_POR_DEFINIR) || raw === "pendiente";
}

export function normalizarConsentimiento(value: string): { value: boolean | null; error?: string } {
  const raw = normalizeText(value);
  if (!raw) return { value: null };
  if (["si", "s", "true", "1", "x"].includes(raw)) return { value: true };
  if (["no", "n", "false", "0"].includes(raw)) return { value: false };
  return { value: null, error: `Consentimiento «${clean(value)}» no válido: escribe SI o NO.` };
}

export function normalizarLogoUrl(value: string): { value: string | null; error?: string } {
  const raw = clean(value);
  if (!raw) return { value: null };
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return { value: null, error: "LOGO_URL debe empezar con https://." };
    return { value: url.toString() };
  } catch {
    return { value: null, error: `LOGO_URL «${raw}» no es una dirección válida.` };
  }
}

export function partnerSlug(nombreComercial: string): string {
  return slugify(nombreComercial) || "socio";
}

/**
 * Normaliza y valida un socio. `errors` impide guardarlo; `warnings` se
 * guardan igual pero se le avisan al admin (en la carga masiva, el campo con
 * advertencia se deja vacío).
 */
export function normalizarSocio(input: Partial<PartnerInput>): NormalizedPartner {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nombre = clean(input.nombre_comercial);
  if (!nombre) errors.push("Falta el nombre comercial.");
  else if (nombre.length < 2 || nombre.length > 120) errors.push("El nombre comercial debe tener entre 2 y 120 caracteres.");

  const telefono = normalizarTelefono(input.telefono ?? "");
  if (telefono.error) errors.push(telefono.error);

  const correo = normalizarCorreo(input.correo ?? "");
  if (correo.error) errors.push(correo.error);

  const correo2 = normalizarCorreo(input.correo_2 ?? "");
  if (correo2.error) warnings.push(`${correo2.error} Se deja vacío el segundo correo.`);

  if (!telefono.value && !correo.value && !telefono.error && !correo.error) {
    warnings.push("Sin teléfono ni correo: los miembros no tendrán cómo contactarlo.");
  }

  const cp = normalizarCp(input.cp ?? "");
  if (cp.error) warnings.push(`${cp.error} Se deja vacío.`);

  const logo = normalizarLogoUrl(input.logo_url ?? "");
  if (logo.error) warnings.push(`${logo.error} Se usará el avatar de iniciales.`);

  const consentimiento = normalizarConsentimiento(input.consentimiento ?? "");
  if (consentimiento.error) warnings.push(`${consentimiento.error} No se cambia.`);
  const medio = normalizarMedio(input.medio_consentimiento ?? "");
  if (consentimiento.value === true) {
    if (medio.error) warnings.push(`${medio.error} Se registra sin medio.`);
    else if (!medio.value) warnings.push("Autorización sin medio: indica cómo autorizó el socio (WhatsApp, firma, correo…).");
  }

  const giroRaw = clean(input.giro);
  const giro = esGiroPorDefinir(giroRaw) ? null : giroRaw;
  if (!giro) warnings.push("Giro por definir: el socio no se publica hasta asignarle uno.");

  const estado = normalizarEstado(input.estado ?? "");
  if (estado !== ESTADO_DEFAULT) warnings.push(`Estado «${estado}»: el directorio es de comercios de Querétaro.`);

  const municipio = formatoTitulo(input.municipio ?? "");
  if (!municipio) warnings.push("Falta el municipio.");

  const calle = formatoTitulo(input.calle ?? "");
  const colonia = formatoTitulo(input.colonia ?? "");
  if (!calle) warnings.push("Falta la calle.");
  if (!colonia && !cp.value) warnings.push("Falta la colonia y el CP.");

  return {
    data: {
      nombre_comercial: formatoTitulo(nombre),
      giro: giro ? formatoTituloGiro(giro) : null,
      contacto: orNull(formatoTitulo(input.contacto ?? "")),
      telefono: telefono.value,
      correo: correo.value,
      correo_2: correo2.value && correo2.value !== correo.value ? correo2.value : null,
      calle: orNull(calle),
      num_ext: normalizarNumero(input.num_ext ?? ""),
      num_int: normalizarNumero(input.num_int ?? ""),
      colonia: orNull(colonia),
      cp: cp.value,
      municipio: orNull(municipio),
      estado,
      logo_url: logo.value,
      clave_origen: orNull(clean(input.clave_origen)),
      notas_internas: orNull(clean(input.notas)),
      consentimiento: consentimiento.value,
      consentimiento_medio: consentimiento.value === true ? medio.value : null,
    },
    errors,
    warnings,
  };
}

/** Un giro solo con la primera letra en mayúscula («Taller automotriz»). */
function formatoTituloGiro(value: string): string {
  const text = clean(value);
  const letters = text.replace(/[^\p{L}]/gu, "");
  if (letters === letters.toUpperCase() || letters === letters.toLowerCase()) {
    const lower = text.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return text;
}

/** Clave para detectar el mismo socio por nombre comercial + calle. */
export function claveNombreCalle(nombre: string | null, calle: string | null): string | null {
  if (!nombre || !calle) return null;
  return `${normalizeText(nombre)}|${normalizeText(calle)}`;
}
