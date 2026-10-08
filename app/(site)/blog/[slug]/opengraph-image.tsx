import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/blog/content";
import { OG_SIZE, renderBlogOg } from "@/lib/blog/og";
import { getNow } from "@/lib/blog/now";
import { isVisible } from "@/lib/blog/visibility";

export const runtime = "nodejs";
export const alt = "Artículo del blog de Ferretería 57";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

// Tarjeta del artículo: color del clúster, número del tema y título. Un
// programado no tiene imagen en producción (misma regla que la página).
export default function Image({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article || !isVisible(article, getNow())) notFound();
  return renderBlogOg({
    tema: article.clusterInfo.tema,
    eyebrow: article.clusterInfo.nombre,
    title: article.title,
    number: article.number,
  });
}
