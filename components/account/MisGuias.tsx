"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, FileText, LoaderCircle } from "lucide-react";
import { Badge, buttonClassName } from "@/components/ui";
import { useGuideDownload } from "@/components/blog/useGuideDownload";
import type { MiGuia } from "@/lib/blog/mis-guias";

const fechaFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Mexico_City",
});

// «Mis guías» de Club 57 en /cuenta: las guías PDF de los artículos ya
// publicados, la más reciente primero. Fuera de las pestañas (igual que las
// promociones) y con ancla #mis-guias para «Ver todas mis guías» del blog.
export function MisGuias({ guias }: { guias: MiGuia[] }) {
  const router = useRouter();
  const { download, downloading } = useGuideDownload(() => router.refresh());

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
        <ul className="divide-y divide-brand-gray overflow-hidden rounded-lg bg-white text-left shadow-sm">
          {guias.map((guia) => {
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
      )}
    </section>
  );
}
