import { isPublished } from "./visibility";

// Reglas de la descarga de guías (/api/blog/guias/[slug]) como función pura
// para probar cada caso sin red ni base. Orden fijo:
//   1) sin sesión                         -> 401
//   2) con sesión pero sin membresía      -> 403 (registrarse en /cuenta)
//   3) artículo inexistente, sin guía o
//      todavía no publicado (getNow())    -> 404
//   4) más de 20 descargas en la última hora -> 429
// Un registro en /cuenta ya es membresía: cuenta de Supabase Auth + fila en
// club57_members (la crea el trigger de alta; no se pide confirmar correo).

export const GUIDE_DOWNLOADS_PER_HOUR = 20;
export const GUIDE_RATE_WINDOW_MS = 60 * 60 * 1000;

export const GUIDE_ACCESS_MESSAGES = {
  401: "Inicia sesión para descargar la guía.",
  403: "Las guías son gratuitas para miembros de Club 57. Completa tu registro en /cuenta para descargarla.",
  404: "Guía no encontrada.",
  429: "Ya descargaste varias guías en la última hora. Tómate un respiro y vuelve a intentarlo en un rato.",
} as const;

export type GuideAccessDenied = { ok: false; status: keyof typeof GUIDE_ACCESS_MESSAGES; error: string };
export type GuideAccess = { ok: true } | GuideAccessDenied;

export interface GuideAccessInput {
  hasUser: boolean;
  isMember: boolean;
  /** El artículo del slug (solo importa su publishAt), o undefined si no existe. */
  article: { publishAt: string } | undefined;
  hasGuide: boolean;
  now: Date;
  /** Descargas del usuario en la última hora. */
  recentDownloads: number;
}

function deny(status: GuideAccessDenied["status"]): GuideAccessDenied {
  return { ok: false, status, error: GUIDE_ACCESS_MESSAGES[status] };
}

export function decideGuideDownload(input: GuideAccessInput): GuideAccess {
  if (!input.hasUser) return deny(401);
  if (!input.isMember) return deny(403);
  if (!input.article || !input.hasGuide || !isPublished(input.article, input.now)) return deny(404);
  if (input.recentDownloads >= GUIDE_DOWNLOADS_PER_HOUR) return deny(429);
  return { ok: true };
}

/** Inicio de la ventana del límite por hora (ISO, para filtrar downloaded_at). */
export function rateWindowStart(now: Date = new Date()): string {
  return new Date(now.getTime() - GUIDE_RATE_WINDOW_MS).toISOString();
}

export function contentDispositionPdf(fileName: string): string {
  return `attachment; filename="${fileName.replace(/[^a-z0-9._-]/gi, "-")}"`;
}
