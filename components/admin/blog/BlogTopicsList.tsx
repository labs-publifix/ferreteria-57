"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { ConfirmDialog } from "@/components/ui";
import type { TopicView } from "@/lib/blog/backlog-view";
import { setTopicDescartado } from "@/app/(admin)/admin/(protected)/blog/actions";
import { describeActionFailure } from "@/lib/admin/describeActionFailure";
import { FechaProgramada } from "./FechaProgramada";
import { TopicEstadoBadge } from "./TopicEstadoBadge";
import { descargasLabel, GuiaEstadoBadge, VerGuia } from "./GuiaEstado";

const ORIGEN_LABEL = { cliente: "Cliente", propuesto: "Propuesto" } as const;

const actionClass =
  "inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 font-sans text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate disabled:opacity-50";

function puedeCambiarDescarte(topic: TopicView): boolean {
  return topic.estado === "pendiente" || topic.estado === "descartado";
}

function ExpandButton({ topic, expanded, onToggle, label }: { topic: TopicView; expanded: boolean; onToggle: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={`detalle-${topic.id}`}
      className={`${actionClass} text-brand-slate hover:bg-brand-gray`}
    >
      <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
      {label ?? <span className="sr-only">{expanded ? `Ocultar detalle de ${topic.id}` : `Ver detalle de ${topic.id}`}</span>}
    </button>
  );
}

function VerArticulo({ topic }: { topic: TopicView }) {
  if (topic.estado !== "publicado" || !topic.slug) return null;
  return (
    <Link
      href={`/blog/${topic.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`${actionClass} whitespace-nowrap text-brand-black underline-offset-2 hover:underline`}
    >
      <ExternalLink className="size-4" aria-hidden="true" />
      Ver artículo
    </Link>
  );
}

function Detalle({
  topic,
  pending,
  error,
  onAccion,
}: {
  topic: TopicView;
  pending: boolean;
  error?: string;
  onAccion: () => void;
}) {
  const filas: [string, React.ReactNode][] = [
    ["Keyword", topic.keyword],
    ["Slug", topic.slug ? <span className="break-all font-mono text-xs">/blog/{topic.slug}</span> : null],
    ["Audiencia", topic.audiencia],
    ["Rol", topic.rol],
    ["Etapa", topic.etapa],
    ["Origen", topic.origen ? ORIGEN_LABEL[topic.origen] : null],
    ["Guía PDF", topic.guia_titulo],
  ];
  return (
    <div id={`detalle-${topic.id}`} className="flex flex-col gap-3">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 font-sans text-sm sm:grid-cols-[auto_1fr]">
        {filas.map(([label, value]) => (
          <Fragment key={label}>
            <dt className="font-semibold text-brand-slate">{label}</dt>
            <dd className="min-w-0 break-words text-brand-black">{value ?? <span className="text-brand-slate">—</span>}</dd>
          </Fragment>
        ))}
      </dl>
      {puedeCambiarDescarte(topic) && (
        <div className="-ml-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onAccion}
            className={`${actionClass} ${topic.descartado ? "text-brand-black hover:bg-brand-gray" : "text-red-700 hover:bg-red-50"}`}
          >
            {pending ? "Guardando…" : topic.descartado ? "Restaurar" : "Descartar tema"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function BlogTopicsList({ topics }: { topics: TopicView[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<TopicView | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirmar() {
    if (!confirm) return;
    const topic = confirm;
    setConfirm(null);
    setPendingId(topic.id);
    setErrors((current) => ({ ...current, [topic.id]: "" }));
    let message: string | undefined;
    try {
      message = (await setTopicDescartado(topic.id, !topic.descartado)).error;
    } catch (error) {
      message = (await describeActionFailure(error, "guardar el cambio")).message;
    }
    if (message) setErrors((current) => ({ ...current, [topic.id]: message! }));
    setPendingId(null);
    router.refresh();
  }

  return (
    <>
      {/* Escritorio (≥1280 px, donde cabe sin scroll): tabla */}
      <div className="relative hidden min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm xl:block">
        <table className="w-full text-left font-sans text-sm">
          <caption className="sr-only">Temas del backlog del blog</caption>
          <thead className="border-b border-brand-gray text-xs uppercase tracking-wide text-brand-slate">
            <tr>
              <th scope="col" className="px-3 py-3 font-semibold">ID</th>
              <th scope="col" className="px-3 py-3 font-semibold">Fecha</th>
              <th scope="col" className="px-3 py-3 font-semibold">Título</th>
              <th scope="col" className="px-3 py-3 font-semibold">Clúster</th>
              <th scope="col" className="px-3 py-3 font-semibold">Tipo</th>
              <th scope="col" className="px-3 py-3 font-semibold">Estado</th>
              <th scope="col" className="px-3 py-3 font-semibold">Guía</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Descargas</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => {
              const abierto = expanded.has(topic.id);
              return (
                <Fragment key={topic.id}>
                  <tr className={`border-b border-brand-gray align-top ${topic.descartado ? "text-brand-slate" : ""}`}>
                    <td className="whitespace-nowrap py-1.5 pl-1 pr-2">
                      <button
                        type="button"
                        onClick={() => toggle(topic.id)}
                        aria-expanded={abierto}
                        aria-controls={`detalle-${topic.id}`}
                        aria-label={`${abierto ? "Ocultar" : "Ver"} detalle de ${topic.id}`}
                        className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 font-display text-sm text-brand-black hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                      >
                        <ChevronDown className={`size-4 text-brand-slate transition-transform ${abierto ? "rotate-180" : ""}`} aria-hidden="true" />
                        {topic.id}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <FechaProgramada fecha={topic.fecha_programada} />
                    </td>
                    <td className="min-w-[13rem] px-3 py-3 font-medium text-brand-black">{topic.titulo}</td>
                    <td className="px-3 py-3 text-brand-slate">{topic.cluster}</td>
                    <td className="px-3 py-3 text-brand-slate">{topic.tipo}</td>
                    <td className="px-3 py-3">
                      <TopicEstadoBadge estado={topic.estado} atrasado={topic.atrasado} />
                      <div className="-mb-2 -ml-3 mt-0.5">
                        <VerArticulo topic={topic} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <GuiaEstadoBadge topic={topic} />
                      <div className="-mb-2 -ml-3 mt-0.5">
                        <VerGuia topic={topic} className={actionClass} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-display tabular-nums text-brand-black">
                      {topic.descargas ?? 0}
                    </td>
                  </tr>
                  {abierto && (
                    <tr className="border-b border-brand-gray bg-brand-gray/40">
                      <td colSpan={8} className="px-4 py-4">
                        <Detalle
                          topic={topic}
                          pending={pendingId === topic.id}
                          error={errors[topic.id]}
                          onAccion={() => setConfirm(topic)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Móvil y tableta: tarjetas */}
      <ul className="flex flex-col gap-3 xl:hidden">
        {topics.map((topic) => {
          const abierto = expanded.has(topic.id);
          return (
            <li key={topic.id} className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-display text-sm text-brand-black">{topic.id}</span>
                  <FechaProgramada fecha={topic.fecha_programada} inline />
                </div>
                <TopicEstadoBadge estado={topic.estado} atrasado={topic.atrasado} />
              </div>
              <p className={`break-words font-sans text-base font-semibold leading-snug ${topic.descartado ? "text-brand-slate" : "text-brand-black"}`}>
                {topic.titulo}
              </p>
              <p className="break-words font-sans text-xs text-brand-slate">
                {[topic.cluster, topic.tipo].filter(Boolean).join(" · ")}
              </p>
              {topic.guia_titulo && (
                <p className="break-words font-sans text-sm text-brand-black">
                  <span className="font-semibold text-brand-slate">Guía PDF: </span>
                  {topic.guia_titulo}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 font-sans text-xs text-brand-slate">
                <GuiaEstadoBadge topic={topic} />
                <span>{descargasLabel(topic.descargas)}</span>
              </div>
              <div className="-ml-3 flex flex-wrap items-center">
                <ExpandButton topic={topic} expanded={abierto} onToggle={() => toggle(topic.id)} label={abierto ? "Ocultar detalle" : "Ver detalle"} />
                <VerArticulo topic={topic} />
                <VerGuia topic={topic} className={actionClass} />
              </div>
              {abierto && (
                <div className="border-t border-brand-gray pt-3">
                  <Detalle topic={topic} pending={pendingId === topic.id} error={errors[topic.id]} onAccion={() => setConfirm(topic)} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.descartado ? "Restaurar tema" : "Descartar tema"}
        description={
          confirm
            ? confirm.descartado
              ? `«${confirm.titulo}» (${confirm.id}) vuelve a la lista de pendientes.`
              : `«${confirm.titulo}» (${confirm.id}) saldrá de los pendientes. Puedes restaurarlo cuando quieras.`
            : undefined
        }
        confirmLabel={confirm?.descartado ? "Restaurar" : "Descartar"}
        tone={confirm?.descartado ? "neutral" : "danger"}
        onConfirm={confirmar}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
