import { getAllArticles, byPublishDesc } from "@/lib/blog/content";
import { BLOG_DESCRIPTION } from "@/lib/blog/metadata";
import { canonicalUrl } from "@/lib/blog/seo";
import { isPublished } from "@/lib/blog/visibility";

// Feed RSS 2.0 del blog: SOLO artículos publicados (nunca los programados,
// ni con BLOG_SHOW_SCHEDULED). Se regenera cada hora.
export const revalidate = 3600;

function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const now = new Date();
  const published = getAllArticles()
    .filter((article) => isPublished(article, now))
    .sort(byPublishDesc);
  const blogUrl = canonicalUrl("/blog");
  const items = published
    .map((article) => {
      const url = canonicalUrl(`/blog/${article.slug}`);
      return `    <item>
      <title>${xml(article.title)}</title>
      <link>${xml(url)}</link>
      <guid isPermaLink="true">${xml(url)}</guid>
      <pubDate>${new Date(article.publishAt).toUTCString()}</pubDate>
      <description>${xml(article.metaDescription)}</description>
      <category>${xml(article.clusterInfo.nombre)}</category>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog de Ferretería 57</title>
    <link>${xml(blogUrl)}</link>
    <description>${xml(BLOG_DESCRIPTION)}</description>
    <language>es-MX</language>
    <atom:link href="${xml(canonicalUrl("/blog/rss.xml"))}" rel="self" type="application/rss+xml" />${
      published.length > 0 ? `\n    <lastBuildDate>${new Date(published[0].updatedAt).toUTCString()}</lastBuildDate>` : ""
    }
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
