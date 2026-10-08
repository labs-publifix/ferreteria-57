// Regla de visibilidad del blog — funciones puras (el entorno entra como
// parámetro para poder probarlas).
//
// Un artículo es público solo si publishAt ≤ ahora. Los programados no
// existen para el visitante en producción: 404, y fuera de listados, home,
// sitemap, RSS y JSON-LD. BLOG_SHOW_SCHEDULED=1 los deja ver solo fuera de
// producción (previews de Vercel y local) para revisarlos antes de su
// fecha, con aviso y noindex.

type Env = { BLOG_SHOW_SCHEDULED?: string; VERCEL_ENV?: string; [key: string]: string | undefined };

export function isPublished(article: { publishAt: string }, now: Date): boolean {
  return new Date(article.publishAt).getTime() <= now.getTime();
}

export function canShowScheduled(env: Env = process.env): boolean {
  return env.BLOG_SHOW_SCHEDULED === "1" && env.VERCEL_ENV !== "production";
}

export function isVisible(article: { publishAt: string }, now: Date, env: Env = process.env): boolean {
  return isPublished(article, now) || canShowScheduled(env);
}
