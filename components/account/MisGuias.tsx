"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { ChevronDown, Download, FileText, LoaderCircle } from "lucide-react";
import { Badge, buttonClassName } from "@/components/ui";
import { useGuideDownload } from "@/components/blog/useGuideDownload";
import type { MiGuia } from "@/lib/blog/mis-guias";

const fechaFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Mexico_City",
});

/** Guías que se ven al abrir; el resto con «Mostrar las N restantes». */
const VISIBLES = 5;

// «Mis guías» de Club 57 en /cuenta: las guías PDF de los artículos ya
// publicados, la más reciente primero. Fuera de las pestañas (igual que las
// promociones), pero CERRADA por defecto: una sola fila con el total y las
// nuevas, para no empujar el catálogo de canje hacia abajo conforme el blog
// crece. Se abre sola al llegar desde el blog («Ver todas mis guías» →
// /cuenta#mis-guias).
export function MisGuias({ guias }: { guias: MiGuia[] }) {
  const router = useRouter();
  const { download, downloading } = useGuideDownload(() => router.refresh());
  const listId = useId();
  const [abierto, setAbierto] = useState(false);
  const [todas, setTodas] = useState(false);

  useEffect(() => {
    const abrirSiAncla = () => {
      if (window.location.hash === "#mis-guias") {
        setAbierto(true);
        document.getElementById("mis-guias")?.scrollIntoView({ block: "start" });
      }
    };
    abrirSiAncla();
    window.addEventListener("hashchange", abrirSiAncla);
    return () => window.removeEventListener("hashchange", abrirSiAncla);
  }, []);

  const nuevas = guias.filter((guia) => !guia.descargadaAt).length;
  const visibles = todas ? guias : guias.slice(0, VISIBLES);
  const restantes = guias.length - visibles.length;

  return (
    <section id="mis-guias" aria-labelledby="mis-guias-title" className="flex scroll-mt-24 flex-col gap-3">
      <h2 id="mis-guias-title" className="text-left font-display text-xs uppercase tracking-wide text-brand-slate">
        Mis guías
      </h2>

      {guias.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-white px-5 py-6 text-center shadow-sm sm:flex-row sm:gap-4 sm:text-left">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-gray text-brand-slate">
            <FileText className="size-5" aria-hidden="true" strokeWidth={1.75} />
          </span>
          <p className="font-sans text-sm text-brand-slate">
            Todavía no hay guías publicadas. Cada artículo del blog trae su guía en PDF, gratis para miembros: cuando
            salga la primera, la encontrarás aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white text-left shadow-sm">
          <button
            type="button"
            onClick={() => setAbierto((value) => !value)}
            aria-expanded={abierto}
            aria-controls={listId}
            className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-gray/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-slate"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-gray text-brand-slate">
              <FileText className="size-5" aria-hidden="true" strokeWidth={1.75} />
            </span>
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-sans text-base font-semibold text-brand-black">
                {guias.length === 1 ? "1 guía en PDF" : `${guias.length} guías en PDF`}
              </span>
              {nuevas > 0 && <Badge>{nuevas === 1 ? "1 nueva" : `${nuevas} nuevas`}</Badge>}
            </span>
            <span className="flex shrink-0 items-center gap-1 font-sans text-sm font-semibold text-brand-slate">
              <span className="hidden sm:inline">{abierto ? "Ocultar" : "Ver guías"}</span>
              <ChevronDown
                className={`size-5 transition-transform duration-200 motion-reduce:transition-none ${abierto ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </span>
          </button>

          <div id={listId} hidden={!abierto} className="border-t border-brand-gray">
            <ul className="divide-y divide-brand-gray">
              {visibles.map((guia) => {
                const isDownloading = downloading === guia.slug;
                return (
                  <li key={guia.slug} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-sans text-base font-semibold leading-snug text-brand-black">{guia.titulo}</h3>
                        {guia.descargadaAt ? (
                          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-brand-gray px-2.5 py-1 font-sans text-xs font-semibold text-brand-slate">
                            Descargada el {fechaFormatter.format(new Date(guia.descargadaAt))}
                          </span>
                        ) : (
                          <Badge>Nueva</Badge>
                        )}
                      </div>
                      <p className="mt-1 font-sans text-sm text-brand-slate">
                        Del artículo{" "}
                        <Link href={guia.articuloHref} className="text-brand-black underline underline-offset-2 hover:text-brand-slate">
                          {guia.articuloTitulo}
                        </Link>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => download(guia.slug)}
                      disabled={isDownloading}
                      aria-busy={isDownloading}
                      className={buttonClassName(guia.descargadaAt ? "secondary" : "primary", "w-full shrink-0 text-sm sm:w-auto")}
                    >
                      {isDownloading ? (
                        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Download className="size-4" aria-hidden="true" strokeWidth={2} />
                      )}
                      {isDownloading ? "Preparando…" : "Descargar"}
                      <span className="sr-only"> {guia.titulo} (PDF)</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {restantes > 0 && (
              <div className="border-t border-brand-gray p-2">
                <button
                  type="button"
                  onClick={() => setTodas(true)}
                  className="flex min-h-11 w-full items-center justify-center rounded-md font-sans text-sm font-semibold text-brand-black hover:bg-brand-gray/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                >
                  {restantes === 1 ? "Mostrar la guía restante" : `Mostrar las ${restantes} restantes`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
