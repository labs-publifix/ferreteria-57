// Logos de socios comerciales: tipos y tamaño permitidos (deben coincidir
// con el bucket club57-socios-logos de la migración 20261102010000) y la
// validación real del archivo, que no confía en la extensión ni en el tipo
// que declara el navegador: revisa la firma de los primeros bytes y, en un
// SVG, que no traiga scripts ni contenido activo.

export const LOGO_BUCKET = "club57-socios-logos";
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg";
/** Lado del cuadrado al que se recortan o ajustan los logos de mapa de bits. */
export const LOGO_SQUARE_PX = 512;

export type LogoMime = "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";

export const LOGO_EXTENSION: Record<LogoMime, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/** Tipo real del archivo según su firma, o null si no es un formato permitido. */
export function detectarTipoLogo(bytes: Uint8Array): LogoMime | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  const head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 1024)).replace(/^﻿/, "").trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return "image/svg+xml";
  return null;
}

/** Un SVG con scripts, manejadores de eventos o contenido incrustado se rechaza. */
export function svgInseguro(text: string): boolean {
  return /<script|<foreignObject|<iframe|<embed|<object|\son[a-z]+\s*=|javascript:|data:text\/html|<!ENTITY/i.test(text);
}

export interface LogoValidado {
  mime: LogoMime;
  extension: string;
}

export function validarLogo(bytes: Uint8Array): { ok: true; logo: LogoValidado } | { ok: false; error: string } {
  if (bytes.length === 0) return { ok: false, error: "El archivo está vacío." };
  if (bytes.length > LOGO_MAX_BYTES) return { ok: false, error: "El logotipo pesa más de 2 MB." };
  const mime = detectarTipoLogo(bytes);
  if (!mime) return { ok: false, error: "Formato no permitido: sube un PNG, JPG, WebP o SVG." };
  if (mime === "image/svg+xml" && svgInseguro(new TextDecoder().decode(bytes))) {
    return { ok: false, error: "El SVG trae código o contenido incrustado; expórtalo como imagen simple o súbelo en PNG." };
  }
  return { ok: true, logo: { mime, extension: LOGO_EXTENSION[mime] } };
}
