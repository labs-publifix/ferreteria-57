// Pop-Up Banner: colores de fondo/texto/botón son arbitrarios (selector de
// color real, no una paleta fija de temas como Promo Banners) — nada en el
// proyecto valida contraste hoy, así que esto es un utilitario nuevo.
// Fórmula estándar WCAG 2.x de luminancia relativa y ratio de contraste
// (misma que usan las herramientas de accesibilidad del navegador).

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3
    ? clean.split("").map((char) => char + char).join("")
    : clean.padEnd(6, "0").slice(0, 6);
  const num = Number.parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function srgbChannelToLinear(channel255: number): number {
  const channel = channel255 / 255;
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * srgbChannelToLinear(r) + 0.7152 * srgbChannelToLinear(g) + 0.0722 * srgbChannelToLinear(b);
}

// Rango real: 1 (sin contraste, mismo color) a 21 (blanco puro sobre negro
// puro). WCAG AA pide >= 4.5 para texto normal, >= 3 para texto grande
// (>=18pt o >=14pt en negrita).
export function contrastRatio(hexA: string, hexB: string): number {
  const luminanceA = relativeLuminance(hexA);
  const luminanceB = relativeLuminance(hexB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAA(hexA: string, hexB: string, isLargeText = false): boolean {
  const ratio = contrastRatio(hexA, hexB);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}
