// Descarga de las guías PDF del blog. Apagada hasta la Fase 4, que conecta
// /api/blog/guias/[slug]: mientras tanto, el miembro ve el botón
// deshabilitado "Disponible muy pronto".
export const GUIAS_ENABLED = false;

export function guiaDownloadHref(slug: string): string {
  return `/api/blog/guias/${slug}`;
}

// Destino de los CTA para visitantes: registro / inicio de sesión en
// /cuenta y regreso a la guía del artículo (lib/safeNext.ts lo valida).
export function guiaNextPath(slug: string): string {
  return `/blog/${slug}#guia`;
}

export function registroHref(slug: string): string {
  return `/cuenta?registro=1&next=${encodeURIComponent(guiaNextPath(slug))}`;
}

export function loginHref(slug: string): string {
  return `/cuenta?next=${encodeURIComponent(guiaNextPath(slug))}`;
}
