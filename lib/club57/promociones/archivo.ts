// Utilidades puras del archivo PDF de una promoción (sin I/O): firma del
// archivo, nombres de descarga y formato de tamaño.

// Todo PDF válido empieza con "%PDF-" en sus primeros bytes. Es la única
// verificación de tipo en la que se confía — nunca la extensión ni el
// MIME que reporta el navegador (un .exe renombrado a .pdf trae ambos).
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d];

export function hasPdfSignature(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_SIGNATURE.length) return false;
  return PDF_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

// Nombre seguro para Content-Disposition: sin separadores de ruta,
// comillas ni caracteres de control, siempre terminado en .pdf.
export function sanitizeDownloadFilename(original: string): string {
  let name = original
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f"\\/:*?<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!/\.pdf$/i.test(name)) name = `${name || "promocion"}.pdf`;
  if (name.length > 150) name = `${name.slice(0, 146).trim()}.pdf`;
  return name;
}

// RFC 6266 + RFC 5987: filename="…" en ASCII como respaldo para clientes
// viejos y filename*=UTF-8''… con el nombre real (acentos, ñ).
export function contentDispositionAttachment(original: string): string {
  const safe = sanitizeDownloadFilename(original);
  const asciiFallback = safe
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7e]/g, "_");
  const encoded = encodeURIComponent(safe).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

export function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const extended = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (extended) {
    try {
      return decodeURIComponent(extended[1]);
    } catch {
      // cae al filename="…" simple
    }
  }
  const simple = /filename="([^"]+)"/i.exec(header);
  return simple ? simple[1] : null;
}

// Nombre interno sugerido a partir del archivo: "promo_truper-octubre.pdf"
// -> "promo truper octubre". Siempre dentro de 3–80 caracteres.
export function defaultTituloFromFilename(filename: string, fallback: string): string {
  const base = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80)
    .trim();
  return base.length >= 3 ? base : fallback;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("es-MX", { maximumFractionDigits: 1 })} MB`;
}
