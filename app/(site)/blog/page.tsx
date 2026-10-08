import type { Metadata } from "next";
import { BlogIndexView } from "@/components/blog/BlogIndexView";
import { getVisibleArticles } from "@/lib/blog/content";
import { BLOG_DESCRIPTION, BLOG_ROBOTS, BLOG_ROBOTS_NOINDEX, BLOG_TITLE, blogAlternates } from "@/lib/blog/metadata";
import { canonicalUrl } from "@/lib/blog/seo";

// Render por request (ver app/(site)/blog/[slug]/page.tsx): un artículo
// programado aparece en cuanto llega su publishAt.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const empty = getVisibleArticles().length === 0;
  return {
    title: { absolute: BLOG_TITLE },
    description: BLOG_DESCRIPTION,
    alternates: blogAlternates("/blog"),
    // Sin artículos todavía: la página existe pero no se indexa vacía.
    robots: empty ? BLOG_ROBOTS_NOINDEX : BLOG_ROBOTS,
    openGraph: {
      type: "website",
      title: BLOG_TITLE,
      description: BLOG_DESCRIPTION,
      url: canonicalUrl("/blog"),
      siteName: "Ferretería 57",
      locale: "es_MX",
    },
    twitter: { card: "summary_large_image", title: BLOG_TITLE, description: BLOG_DESCRIPTION },
  };
}

export default function BlogPage() {
  return <BlogIndexView page={1} />;
}
