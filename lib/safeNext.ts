// Destino de regreso tras iniciar sesión o registrarse (/cuenta?next=...).
// Protección contra open redirect: solo rutas RELATIVAS internas que
// empiecen con un prefijo de la lista; cualquier otra cosa (URL absoluta,
// "//host", "\", esquemas, saltos de línea, "..") se ignora y el visitante
// se queda en /cuenta como siempre.
const NEXT_ALLOWED_PREFIXES = ["/blog"] as const;

export function safeNextPath(value: string | string[] | null | undefined): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 300) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\\\s\u0000-\u001f\u007f]/.test(value) || value.includes("..") || value.includes(":")) return null;
  const pathname = value.split(/[?#]/)[0];
  const allowed = NEXT_ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return allowed ? value : null;
}
