"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Tags } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui";
import { PRICE_LISTS, type PriceList } from "@/lib/catalog/priceLevels";
import {
  applyStoreList,
  previewStoreList,
  type StoreListPreview,
} from "@/app/(admin)/admin/(protected)/configuracion/preciosActions";

export interface StoreListLogEntry {
  id: number;
  listaAnterior: PriceList;
  listaNueva: PriceList;
  presentaciones: number;
  quien: string | null;
  cuando: string;
}

const dateFormat = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function n(value: number | undefined) {
  return (value ?? 0).toLocaleString("es-MX");
}

export function StoreListSettings({ current, log }: { current: PriceList; log: StoreListLogEntry[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<PriceList>(current);
  const [preview, setPreview] = useState<StoreListPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [applying, startApply] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function choose(list: PriceList) {
    setSelected(list);
    setConfirming(false);
    setMessage(null);
    setPreview(null);
    if (list === current) return;
    setLoadingPreview(true);
    const result = await previewStoreList(list);
    setLoadingPreview(false);
    setPreview(result);
  }

  function apply() {
    startApply(async () => {
      const result = await applyStoreList(selected);
      setConfirming(false);
      if (result.error) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setPreview(null);
      setMessage({
        tone: "ok",
        text: `Listo: la tienda ahora muestra el Precio ${result.listaNueva}. ${n(result.presentacionesCambiadas)} productos cambiaron de precio.`,
      });
      router.refresh();
    });
  }

  const changing = selected !== current;

  return (
    <section aria-labelledby="precios-heading" className="rounded-lg border border-brand-slate/15 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-slate/10">
          <Tags className="size-5 text-brand-slate" aria-hidden="true" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="precios-heading" className="font-display text-base uppercase text-brand-black sm:text-lg">
              Precio de tienda
            </h2>
            <span className="inline-flex items-center rounded-full bg-brand-orange/15 px-2.5 py-0.5 font-sans text-xs font-bold text-brand-black">
              Hoy: Precio {current}
            </span>
          </div>
          <p className="mt-1.5 max-w-prose font-sans text-sm text-brand-slate/70">
            Elige qué lista ve el público en la tienda en línea. Cada producto guarda sus 4 listas; aquí solo decides cuál
            se muestra. Los miembros de Club 57 con una lista asignada seguirán viendo la suya.
          </p>

          <fieldset className="mt-4">
            <legend className="sr-only">Lista que se muestra en la tienda</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRICE_LISTS.map((list) => {
                const isSelected = selected === list;
                return (
                  <label
                    key={list}
                    className={`flex min-h-14 cursor-pointer flex-col justify-center rounded-md border-2 px-3 py-2 font-sans transition-colors focus-within:ring-2 focus-within:ring-brand-slate focus-within:ring-offset-2 ${
                      isSelected ? "border-brand-orange bg-brand-orange/10" : "border-brand-slate/25 hover:border-brand-slate"
                    }`}
                  >
                    <input
                      type="radio"
                      name="lista-tienda"
                      value={list}
                      checked={isSelected}
                      onChange={() => choose(list)}
                      disabled={applying}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold text-brand-black">Precio {list}</span>
                    <span className="text-xs text-brand-slate/70">{list === current ? "Actual" : " "}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div aria-live="polite" className="mt-4 flex flex-col gap-3">
            {changing && loadingPreview && <p className="font-sans text-sm text-brand-slate">Calculando el impacto…</p>}

            {changing && preview?.error && (
              <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
                {preview.error}
              </p>
            )}

            {changing && preview && !preview.error && (
              <div className="flex flex-col gap-3 rounded-md bg-brand-slate/[0.05] p-3 sm:p-4">
                <p className="font-sans text-sm font-semibold text-brand-black">
                  Si cambias de Precio {current} a Precio {selected}:
                </p>
                <dl className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Bajan de precio", value: preview.bajan, tone: "text-green-700" },
                    { label: "Suben de precio", value: preview.suben, tone: "text-amber-700" },
                    { label: "Quedan igual", value: preview.sinCambio, tone: "text-brand-slate" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-md bg-white px-3 py-2">
                      <dt className="font-sans text-xs text-brand-slate/70">{item.label}</dt>
                      <dd className={`font-display text-xl ${item.tone}`}>{n(item.value)}</dd>
                    </div>
                  ))}
                </dl>
                <ul className="flex flex-col gap-1 font-sans text-sm text-brand-slate">
                  {(preview.suben ?? 0) + (preview.bajan ?? 0) > 0 && (
                    <li>
                      Cambio promedio en los que cambian: {preview.cambioPromedioPct! > 0 ? "+" : ""}
                      {preview.cambioPromedioPct?.toLocaleString("es-MX")}%.
                    </li>
                  )}
                  {(preview.ofertasOcultas ?? 0) > 0 && (
                    <li className="text-amber-800">
                      {n(preview.ofertasOcultas)} ofertas dejarían de verse: su «precio antes» ya no sería mayor que el
                      nuevo precio.
                    </li>
                  )}
                  <li>Los pedidos ya hechos no cambian. Puedes volver a la lista anterior cuando quieras.</li>
                </ul>

                {confirming ? (
                  <div role="alertdialog" aria-labelledby="confirm-lista" className="flex flex-col gap-3 rounded-md border-2 border-brand-orange bg-white p-3">
                    <p id="confirm-lista" className="font-sans text-sm text-brand-black">
                      Los precios de la tienda cambian de inmediato para todos los clientes. ¿Cambiar a Precio {selected}?
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button type="button" onClick={apply} disabled={applying}>
                        {applying ? "Cambiando…" : `Sí, cambiar a Precio ${selected}`}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        disabled={applying}
                        className={buttonClassName("secondary")}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={() => setConfirming(true)}>
                      Cambiar a Precio {selected}
                    </Button>
                    <button type="button" onClick={() => choose(current)} className={buttonClassName("secondary")}>
                      Dejar Precio {current}
                    </button>
                  </div>
                )}
              </div>
            )}

            {message && (
              <p
                role={message.tone === "error" ? "alert" : "status"}
                className={`rounded-md px-4 py-2.5 font-sans text-sm ${
                  message.tone === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"
                }`}
              >
                {message.text}
              </p>
            )}
          </div>

          <div className="mt-5 border-t border-brand-slate/10 pt-4">
            <h3 className="font-sans text-sm font-semibold text-brand-black">Bitácora de cambios</h3>
            {log.length === 0 ? (
              <p className="mt-1 font-sans text-sm text-brand-slate/70">Todavía no se ha cambiado la lista de tienda.</p>
            ) : (
              <ul className="mt-2 flex flex-col divide-y divide-brand-slate/10">
                {log.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2 font-sans text-sm">
                    <span className="text-brand-black">
                      Precio {entry.listaAnterior} → <strong>Precio {entry.listaNueva}</strong>
                      <span className="text-brand-slate/70"> · {n(entry.presentaciones)} productos cambiaron</span>
                    </span>
                    <span className="text-xs text-brand-slate/70">
                      {dateFormat.format(new Date(entry.cuando))}
                      {entry.quien ? ` · ${entry.quien}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
