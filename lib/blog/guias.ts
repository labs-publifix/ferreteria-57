// Guías PDF de Club 57 en el blog: rutas y enlaces que usan el CTA del
// artículo (components/blog/GuiaClubCta.tsx) y «Mis guías» en /cuenta.
// Archivo sin dependencias de servidor: lo importan componentes cliente.
export const GUIAS_ENABLED = true;

export function guiaDownloadHref(slug: string): string {
  return `/api/blog/guias/${slug}`;
}

export function guiaNextPath(slug: string): string {
  return `/blog/${slug}#guia`;
}

export function registroHref(slug: string): string {
  return `/cuenta?registro=1&next=${encodeURIComponent(guiaNextPath(slug))}`;
}

export function loginHref(slug: string): string {
  return `/cuenta?next=${encodeURIComponent(guiaNextPath(slug))}`;
}

/** «Ver todas mis guías»: la sección de /cuenta. */
export const MIS_GUIAS_HREF = "/cuenta#mis-guias";
