import type { Metadata } from "next";
import { canonicalUrl } from "./seo";

export const BLOG_TITLE = "Blog de ferretería: guías y consejos | Ferretería 57";
export const BLOG_DESCRIPTION =
  "Guías prácticas de plomería, electricidad, pintura y herramientas del equipo de Ferretería 57 en Querétaro. Descarga las guías en PDF con Club 57.";

// alternates de cada página del blog: canonical propio (sin www) + el feed
// RSS. Va completo en cada página porque Next reemplaza `alternates`
// entero al fusionar metadata (no se puede heredar solo el RSS del layout).
export function blogAlternates(path: string): Metadata["alternates"] {
  return {
    canonical: canonicalUrl(path),
    types: { "application/rss+xml": [{ url: canonicalUrl("/blog/rss.xml"), title: "Blog de Ferretería 57" }] },
  };
}

export const BLOG_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  "max-image-preview": "large",
};

export const BLOG_ROBOTS_NOINDEX: Metadata["robots"] = { index: false, follow: true };
