import { SITE_URL } from "@/lib/seo";
import type { PublicPartner } from "./public";

export const DIRECTORIO_PATH = "/directorio";
export const DIRECTORIO_TITLE = "Directorio de socios comerciales en Querétaro | Ferretería 57";
export const DIRECTORIO_DESCRIPTION =
  "Talleres, refaccionarias, herrerías y comercios de Querétaro, Corregidora y El Marqués que forman parte de la red de Ferretería 57. Consulta sus datos de contacto como miembro de Club 57.";

// Datos estructurados del directorio: una lista de negocios locales con
// SOLO los campos públicos (nombre, giro, logo, colonia y municipio). Sin
// teléfono, correo ni calle, igual que la vista pública de la que salen.
export function buildDirectorioJsonLd(partners: PublicPartner[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Directorio de socios comerciales de Ferretería 57 en Querétaro",
    url: `${SITE_URL}${DIRECTORIO_PATH}`,
    numberOfItems: partners.length,
    itemListElement: partners.map((partner, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "LocalBusiness",
        name: partner.nombre_comercial,
        description: partner.giro,
        ...(partner.logo_url ? { image: partner.logo_url } : {}),
        address: {
          "@type": "PostalAddress",
          addressLocality: partner.municipio ?? "Querétaro",
          addressRegion: "Querétaro",
          addressCountry: "MX",
        },
        areaServed: { "@type": "State", name: "Querétaro" },
      },
    })),
  };
}
