// Limitador de tasa "best effort" en memoria por IP — token bucket simple,
// sin dependencias externas. Vive en el proceso de la función serverless:
// en Vercel cada instancia tiene su propio mapa (no se comparte entre
// instancias ni sobrevive un cold start), así que esto frena a un cliente
// insistente dentro de UNA misma instancia caliente, pero no es una cuota
// dura a nivel de cuenta — para eso haría falta un store compartido
// (Upstash/Redis). Suficiente para el objetivo real aquí: que escribir
// rápido en el buscador (varias peticiones por segundo, normal en un
// autocompletado) no se sienta limitado, pero un script que dispare
// cientos de peticiones sí choque con esto.
const WINDOW_MS = 10_000;
const MAX_REQUESTS_PER_WINDOW = 30;

const buckets = new Map<string, { count: number; windowStart: number }>();

// Evita que `buckets` crezca sin límite con IPs que solo pasaron una vez —
// se poda cuando ya hay demasiadas entradas en vez de en cada request
// (barato, no hace falta más precisión que esta).
const MAX_TRACKED_IPS = 5000;

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    if (buckets.size >= MAX_TRACKED_IPS) buckets.clear();
    buckets.set(ip, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > MAX_REQUESTS_PER_WINDOW;
}
