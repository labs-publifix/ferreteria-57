import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { BlogTopic } from "@/lib/blog/types";
import { resolveTopicStatus } from "@/lib/blog/topic-status";
import { getNow } from "@/lib/blog/now";
import { getRegistryEntry } from "@/lib/blog/registry";
import { getGuideBySlug } from "@/lib/blog/guide-content";
import {
  clustersDe,
  filtrarTemas,
  ordenarTemas,
  parseFiltros,
  resumenBacklog,
  type EstadoFiltro,
  type TopicView,
} from "@/lib/blog/backlog-view";
import { BlogSummary } from "@/components/admin/blog/BlogSummary";
import { BlogFilters } from "@/components/admin/blog/BlogFilters";
import { BlogTopicsList } from "@/components/admin/blog/BlogTopicsList";
import { BlogPagination } from "@/components/admin/blog/BlogPagination";

export const metadata: Metadata = { title: "Blog — Panel de administración" };
export const dynamic = "force-dynamic";

const TEMAS_POR_PAGINA = 20;

const COLUMNAS =
  "id, orden, lote, etapa, fecha_programada, dia_semana, cluster, rol, tipo, titulo, slug, keyword, audiencia, guia_titulo, origen, descartado, descartado_at";

// Fase 1 del blog: vista de LECTURA del backlog de temas (blog_topics). El
// estado (publicado / programado / pendiente) no se guarda: se deriva con
// resolveTopicStatus + el registro de artículos. Lectura con la sesión del
// admin (RLS is_admin()), igual que el resto del panel.
export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: { estado?: string; cluster?: string; q?: string; pagina?: string };
}) {
  const filtros = parseFiltros(searchParams);
  const supabase = await createClient();
  const [{ data, error }, { data: conteos }] = await Promise.all([
    supabase.from("blog_topics").select(COLUMNAS),
    supabase.from("blog_guide_download_counts").select("topic_id, descargas"),
  ]);
  const descargas = new Map(((conteos ?? []) as { topic_id: string; descargas: number }[]).map((row) => [row.topic_id, row.descargas]));

  const now = getNow();
  const temas: TopicView[] = ordenarTemas(
    ((data ?? []) as BlogTopic[]).map((topic) => {
      const entry = getRegistryEntry(topic.id);
      // El enlace "Ver artículo" usa el slug real del archivo del artículo.
      return {
        ...topic,
        slug: entry?.slug ?? topic.slug,
        ...resolveTopicStatus(topic, entry, now),
        guiaDisponible: entry ? getGuideBySlug(entry.slug) !== undefined : false,
        descargas: descargas.get(topic.id) ?? 0,
      };
    })
  );
  const resumen = resumenBacklog(temas);
  const sinEstado = filtrarTemas(temas, { ...filtros, estado: "todos" });
  const conteoPorEstado: Record<EstadoFiltro, number> = {
    todos: sinEstado.length,
    pendiente: 0,
    programado: 0,
    publicado: 0,
    descartado: 0,
  };
  for (const tema of sinEstado) conteoPorEstado[tema.estado] += 1;
  const visibles = filtrarTemas(temas, filtros);
  const totalPaginas = Math.max(1, Math.ceil(visibles.length / TEMAS_POR_PAGINA));
  const pagina = Math.min(totalPaginas, Math.max(1, Number.parseInt(searchParams.pagina ?? "1", 10) || 1));
  const desde = (pagina - 1) * TEMAS_POR_PAGINA;
  const temasPagina = visibles.slice(desde, desde + TEMAS_POR_PAGINA);

  function hrefPagina(n: number): string {
    const params = new URLSearchParams();
    if (filtros.estado !== "todos") params.set("estado", filtros.estado);
    if (filtros.cluster) params.set("cluster", filtros.cluster);
    if (filtros.q) params.set("q", filtros.q);
    if (n > 1) params.set("pagina", String(n));
    const query = params.toString();
    return query ? `/admin/blog?${query}` : "/admin/blog";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Blog</h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate">
          Backlog de temas del blog con su fecha programada. El estado se calcula solo: un tema pasa a programado o
          publicado cuando tiene artículo. Aquí solo puedes descartar o restaurar temas pendientes y revisar el PDF de
          cada guía disponible.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 font-sans text-sm text-red-700">
          No se pudo cargar el backlog del blog: {error.message}
        </p>
      ) : temas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="font-display text-base uppercase text-brand-slate">El backlog está vacío</p>
          <p className="max-w-prose font-sans text-sm text-brand-slate">
            Todavía no hay temas cargados. Se cargan desde el archivo del backlog con el script de seed del blog.
          </p>
        </div>
      ) : (
        <>
          <BlogSummary resumen={resumen} />
          <BlogFilters filtros={filtros} clusters={clustersDe(temas)} conteoPorEstado={conteoPorEstado} />
          <p className="-mb-3 font-sans text-sm text-brand-slate" aria-live="polite">
            {visibles.length === 0
              ? "0 temas"
              : totalPaginas > 1
                ? `Mostrando ${desde + 1}–${desde + temasPagina.length} de ${visibles.length} temas`
                : visibles.length === 1
                  ? "1 tema"
                  : `${visibles.length} temas`}
          </p>
          {visibles.length > 0 ? (
            <>
              <BlogTopicsList topics={temasPagina} />
              <BlogPagination pagina={pagina} totalPaginas={totalPaginas} buildHref={hrefPagina} />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-white p-8 text-center shadow-sm">
              <p className="font-sans text-sm text-brand-slate">Ningún tema coincide con estos filtros.</p>
              <Link href="/admin/blog" className="font-sans text-sm font-semibold text-brand-black underline underline-offset-2">
                Limpiar filtros
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
