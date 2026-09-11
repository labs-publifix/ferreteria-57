"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Upload } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui";
import {
  commitImportRows,
  parseAndValidateImportFile,
  type ImportCommitRow,
  type ImportCommitSummary,
  type ImportPreviewRow,
} from "@/app/(admin)/admin/(protected)/productos/importar/actions";

interface EditableRow extends ImportPreviewRow {
  updateExisting: boolean;
}

type Step = "upload" | "preview" | "summary";

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-3 py-2 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";

function statusBadge(row: EditableRow) {
  if (row.status === "error") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        Error
      </span>
    );
  }
  if (row.status === "existing") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
        {row.updateExisting ? "Se actualizará" : "Ya existe — se omite"}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
      Se importará
    </span>
  );
}

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportCommitSummary | null>(null);

  const counts = useMemo(() => {
    let willCreate = 0;
    let willUpdate = 0;
    let willSkip = 0;
    let willError = 0;
    for (const row of rows) {
      if (row.status === "ready") willCreate += 1;
      else if (row.status === "existing") {
        if (row.updateExisting) willUpdate += 1;
        else willSkip += 1;
      } else willError += 1;
    }
    return { willCreate, willUpdate, willSkip, willError };
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
    const result = await parseAndValidateImportFile(formData);

    if (result.error || !result.rows) {
      setUploadError(result.error ?? "No se pudo leer el archivo.");
      setIsUploading(false);
      return;
    }

    setRows(result.rows.map((row) => ({ ...row, updateExisting: false })));
    setIsUploading(false);
    setStep("preview");
  }

  function updateRow(rowNumber: number, patch: Partial<EditableRow>) {
    setRows((current) => current.map((row) => (row.rowNumber === rowNumber ? { ...row, ...patch } : row)));
  }

  async function handleConfirmImport() {
    setIsImporting(true);
    setCommitError(null);

    const payload: ImportCommitRow[] = rows.map((row) => ({
      rowNumber: row.rowNumber,
      categoriaRaw: row.categoriaRaw,
      codigo: row.codigo,
      nombre: row.nombre,
      precioRaw: row.precioRaw,
      marca: row.marca,
      url: row.url,
      status: row.status,
      existingProductId: row.existingProductId,
      updateExisting: row.updateExisting,
    }));

    const result = await commitImportRows(payload);
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
          El archivo debe traer las columnas <strong>Categoria</strong>, <strong>Codigo</strong>,{" "}
          <strong>Nombre</strong>, <strong>Precio</strong> y <strong>URL</strong> (el orden no importa,
          espacios de más en el encabezado no afectan).
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
            <span className="font-semibold text-green-700">{counts.willCreate}</span> se importarán
            {counts.willUpdate > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-amber-700">{counts.willUpdate}</span> se actualizarán
              </>
            )}
            {" · "}
            <span className="font-semibold text-brand-slate">{counts.willSkip}</span> ya existen (se omiten)
            {" · "}
            <span className="font-semibold text-red-700">{counts.willError}</span> con error
          </p>
        </div>

        {commitError && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {commitError}
          </p>
        )}

        <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full min-w-[880px] text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                <th className="px-3 py-2.5">Fila</th>
                <th className="px-3 py-2.5">Categoría</th>
                <th className="px-3 py-2.5">Código</th>
                <th className="px-3 py-2.5">Nombre</th>
                <th className="px-3 py-2.5">Precio</th>
                <th className="px-3 py-2.5">Marca</th>
                <th className="px-3 py-2.5">Ficha</th>
                <th className="px-3 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowNumber} className="border-b border-brand-slate/10 last:border-0 align-top">
                  <td className="px-3 py-2 text-brand-slate/70">{row.rowNumber}</td>
                  <td className="px-3 py-2 text-brand-black">
                    {row.categoryId ? row.categoryLabel : <span className="text-red-700">{row.categoriaRaw || "—"}</span>}
                  </td>
                  <td className="px-3 py-2 text-brand-slate">{row.codigo || "—"}</td>
                  <td className="max-w-[240px] px-3 py-2 text-brand-black">{row.nombre || "—"}</td>
                  <td className="px-3 py-2 text-brand-slate">{row.precioRaw || "—"}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.marca}
                      onChange={(event) => updateRow(row.rowNumber, { marca: event.target.value })}
                      className={inputClass}
                      disabled={row.status === "error"}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {row.url ? (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-brand-slate underline underline-offset-2 hover:text-brand-black"
                      >
                        Ver <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1.5">
                      {statusBadge(row)}
                      {row.reason && (
                        <p className="max-w-[220px] font-sans text-xs text-brand-slate/70">{row.reason}</p>
                      )}
                      {row.status === "existing" && (
                        <label className="flex items-center gap-1.5 font-sans text-xs text-brand-black">
                          <input
                            type="checkbox"
                            checked={row.updateExisting}
                            onChange={(event) => updateRow(row.rowNumber, { updateExisting: event.target.checked })}
                            className="size-4 rounded border-brand-slate/40 accent-brand-orange"
                          />
                          Actualizar producto existente
                        </label>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={handleConfirmImport}
            disabled={isImporting || counts.willCreate + counts.willUpdate === 0}
          >
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
        <span className="font-semibold text-green-700">{summary?.created ?? 0}</span> productos creados
        {(summary?.updated ?? 0) > 0 && (
          <>
            {" · "}
            <span className="font-semibold text-amber-700">{summary?.updated}</span> actualizados
          </>
        )}
        {" · "}
        <span className="font-semibold text-brand-slate">{summary?.skipped ?? 0}</span> omitidos por código
        ya existente
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
        Los productos importados nacen inactivos y sin imagen — complétalos uno por uno desde la lista de
        productos antes de activarlos.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/productos?estado=inactivo&sinImagen=1"
          className={buttonClassName("primary")}
        >
          Ver productos inactivos sin imagen
        </Link>
        <button type="button" onClick={handleReset} className={buttonClassName("secondary")}>
          Importar otro archivo
        </button>
      </div>
    </div>
  );
}
