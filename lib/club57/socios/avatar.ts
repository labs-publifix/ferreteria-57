import { normalizeText } from "@/lib/normalizeText";

// Avatar por defecto de un socio comercial: sus iniciales sobre un color de
// la paleta de marca, elegido de forma determinista a partir del nombre
// (el mismo socio siempre sale del mismo color, en cualquier pantalla).
// Cada pareja fondo/texto cumple contraste AA para texto grande:
//   pizarra/blanco 8.1:1 · negro/naranja 6.4:1 · naranja/negro 6.4:1 ·
//   gris cálido/pizarra 7.2:1 · negro/blanco 17.4:1.

export interface AvatarColor {
  bg: string;
  text: string;
}

export const AVATAR_PALETTE: readonly AvatarColor[] = [
  { bg: "bg-brand-slate", text: "text-white" },
  { bg: "bg-brand-black", text: "text-brand-orange" },
  { bg: "bg-brand-orange", text: "text-brand-black" },
  { bg: "bg-brand-gray", text: "text-brand-slate" },
  { bg: "bg-brand-black", text: "text-white" },
];

const IGNORAR = new Set(["de", "del", "la", "las", "los", "el", "y", "e", "en", "a", "con", "por", "para", "s.a.", "sa", "cv", "s"]);

/** «Taller El Gallo» → «TG»; «Grafiqro» → «GR»; «HICA Operaciones» → «HO». */
export function partnerInitials(nombre: string): string {
  const words = nombre
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !IGNORAR.has(word.toLowerCase()));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Hash FNV-1a (32 bits) del nombre normalizado: estable entre servidor y navegador. */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function partnerAvatarColor(nombre: string): AvatarColor {
  return AVATAR_PALETTE[hash(normalizeText(nombre)) % AVATAR_PALETTE.length];
}
