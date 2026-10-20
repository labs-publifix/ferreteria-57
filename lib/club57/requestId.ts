// Llave de idempotencia de un formulario (una por envío lógico): si el
// mismo envío llega dos veces (doble clic, reintento de red), el servidor
// reconoce la llave y no lo duplica.
// crypto.randomUUID solo existe en contextos seguros (https o localhost);
// con getRandomValues se arma un UUID v4 igual de válido en cualquier caso.
export function newRequestId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
