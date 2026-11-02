import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { LOGO_MAX_BYTES } from "./logo";

// Descarga del logotipo indicado en la columna LOGO_URL de la carga masiva
// (solo servidor). Para no convertir la importación en una puerta a la red
// interna: solo https, sin redirecciones, a un host que resuelva a una IP
// pública, con tiempo límite y sin pasar de 2 MB. La validación del archivo
// (firma y SVG sin código) la hace después guardarLogo().

function ipPrivada(ip: string): boolean {
  if (isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) return true;
    const v4 = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return v4 ? ipPrivada(v4[1]) : false;
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

export async function descargarLogoRemoto(url: string): Promise<{ bytes: Uint8Array } | { error: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { error: "LOGO_URL no es una dirección válida." };
  }
  if (parsed.protocol !== "https:") return { error: "LOGO_URL debe empezar con https://." };
  if (parsed.hostname === "localhost" || isIP(parsed.hostname)) return { error: "LOGO_URL debe apuntar a un sitio público." };

  try {
    const direcciones = await lookup(parsed.hostname, { all: true });
    if (direcciones.length === 0 || direcciones.some((dir) => ipPrivada(dir.address))) {
      return { error: "LOGO_URL debe apuntar a un sitio público." };
    }
  } catch {
    return { error: "No se encontró el sitio de LOGO_URL." };
  }

  try {
    const response = await fetch(parsed, { redirect: "error", signal: AbortSignal.timeout(8000) });
    if (!response.ok || !response.body) return { error: `LOGO_URL respondió ${response.status}.` };
    const declarado = Number(response.headers.get("content-length") ?? "0");
    if (declarado > LOGO_MAX_BYTES) return { error: "El logotipo de LOGO_URL pesa más de 2 MB." };

    const reader = response.body.getReader();
    const partes: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > LOGO_MAX_BYTES) {
        await reader.cancel();
        return { error: "El logotipo de LOGO_URL pesa más de 2 MB." };
      }
      partes.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const parte of partes) {
      bytes.set(parte, offset);
      offset += parte.byteLength;
    }
    return { bytes };
  } catch {
    return { error: "No se pudo descargar LOGO_URL (sin respuesta, redirección o tiempo agotado)." };
  }
}
