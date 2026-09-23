import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// /robots.txt: permite el rastreo general y bloquea las rutas que nunca
// deben aparecer en resultados de búsqueda (carrito, checkout, cuenta y
// el panel de administración completo, más las rutas de API que no son
// páginas). Mismo criterio que el robots:{index:false} de cada página —
// esto es la segunda capa (evita que un rastreador siga esos links desde
// el arranque, sin depender de que primero visite la página para leer su
// meta tag).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/carrito", "/checkout", "/cuenta", "/admin", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
