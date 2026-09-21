"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui";
import {
  commitCatalogImportRows,
  parseAndValidateCatalogImportFile,
  type CatalogImportCommitRow,
  type CatalogImportCommitSummary,
  type CatalogImportPreviewRow,
} from "@/app/(admin)/admin/(protected)/lealtad/catalogo/importar/actions";

type Step = "upload" | "preview" | "summary";

const inputClass =
  "w-24 rounded-md border border-brand-slate/30 px-2 py-1.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";

export function Club57CatalogImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [rows, setRows] = useState<(CatalogImportPreviewRow & { puntosEditados: number })[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CatalogImportCommitSummary | null>(null);

  const counts = useMemo(() => {
    let ready = 0;
    let errors = 0;
    for (const row of rows) {
      if (row.status === "ready") ready += 1;
      else errors += 1;
    }
    return { ready, errors };
  }, [rows]);

  async function handleUpload() {
    if (!file) {
      setUploadError("Elige un archivo .xlsx o .csv.");
      return;
    }
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await parseAndValidateCatalogImportFile(formData);

    if (result.error || !result.rows) {
      setUploadError(result.error ?? "No se pudo leer el archivo.");
      setIsUploading(false);
      return;
    }

    setRows(result.rows.map((row) => ({ ...row, puntosEditados: row.puntosCalculados ?? 0 })));
    setIsUploading(false);
    setStep("preview");
  }

  function updatePuntos(rowNumber: number, puntos: number) {
    setRows((current) => current.map((row) => (row.rowNumber === rowNumber ? { ...row, puntosEditados: puntos } : row)));
  }

  async function handleConfirmImport() {
    setIsImporting(true);
    setCommitError(null);

    const payload: CatalogImportCommitRow[] = rows.map((row) => ({
      rowNumber: row.rowNumber,
      clave: row.clave,
      descripcion: row.descripcion,
      puntos: row.puntosEditados,
      status: row.status,
    }));

    const result = await commitCatalogImportRows(payload);
    setIsImporting(false);

    if (result.error || !result.summary) {
      setCommitError(result.error ?? "No se pudo completar la importación.");
      return;
    }

    setSummary(result.summary);
    setStep("summary");
  }

  function handleReset() {
    setFile(null);
    setRows([]);
    setUploadError(null);
    setCommitError(null);
    setSummary(null);
    setStep("upload");
  }

  if (step === "upload") {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <p className="font-sans text-sm text-brand-slate">
          El archivo debe traer las columnas <strong>Codigos</strong>, <strong>Clave</strong>,{" "}
          <strong>Descripcion</strong> y <strong>Costos</strong> (el orden no importa, espacios de más en el
          encabezado no afectan). Cada fila se importa como un artículo independiente. Los puntos requeridos
          se calculan solos con la configuración vigente de Club 57 — puedes ajustarlos antes de confirmar.
        </p>

        <label className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-brand-slate/30 px-4 py-6 font-sans text-sm text-brand-slate hover:border-brand-slate/50">
          <Upload className="size-4" aria-hidden="true" strokeWidth={1.75} />
          {file ? file.name : "Elegir archivo .xlsx o .csv"}
          <input
            type="file"
            accept=".xlsx,.csv"
            className="sr-only"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setUploadError(null);
            }}
          />
        </label>

        {uploadError && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {uploadError}
          </p>
        )}

        <Button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full sm:w-auto sm:self-start"
        >
          {isUploading ? "Leyendo archivo…" : "Subir y validar"}
        </Button>
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3 rounded-lg bg-white p-4 shadow-sm sm:p-6">
          <p className="font-sans text-sm text-brand-black">
            <span className="font-semibold text-green-700">{counts.ready}</span> se importarán
            {" · "}
            <span className="font-semibold text-red-700">{counts.errors}</span> con error
          </p>
        </div>

        {commitError && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {commitError}
          </p>
        )}

        <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                <th className="px-3 py-2.5">Fila</th>
                <th className="px-3 py-2.5">Nombre</th>
                <th className="px-3 py-2.5">Costo original</th>
                <th className="px-3 py-2.5">Puntos calculados</th>
                <th className="px-3 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowNumber} className="border-b border-brand-slate/10 last:border-0 align-top">
                  <td className="px-3 py-2 text-brand-slate/70">{row.rowNumber}</td>
                  <td className="max-w-[280px] px-3 py-2 text-brand-black">{row.descripcion || "—"}</td>
                  <td className="px-3 py-2 text-brand-slate">{row.costoRaw ? `$${row.costoRaw}` : "—"}</td>
                  <td className="px-3 py-2">
                    {row.status === "ready" ? (
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={row.puntosEditados}
                        onChange={(event) => updatePuntos(row.rowNumber, Number.parseInt(event.target.value, 10) || 0)}
                        className={inputClass}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.status === "ready" ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                        Se importará
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex w-fit rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          Error
                        </span>
                        {row.reason && <p className="max-w-[180px] font-sans text-xs text-brand-slate/70">{row.reason}</p>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={handleConfirmImport} disabled={isImporting || counts.ready === 0}>
            {isImporting ? "Importando…" : "Confirmar importación"}
          </Button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isImporting}
            className={buttonClassName("secondary")}
          >
            Elegir otro archivo
          </button>
        </div>
      </div>
    );
  }

  // step === "summary"
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
      <h2 className="font-display text-base uppercase text-brand-slate">Importación completa</h2>
      <p className="font-sans text-sm text-brand-black">
        <span className="font-semibold text-green-700">{summary?.created ?? 0}</span> artículos creados
        {" · "}
        <span className="font-semibold text-red-700">{summary?.failed ?? 0}</span> con error
      </p>

      {summary && summary.failedDetails.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-md bg-red-50 p-3 font-sans text-xs text-red-700">
          {summary.failedDetails.map((detail) => (
            <li key={detail.rowNumber}>
              Fila {detail.rowNumber}: {detail.reason}
            </li>
          ))}
        </ul>
      )}

      <p className="font-sans text-sm text-brand-slate">
        Los artículos importados nacen inactivos y sin imagen — súbela después, uno por uno, desde el catálogo.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/lealtad/catalogo" className={buttonClassName("primary")}>
          Ver catálogo
        </Link>
        <button type="button" onClick={handleReset} className={buttonClassName("secondary")}>
          Importar otro archivo
        </button>
      </div>
    </div>
  );
}
