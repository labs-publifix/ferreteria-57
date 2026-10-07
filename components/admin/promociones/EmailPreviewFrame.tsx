"use client";

import { useState } from "react";

interface Variante {
  id: string;
  label: string;
  subject: string;
  html: string;
  text: string;
}

const segmentClass = (active: boolean) =>
  `inline-flex min-h-11 items-center rounded-md px-3 font-sans text-sm font-semibold ${
    active ? "bg-brand-slate text-white" : "text-brand-slate hover:bg-brand-gray"
  }`;

export function EmailPreviewFrame({ variantes }: { variantes: Variante[] }) {
  const [varianteId, setVarianteId] = useState(variantes[0]?.id);
  const [ancho, setAncho] = useState<"escritorio" | "movil">("escritorio");
  const [vista, setVista] = useState<"html" | "texto">("html");
  const variante = variantes.find((v) => v.id === varianteId) ?? variantes[0];
  if (!variante) return null;

  return (
    <section className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div role="group" aria-label="Datos de muestra" className="flex flex-wrap gap-1 rounded-lg bg-brand-gray/60 p-1">
          {variantes.map((v) => (
            <button key={v.id} type="button" aria-pressed={v.id === variante.id} onClick={() => setVarianteId(v.id)} className={segmentClass(v.id === variante.id)}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <div role="group" aria-label="Formato" className="flex gap-1 rounded-lg bg-brand-gray/60 p-1">
            <button type="button" aria-pressed={vista === "html"} onClick={() => setVista("html")} className={segmentClass(vista === "html")}>
              Diseño
            </button>
            <button type="button" aria-pressed={vista === "texto"} onClick={() => setVista("texto")} className={segmentClass(vista === "texto")}>
              Texto
            </button>
          </div>
          <div role="group" aria-label="Ancho" className="hidden gap-1 rounded-lg bg-brand-gray/60 p-1 sm:flex">
            <button type="button" aria-pressed={ancho === "escritorio"} onClick={() => setAncho("escritorio")} className={segmentClass(ancho === "escritorio")}>
              Escritorio
            </button>
            <button type="button" aria-pressed={ancho === "movil"} onClick={() => setAncho("movil")} className={segmentClass(ancho === "movil")}>
              Móvil
            </button>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-1 rounded-md bg-brand-gray/50 px-4 py-3 font-sans text-sm sm:grid-cols-[auto_1fr] sm:gap-x-3">
        <dt className="font-semibold text-brand-slate">Asunto</dt>
        <dd className="break-words text-brand-black">{variante.subject}</dd>
        <dt className="font-semibold text-brand-slate">Adjuntos</dt>
        <dd className="text-brand-black">Ninguno</dd>
      </dl>

      {vista === "html" ? (
        <div className="overflow-hidden rounded-md border border-brand-slate/15 bg-brand-gray">
          <iframe
            title={`Vista previa: ${variante.subject}`}
            srcDoc={variante.html}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            className="mx-auto block h-[1100px] w-full bg-brand-gray"
            style={{ maxWidth: ancho === "movil" ? 375 : 680 }}
          />
        </div>
      ) : (
        <pre className="max-h-[700px] overflow-auto whitespace-pre-wrap break-words rounded-md bg-brand-gray/60 p-4 font-mono text-xs text-brand-black">
          {variante.text}
        </pre>
      )}
    </section>
  );
}
