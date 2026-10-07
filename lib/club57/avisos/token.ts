import { createHmac, timingSafeEqual } from "node:crypto";

// Firma del enlace de baja de avisos: HMAC-SHA256 del id del miembro. El
// enlace no necesita sesión, así que la firma es lo único que impide dar
// de baja a otra persona cambiando el id. Secreto propio
// (CLUB57_EMAIL_TOKEN_SECRET); si no está configurado se deriva de la
// service role key, que nunca sale del servidor.
function secreto(): string {
  const propio = process.env.CLUB57_EMAIL_TOKEN_SECRET;
  if (propio && propio.length >= 16) return propio;
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("Falta configurar el secreto para firmar los enlaces de baja.");
  return createHmac("sha256", base).update("club57-baja-avisos-v1").digest("hex");
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function firmarBaja(memberId: string): string {
  return createHmac("sha256", secreto()).update(`baja:${memberId.toLowerCase()}`).digest("base64url").slice(0, 32);
}

export function verificarBaja(memberId: string | null | undefined, token: string | null | undefined): boolean {
  if (!memberId || !token || !UUID_PATTERN.test(memberId) || token.length !== 32) return false;
  const esperado = Buffer.from(firmarBaja(memberId));
  const recibido = Buffer.from(token);
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
}
