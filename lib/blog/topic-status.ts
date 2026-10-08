// Estado de un tema del backlog del blog — función pura, sin I/O. No se
// guarda en la base: se DERIVA del descarte manual y del registro de
// artículos (lib/blog/registry.ts).
//
// Solo usa `import type` (se borra al compilar): así las pruebas corren con
// el runner nativo de Node sin resolver los alias "@/..." de Next.
import type { BlogTopic, RegistryEntry, TopicStatus } from "./types";

const TIMEZONE_NEGOCIO = "America/Mexico_City";

// "Hoy" como día de calendario AAAA-MM-DD en America/Mexico_City (mismo
// criterio que todayInStoreTimezone de lib/marketing/visibility.ts): el
// servidor corre en UTC y cerca de la medianoche local eso movería el día.
export function hoyNegocio(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_NEGOCIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function resolveTopicStatus(
  topic: Pick<BlogTopic, "descartado" | "fecha_programada">,
  registryEntry: RegistryEntry | undefined,
  now: Date
): TopicStatus {
  if (topic.descartado) return { estado: "descartado", atrasado: false };
  if (registryEntry) {
    const publishAt = new Date(registryEntry.publishAt).getTime();
    return { estado: publishAt <= now.getTime() ? "publicado" : "programado", atrasado: false };
  }
  // fecha_programada es "AAAA-MM-DD": se compara como texto contra el hoy
  // de negocio, sin convertir a Date (ni a ninguna zona horaria).
  const atrasado = topic.fecha_programada !== null && topic.fecha_programada < hoyNegocio(now);
  return { estado: "pendiente", atrasado };
}
