import { OG_SIZE, renderBlogOg } from "@/lib/blog/og";

export const runtime = "nodejs";
export const alt = "Blog de Ferretería 57: guías y consejos de ferretería";
export const size = OG_SIZE;
export const contentType = "image/png";

// Imagen por defecto de /blog (y de sus páginas).
export default function Image() {
  return renderBlogOg({ tema: "pizarra", eyebrow: "Plomería · Electricidad · Pintura · Herramientas", title: "Guías y consejos de ferretería para tu casa y tu negocio" });
}
