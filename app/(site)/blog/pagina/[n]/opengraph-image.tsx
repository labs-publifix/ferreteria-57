import { OG_SIZE, renderBlogOg } from "@/lib/blog/og";

export const runtime = "nodejs";
export const alt = "Blog de Ferretería 57: guías y consejos de ferretería";
export const size = OG_SIZE;
export const contentType = "image/png";

// Páginas 2, 3… del listado: misma imagen que /blog.
export default function Image() {
  return renderBlogOg({ tema: "pizarra", eyebrow: "Plomería · Electricidad · Pintura · Herramientas", title: "Guías y consejos de ferretería para tu casa y tu negocio" });
}
