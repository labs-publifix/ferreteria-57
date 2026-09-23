import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";

// /sitemap.xml generado en cada request (sin caché propia más allá de la
// que Next.js ya aplica a las rutas de metadata) — home, las 3 páginas
// legales, todas las categorías activas y todos los productos activos.
// Nunca incluye /carrito, /checkout, /cuenta ni /admin: esas se excluyen
// además explícitamente en robots.ts (ver app/robots.ts) y con
// robots:{index:false} en su propia metadata.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("slug, created_at").eq("active", true),
    supabase.from("products").select("slug, updated_at").eq("active", true),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/aviso-privacidad`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/politica-de-envios`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((category) => ({
    url: `${SITE_URL}/categoria/${category.slug}`,
    lastModified: category.created_at ? new Date(category.created_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((product) => ({
    url: `${SITE_URL}/producto/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
