import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { BlogIndexView } from "@/components/blog/BlogIndexView";
import { getAllArticles } from "@/lib/blog/content";
import { BLOG_DESCRIPTION, blogAlternates, blogListingRobots } from "@/lib/blog/metadata";
import { getNow } from "@/lib/blog/now";
import { isPublished } from "@/lib/blog/visibility";
import { blogPagePath, canonicalUrl, fitTitle } from "@/lib/blog/seo";

// Render por request (ver app/(site)/blog/[slug]/page.tsx).
export const dynamic = "force-dynamic";

function parsePage(value: string): number | null {
  if (!/^[1-9]\d{0,3}$/.test(value)) return null;
  return Number(value);
}

export function generateMetadata({ params }: { params: { n: string } }): Metadata {
  const page = parsePage(params.n);
  if (!page || page < 2) return {};
  const title = fitTitle(`Blog de ferretería — página ${page}`);
  return {
    title: { absolute: title },
    description: BLOG_DESCRIPTION,
    alternates: blogAlternates(blogPagePath(page)),
    robots: blogListingRobots(getAllArticles().filter((article) => isPublished(article, getNow())).length),
    openGraph: { type: "website", title, description: BLOG_DESCRIPTION, url: canonicalUrl(blogPagePath(page)), siteName: "Ferretería 57", locale: "es_MX" },
  };
}

export default function BlogPaginaPage({ params }: { params: { n: string } }) {
  const page = parsePage(params.n);
  if (!page) notFound();
  // /blog/pagina/1 es /blog: una sola URL por contenido.
  if (page === 1) permanentRedirect("/blog");
  return <BlogIndexView page={page} />;
}
