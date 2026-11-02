import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogCategoryView } from "@/components/blog/BlogCategoryView";
import { categoryMetadata, clusterFrom } from "@/lib/blog/category-page";

// Render por request (ver app/(site)/blog/[slug]/page.tsx).
export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { cluster: string } }): Metadata {
  return categoryMetadata(params.cluster, 1);
}

export default function BlogCategoriaPage({ params }: { params: { cluster: string } }) {
  const cluster = clusterFrom(params.cluster);
  if (!cluster) notFound();
  return <BlogCategoryView cluster={cluster} page={1} />;
}
