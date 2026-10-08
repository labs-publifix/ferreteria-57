import { createClient } from "@/lib/supabase/server";
import { getArticleBySlug } from "@/lib/blog/content";
import { getGuideBySlug } from "@/lib/blog/guide-content";
import { guideArticleUrl, guideFileName, renderGuidePdf } from "@/lib/blog/guide-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function deny(status: 401 | 403 | 404) {
  // Sin detalle: a quien no es admin no se le dice si la guía existe.
  return new Response(null, { status, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
}

// Vista previa del PDF de una guía para el admin: el MISMO PDF que la
// descarga de miembros, en línea, para cualquier tema con guía aunque el
// artículo no esté publicado. El middleware ya manda a /admin/login a quien
// no es admin; esta revisión es la segunda llave (nunca confiar solo en el
// middleware). No registra descargas ni aparece en el sitemap.
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return deny(401);
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) return deny(403);

  const article = getArticleBySlug(params.slug);
  const guide = getGuideBySlug(params.slug);
  if (!article || !guide) return deny(404);

  const { bytes } = await renderGuidePdf({ guide, articleTitle: article.title, articleUrl: guideArticleUrl(article.slug) });
  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${guideFileName(article.slug)}"`,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
