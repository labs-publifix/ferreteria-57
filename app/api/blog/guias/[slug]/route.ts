import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getArticleBySlug } from "@/lib/blog/content";
import { getGuideBySlug } from "@/lib/blog/guide-content";
import { contentDispositionPdf, decideGuideDownload, rateWindowStart } from "@/lib/blog/guide-access";
import { guideArticleUrl, guideFileName, renderGuidePdf } from "@/lib/blog/guide-pdf";
import { getNow } from "@/lib/blog/now";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } });
}

// Descarga protegida de la guía PDF de un artículo del blog (mismo patrón
// que /api/club57/promociones/[id]/descargar). Las reglas viven en
// lib/blog/guide-access.ts: 401 sin sesión, 403 sin membresía, 404 si no
// existe o no está publicado (getNow()), 429 con más de 20 descargas en la
// última hora. El PDF se genera aquí mismo (nada se guarda en Storage) y
// cada descarga exitosa deja una fila en blog_guide_downloads.
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isMember = false;
  if (user) {
    const { data: member, error: memberError } = await createAdminClient()
      .from("club57_members")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (memberError) return jsonError(500, "No se pudo verificar tu membresía. Intenta de nuevo.");
    isMember = member !== null;
  }

  const article = getArticleBySlug(params.slug);
  const guide = getGuideBySlug(params.slug);

  const input = { hasUser: !!user, isMember, article, hasGuide: !!guide, now: getNow(), recentDownloads: 0 };
  // El conteo de la última hora solo se consulta cuando todo lo demás ya pasó.
  const precheck = decideGuideDownload(input);
  if (!precheck.ok) return jsonError(precheck.status, precheck.error);

  const { count, error: countError } = await supabase
    .from("blog_guide_downloads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .gte("downloaded_at", rateWindowStart());
  if (countError) return jsonError(500, "No se pudo preparar tu descarga. Intenta de nuevo.");
  const access = decideGuideDownload({ ...input, recentDownloads: count ?? 0 });
  if (!access.ok) {
    const response = jsonError(access.status, access.error);
    if (access.status === 429) response.headers.set("Retry-After", "3600");
    return response;
  }

  const { bytes } = await renderGuidePdf({ guide: guide!, articleTitle: article!.title, articleUrl: guideArticleUrl(article!.slug) });

  const { error: logError } = await supabase
    .from("blog_guide_downloads")
    .insert({ user_id: user!.id, topic_id: article!.topicId, slug: article!.slug });
  if (logError) console.error("[guía blog] no se registró la descarga:", logError.message);

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDispositionPdf(guideFileName(article!.slug)),
      "Content-Length": String(bytes.length),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
