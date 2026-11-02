import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { BlogCategoryView } from "@/components/blog/BlogCategoryView";
import { categoryMetadata, clusterFrom } from "@/lib/blog/category-page";

// Render por request (ver app/(site)/blog/[slug]/page.tsx).
export const dynamic = "force-dynamic";

function parsePage(value: string): number | null {
  if (!/^[1-9]\d{0,3}$/.test(value)) return null;
  return Number(value);
}

export function generateMetadata({ params }: { params: { cluster: string; n: string } }): Metadata {
  const page = parsePage(params.n);
  if (!page || page < 2) return {};
  return categoryMetadata(params.cluster, page);
}

export default function BlogCategoriaPaginaPage({ params }: { params: { cluster: string; n: string } }) {
  const cluster = clusterFrom(params.cluster);
  const page = parsePage(params.n);
  if (!cluster || !page) notFound();
  // …/pagina/1 es la categoría: una sola URL por contenido.
  if (page === 1) permanentRedirect(`/blog/categoria/${cluster.slug}`);
  return <BlogCategoryView cluster={cluster} page={page} />;
}
