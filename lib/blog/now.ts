// Reloj del blog. Toda la regla de visibilidad (publishAt ≤ ahora) pasa por
// aquí para poder probar una publicación programada sin esperar a su fecha:
// fuera de producción real (VERCEL_ENV !== "production"), BLOG_NOW_OVERRIDE
// con una fecha ISO hace de "ahora". En producción real se ignora siempre.
// Es solo para pruebas locales; no se configura en Vercel.
type Env = { BLOG_NOW_OVERRIDE?: string; VERCEL_ENV?: string; [key: string]: string | undefined };

export function getNow(env: Env = process.env): Date {
  const override = env.BLOG_NOW_OVERRIDE;
  if (override && env.VERCEL_ENV !== "production") {
    const date = new Date(override);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}
