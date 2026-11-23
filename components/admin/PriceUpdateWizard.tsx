"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Download, Upload } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui";
import { formatPrice } from "@/lib/formatPrice";
import { PRICE_LISTS, type PriceList } from "@/lib/catalog/priceLevels";
import {
  bestMatchingList,
  buildPriceImportReport,
  type PriceImportPreviewRow,
  type PriceImportResultRow,
  type PriceImportSummary,
} from "@/lib/catalog/priceImport";
import {
  commitPriceUpdate,
  parsePriceUpdateFile,
  type CommitPriceImportResult,
} from "@/app/(admin)/admin/(protected)/productos/importar/preciosActions";

type Step = "upload" | "preview" | "summary";
type Filter = "all" | "ready" | "warnings" | "errors";

const PAGE = 200;

function downloadReport(rows: PriceImportPreviewRow[], results: PriceImportResultRow[], storeList: PriceList) {
  const csv = buildPriceImportReport(rows, new Map(results.map((r) => [r.rowNumber, r])), storeList);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
  link.href = url;
  link.download = `reporte-precios-${day}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function StatusBadge({ row }: { row: PriceImportPreviewRow }) {
  if (row.status === "error") {
    return <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Error</span>;
  }
  if (row.status === "unchanged") {
    return (
      <span className="inline-flex rounded-full bg-brand-slate/10 px-2.5 py-1 text-xs font-semibold text-brand-slate">
        Sin cambios
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
      Se actualizará
    </span>
  );
}

function PriceCell({ value, before, highlight }: { value: number | null; before: number | null; highlight: boolean }) {
  const changed = value !== null && before !== null && Math.abs(value - before) >= 0.005;
  return (
    <td className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${highlight ? "bg-brand-orange/[0.06]" : ""}`}>
      <span className={changed ? "font-semibold text-brand-black" : "text-brand-slate"}>
        {value === null ? "—" : formatPrice(value)}
      </span>
      {changed && <span className="block text-xs text-brand-slate/60">antes {formatPrice(before)}</span>}
    </td>
  );
}

export function PriceUpdateWizard({ modeToggle }: { modeToggle: ReactNode }) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PriceImportPreviewRow[]>([]);
  const [summary, setSummary] = useState<PriceImportSummary | null>(null);
  const [storeList, setStoreList] = useState<PriceList>(2);
  const [notInFile, setNotInFile] = useState<number | undefined>();
  const [filter, setFilter] = useState<Filter>("all");
  const [visible, setVisible] = useState(PAGE);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<CommitPriceImportResult | null>(null);

  const filtered = useMemo(() => {
    if (filter === "ready") return rows.filter((r) => r.status === "ready");
    if (filter === "warnings") return rows.filter((r) => r.warnings.length > 0);
    if (filter === "errors") return rows.filter((r) => r.status === "error");
    return rows;
  }, [rows, filter]);

  const storeChanges = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.status === "ready" &&
          r.newStorePrice !== null &&
          r.currentStorePrice !== null &&
          Math.abs(r.newStorePrice - r.currentStorePrice) >= 0.005
      ).length,
    [rows]
  );

  async function handleUpload() {
    if (!file) {
      setError("Elige un archivo .xlsx o .csv.");
      return;
    }
    setBusy(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const parsed = await parsePriceUpdateFile(formData);
    setBusy(false);
    if (parsed.error || !parsed.rows || !parsed.summary) {
      setError(parsed.error ?? "No se pudo leer el archivo.");
      return;
    }
    setRows(parsed.rows);
    setSummary(parsed.summary);
    setStoreList(parsed.storeList ?? 2);
    setNotInFile(parsed.notInFile);
    setFilter("all");
    setVisible(PAGE);
    setStep("preview");
  }

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    const payload = rows
      .filter((r) => r.status === "ready" && r.levels)
      .map((r) => ({ rowNumber: r.rowNumber, codigo: r.codigo, precios: [...r.levels!] }));
    const committed = await commitPriceUpdate(payload);
    setBusy(false);
    setConfirming(false);
    if (committed.error) {
      setError(committed.error);
      return;
    }
    setResult(committed);
    setStep("summary");
  }

  function reset() {
    setStep("upload");
    setFile(null);
    setRows([]);
    setSummary(null);
    setResult(null);
    setError(null);
    setConfirming(false);
  }

  if (step === "upload") {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {modeToggle}
          <a href="/api/admin/productos/exportar" className={buttonClassName("secondary", "shrink-0")}>
            <Download className="size-4" aria-hidden="true" strokeWidth={2} />
            Exportar precios actuales
          </a>
        </div>

        <div className="flex max-w-prose flex-col gap-2 font-sans text-sm text-brand-slate">
          <p>
            Sube el Excel con las columnas <strong>Código</strong>, <strong>Precio 1</strong>, <strong>Precio 2</strong>,{" "}
            <strong>Precio 3</strong> y <strong>Precio 4</strong> (el mismo formato de la exportación de productos y del
            archivo de listas de Truper; los precios pueden ser fórmulas). Cada fila se busca por su Código.
          </p>
          <p>
            Solo se actualizan las 4 listas de precio. Nombre, stock, estado, categoría y destacado no se tocan aunque el
            archivo traiga esas columnas. Antes de guardar verás el precio actual contra el nuevo.
          </p>
        </div>

        <label className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-brand-slate/30 px-4 py-6 font-sans text-sm text-brand-slate hover:border-brand-slate/50">
          <Upload className="size-4" aria-hidden="true" strokeWidth={1.75} />
          {file ? file.name : "Elegir archivo .xlsx o .csv"}
          <input
            type="file"
            accept=".xlsx,.csv"
            className="sr-only"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError(null);
            }}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {error}
          </p>
        )}

        <Button type="button" onClick={handleUpload} disabled={busy} className="w-full sm:w-auto sm:self-start">
          {busy ? "Leyendo archivo…" : "Subir y revisar"}
        </Button>
      </div>
    );
  }

  if (step === "preview" && summary) {
    const best = bestMatchingList(summary);
    const valid = summary.ready + summary.unchanged;
    const filters: { value: Filter; label: string; count: number }[] = [
      { value: "all", label: "Todas", count: rows.length },
      { value: "ready", label: "Con cambios", count: summary.ready },
      { value: "warnings", label: "Con aviso", count: summary.withWarnings },
      { value: "errors", label: "Con error", count: summary.errors },
    ];

    return (
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6" aria-label="Resumen del archivo">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Se actualizarán", value: summary.ready, tone: "text-green-700" },
              { label: "Sin cambios", value: summary.unchanged, tone: "text-brand-slate" },
              { label: "Con aviso", value: summary.withWarnings, tone: "text-amber-700" },
              { label: "Con error (no se tocan)", value: summary.errors, tone: "text-red-700" },
            ].map((item) => (
              <div key={item.label} className="rounded-md border border-brand-slate/15 px-3 py-2.5">
                <dt className="font-sans text-xs text-brand-slate/70">{item.label}</dt>
                <dd className={`font-display text-2xl ${item.tone}`}>{item.value.toLocaleString("es-MX")}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-md bg-brand-slate/[0.05] p-3 sm:p-4">
            <p className="font-sans text-sm font-semibold text-brand-black">¿Con qué lista coincide el precio actual de la tienda?</p>
            {valid > 0 ? (
              <>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {PRICE_LISTS.map((list) => (
                    <li
                      key={list}
                      className={`rounded-full px-3 py-1 font-sans text-xs ${
                        list === best ? "bg-brand-orange/15 font-semibold text-brand-black" : "bg-white text-brand-slate"
                      }`}
                    >
                      Precio {list}: {summary.currentMatches[list].toLocaleString("es-MX")}
                    </li>
                  ))}
                  <li className="rounded-full bg-white px-3 py-1 font-sans text-xs text-brand-slate">
                    Ninguna: {summary.currentMatchesNone.toLocaleString("es-MX")}
                  </li>
                </ul>
                {best && (
                  <p className="mt-2 font-sans text-sm text-brand-slate">
                    El precio actual coincide con <strong>Precio {best}</strong> en{" "}
                    {summary.currentMatches[best].toLocaleString("es-MX")} de {valid.toLocaleString("es-MX")} productos.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 font-sans text-sm text-brand-slate">Ninguna fila válida para comparar.</p>
            )}
            <p className="mt-2 font-sans text-sm text-brand-slate">
              Hoy el precio de tienda es el <strong>Precio {storeList}</strong>: al guardar, la tienda mostrará el Precio{" "}
              {storeList} de este archivo ({storeChanges.toLocaleString("es-MX")} productos cambian de precio visible). Puedes
              cambiar la lista de tienda en Configuración → Precios.
            </p>
            {notInFile !== undefined && notInFile > 0 && (
              <p className="mt-1 font-sans text-sm text-brand-slate/70">
                {notInFile.toLocaleString("es-MX")} presentaciones de la tienda no vienen en el archivo: se quedan como están.
              </p>
            )}
          </div>
        </section>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar filas">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => {
                setFilter(f.value);
                setVisible(PAGE);
              }}
              className={`min-h-9 rounded-full border px-3 font-sans text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate ${
                filter === f.value
                  ? "border-brand-slate bg-brand-slate text-white"
                  : "border-brand-slate/30 bg-white text-brand-black hover:border-brand-slate"
              }`}
            >
              {f.label} ({f.count.toLocaleString("es-MX")})
            </button>
          ))}
        </div>

        <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full min-w-[960px] text-left font-sans text-sm">
            <caption className="sr-only">Precios del archivo comparados con los actuales</caption>
            <thead>
              <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                <th scope="col" className="px-3 py-2.5">Fila</th>
                <th scope="col" className="px-3 py-2.5">Código</th>
                <th scope="col" className="px-3 py-2.5">Producto</th>
                {PRICE_LISTS.map((list) => (
                  <th
                    key={list}
                    scope="col"
                    className={`px-3 py-2.5 text-right ${list === storeList ? "bg-brand-orange/[0.06] text-brand-black" : ""}`}
                  >
                    Precio {list}
                    {list === storeList && <span className="block text-[10px] normal-case tracking-normal">tienda</span>}
                  </th>
                ))}
                <th scope="col" className="px-3 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, visible).map((row) => (
                <tr key={row.rowNumber} className="border-b border-brand-slate/10 align-top last:border-0">
                  <td className="px-3 py-2 text-brand-slate/70">{row.rowNumber}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-brand-black">{row.codigo || "—"}</td>
                  <td className="max-w-[260px] px-3 py-2 text-brand-black">
                    {row.productName ?? <span className="text-brand-slate/60">—</span>}
                  </td>
                  {PRICE_LISTS.map((list) => (
                    <PriceCell
                      key={list}
                      value={row.levels ? row.levels[list - 1] : null}
                      before={row.currentLevels ? row.currentLevels[list - 1] : null}
                      highlight={list === storeList}
                    />
                  ))}
                  <td className="px-3 py-2">
                    <div className="flex max-w-[260px] flex-col gap-1.5">
                      <StatusBadge row={row} />
                      {row.errors.map((message) => (
                        <p key={message} className="font-sans text-xs text-red-700">
                          {message}
                        </p>
                      ))}
                      {row.warnings.map((message) => (
                        <p key={message} className="flex gap-1 font-sans text-xs text-amber-800">
                          <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                          {message}
                        </p>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-brand-slate/70">
                    No hay filas con este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > visible && (
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE)}
            className={buttonClassName("secondary", "self-start")}
          >
            Mostrar {Math.min(PAGE, filtered.length - visible).toLocaleString("es-MX")} filas más
          </button>
        )}

        {confirming ? (
          <div role="alertdialog" aria-labelledby="confirm-precios" className="flex flex-col gap-3 rounded-lg border-2 border-brand-orange bg-white p-4 sm:p-5">
            <p id="confirm-precios" className="font-sans text-sm text-brand-black">
              Se guardarán las listas de <strong>{summary.ready.toLocaleString("es-MX")}</strong> productos;{" "}
              <strong>{storeChanges.toLocaleString("es-MX")}</strong> cambian de precio en la tienda de inmediato.
              {summary.errors > 0 && ` Las ${summary.errors.toLocaleString("es-MX")} filas con error no se tocan.`}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={handleConfirm} disabled={busy}>
                {busy ? "Guardando precios…" : "Sí, actualizar precios"}
              </Button>
              <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={buttonClassName("secondary")}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => setConfirming(true)} disabled={summary.ready === 0}>
              Actualizar {summary.ready.toLocaleString("es-MX")} productos
            </Button>
            <button type="button" onClick={() => downloadReport(rows, [], storeList)} className={buttonClassName("secondary")}>
              <Download className="size-4" aria-hidden="true" strokeWidth={2} />
              Descargar revisión
            </button>
            <button type="button" onClick={reset} className={buttonClassName("secondary")}>
              Elegir otro archivo
            </button>
          </div>
        )}
      </div>
    );
  }

  // step === "summary"
  const results = result?.results ?? [];
  const failedRows = results.filter((r) => r.outcome === "failed");
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
      <h2 className="font-display text-base uppercase text-brand-slate">Precios actualizados</h2>
      <p className="font-sans text-sm text-brand-black">
        <span className="font-semibold text-green-700">{(result?.updated ?? 0).toLocaleString("es-MX")}</span> productos
        actualizados ({(result?.storePriceChanged ?? 0).toLocaleString("es-MX")} con nuevo precio de tienda)
        {" · "}
        <span className="font-semibold text-brand-slate">{(result?.unchanged ?? 0).toLocaleString("es-MX")}</span> sin cambios
        {" · "}
        <span className="font-semibold text-red-700">
          {((result?.failed ?? 0) + (summary?.errors ?? 0)).toLocaleString("es-MX")}
        </span>{" "}
        con error
      </p>
      {failedRows.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-md bg-red-50 p-3 font-sans text-xs text-red-700">
          {failedRows.map((r) => (
            <li key={r.rowNumber}>
              Fila {r.rowNumber}: {r.detail}
            </li>
          ))}
        </ul>
      )}
      <p className="font-sans text-sm text-brand-slate">
        El reporte trae cada fila del archivo con su resultado, el precio de tienda anterior y el nuevo.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => downloadReport(rows, results, storeList)} className={buttonClassName("primary")}>
          <Download className="size-4" aria-hidden="true" strokeWidth={2} />
          Descargar reporte
        </button>
        <Link href="/admin/productos" className={buttonClassName("secondary")}>
          Ver productos
        </Link>
        <button type="button" onClick={reset} className={buttonClassName("secondary")}>
          Subir otro archivo
        </button>
      </div>
    </div>
  );
}
