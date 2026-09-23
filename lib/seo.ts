// Fuente única de la URL base del sitio para todo lo relacionado con SEO
// (canonical, sitemap, robots, metadataBase, JSON-LD "url") — el dominio
// final ferreteria57.com todavía no resuelve, así que esto lee
// NEXT_PUBLIC_SITE_URL en vez de tenerlo fijo en el código; cuando el
// dominio quede listo, solo hay que poner esa variable en Vercel, sin
// tocar ningún archivo. Mientras no exista, cae al dominio de Vercel:
// en producción a VERCEL_PROJECT_PRODUCTION_URL (el dominio ESTABLE del
// proyecto — el custom domain si ya está conectado, si no el alias
// *.vercel.app fijo), nunca a VERCEL_URL, que identifica cada deployment
// individual y cambia en cada build — usarlo rompía el og:image (la URL
// absoluta apuntaba a un deployment específico, no al dominio que la
// gente de verdad visita/comparte, y ese host de deployment puede tener
// Vercel Authentication bloqueando a crawlers externos como WhatsApp).
// Fuera de producción (preview deployments) sí se usa VERCEL_URL, porque
// ahí no existe un dominio estable — cada preview es su propio deployment.
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const domain =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_URL;
  return domain ? `https://${domain}` : "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl().replace(/\/$/, "");

export const OG_IMAGE_PATH = "/og-image.jpg";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// Robots por defecto para las páginas que nunca deben indexarse ni
// aportar sus links al rastreo (carrito, checkout, cuenta, confirmación
// de pedido) — un solo lugar para no repetir el objeto literal cuatro
// veces con riesgo de que alguna copia quede desactualizada.
export const NO_INDEX_NO_FOLLOW = { index: false, follow: false } as const;

// Para las páginas legales: no aportan nada a la indexación (son las
// mismas 3 en todo el sitio, sin nada que rankear) pero sí pueden seguir
// sus propios links salientes (a INAI/PROFECO) con normalidad.
export const NO_INDEX = { index: false } as const;

// HardwareStore: el subtipo de Store que schema.org ya define
// específicamente para una ferretería — hereda todas las propiedades de
// LocalBusiness (address, telephone, openingHoursSpecification, sameAs),
// así que un buscador que sí entienda el subtipo tiene más contexto que
// con un LocalBusiness genérico, y uno que no lo reconozca cae de vuelta
// a tratarlo como LocalBusiness de cualquier forma (comportamiento
// estándar de estos vocabularios: un tipo no reconocido no rompe nada).
// Vive en el layout raíz (aplica a todo el sitio, no una página en
// particular) — ver app/(site)/layout.tsx.
export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HardwareStore",
    name: "Ferretería 57",
    image: `${SITE_URL}${OG_IMAGE_PATH}`,
    url: SITE_URL,
    telephone: "+524427782708",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Lateral Carretera Federal No. 57 #230, Casa Blanca",
      postalCode: "76030",
      addressLocality: "Santiago de Querétaro",
      addressRegion: "Querétaro",
      addressCountry: "MX",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "08:00",
        closes: "15:00",
      },
    ],
    sameAs: [
      "https://www.facebook.com/p/Ferreter%C3%ADa-57-Qro-61575239701906/",
      "https://www.instagram.com/ferreteria57qro",
    ],
  };
}

// WebSite + SearchAction: solo tiene sentido en la home (es el punto de
// entrada "del sitio" para un buscador, no de cada página) — target usa
// el mismo patrón ?q= que ya resuelve /buscar de verdad (ver
// app/(site)/buscar/page.tsx), así que un rich result de búsqueda de
// Google apuntaría a una búsqueda que sí funciona.
export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ferretería 57",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/buscar?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

// BreadcrumbList genérico — mismo shape para /categoria/[slug] (Home >
// Categoría) y /producto/[slug] (Home > Categoría > Producto), reflejando
// la misma ruta que ya muestra el <nav aria-label="Ruta de navegación">
// visible en cada una de esas páginas, nunca una jerarquía inventada
// aparte de la que el usuario realmente ve y puede navegar.
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
