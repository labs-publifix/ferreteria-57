import { CLUSTERS, CLUSTER_SLUGS, type ClusterSlug } from "@/content/blog/clusters";
import { OG_SIZE, renderBlogOg } from "@/lib/blog/og";

export const runtime = "nodejs";
export const alt = "Categoría del blog de Ferretería 57";
export const size = OG_SIZE;
export const contentType = "image/png";

// Categorías: la imagen por defecto del blog, con el color y nombre del
// clúster.
export default function Image({ params }: { params: { cluster: string } }) {
  const cluster = (CLUSTER_SLUGS as readonly string[]).includes(params.cluster) ? CLUSTERS[params.cluster as ClusterSlug] : undefined;
  return renderBlogOg({
    tema: cluster?.tema ?? "pizarra",
    eyebrow: "Guías y consejos",
    title: cluster?.nombre ?? "Guías y consejos de ferretería",
  });
}
