// Eventos del blog para analítica: solo si la página ya tiene
// window.dataLayer (p. ej. si algún día se instala GTM). Sin dependencia:
// si no existe, no pasa nada.
type BlogEvent =
  | "blog_cta_view"
  | "blog_cta_click"
  | "blog_guia_click_registro"
  | "blog_guia_click_login"
  | "blog_guia_descarga";

export function pushBlogEvent(event: BlogEvent, data: { slug: string; [key: string]: string }) {
  if (typeof window === "undefined") return;
  const layer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(layer)) layer.push({ event, ...data });
}
