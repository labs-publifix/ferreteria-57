import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { BlogTopic } from "@/lib/blog/types";
import { resolveTopicStatus } from "@/lib/blog/topic-status";
import { getRegistryEntry, isBlogAdminMockActive } from "@/lib/blog/registry";
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

export const metadata: Metadata = { title: "Blog — Panel de administración" };
export const dynamic = "force-dynamic";

const COLUMNAS =
  "id, orden, lote, etapa, fecha_programada, dia_semana, cluster, rol, tipo, titulo, slug, keyword, audiencia, guia_titulo, origen, descartado, descartado_at";

// Fase 1 del blog: vista de LECTURA del backlog de temas (blog_topics). El
// estado (publicado / programado / pendiente) no se guarda: se deriva con
// resolveTopicStatus + el registro de artículos. Lectura con la sesión del
// admin (RLS is_admin()), igual que el resto del panel.
export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: { estado?: string; cluster?: string; q?: string };
}) {
  const filtros = parseFiltros(searchParams);
  const supabase = await createClient();
  const { data, error } = await supabase.from("blog_topics").select(COLUMNAS);

  const now = new Date();
  const temas: TopicView[] = ordenarTemas(
    ((data ?? []) as BlogTopic[]).map((topic) => ({
      ...topic,
      ...resolveTopicStatus(topic, getRegistryEntry(topic.id, now), now),
    }))
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
  const mock = isBlogAdminMockActive();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Blog</h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate">
          Backlog de temas del blog con su fecha programada. El estado se calcula solo: un tema pasa a programado o
          publicado cuando tiene artículo. Aquí solo puedes descartar o restaurar temas pendientes.
        </p>
      </div>

      {mock && (
        <p role="status" className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2.5 font-sans text-sm text-amber-900">
          Datos de ejemplo activos (BLOG_ADMIN_MOCK): B01–B03 aparecen publicados y B04–B05 programados. No aplica en
          producción.
        </p>
      )}

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
            {visibles.length === 1 ? "1 tema" : `${visibles.length} temas`}
          </p>
          {visibles.length > 0 ? (
            <BlogTopicsList topics={visibles} />
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
