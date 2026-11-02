"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui";
import {
  confirmPartnersImport,
  type ConfirmImportResult,
  type RowResult,
} from "@/app/(admin)/admin/(protected)/lealtad/socios/importar/actions";
import { reporteCsv, type DecisionDuplicado, type ImportSummary, type PreviewRow } from "@/lib/club57/socios/import";

type Filtro = "todas" | "valida" | "advertencia" | "error" | "duplicados";

interface PreviewResponse {
  sheetName: string;
  rows: PreviewRow[];
  summary: ImportSummary;
}

const ESTADO_LABEL: Record<PreviewRow["estado"], string> = {
  valida: "Válida",
  advertencia: "Con advertencia",
  error: "Con error",
};
const ESTADO_CLASS: Record<PreviewRow["estado"], string> = {
  valida: "bg-green-100 text-green-800",
  advertencia: "bg-amber-100 text-amber-900",
  error: "bg-red-100 text-red-800",
};
const RESULTADO_LABEL: Record<RowResult["resultado"], string> = {
  insertado: "Insertado",
  actualizado: "Actualizado",
  omitido: "Omitido",
  error: "Con error",
};

function descargar(nombre: string, contenido: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nombre;
  link.click();
  URL.revokeObjectURL(url);
}

// Carga masiva del directorio: plantilla → archivo → vista previa con cada
// fila clasificada (válida, con advertencia o con error) y decisión para los
// duplicados → importación → resumen con reporte descargable.
export function Club57PartnersImportWizard() {
  const fileId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [decisiones, setDecisiones] = useState<Record<number, DecisionDuplicado>>({});
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [resultado, setResultado] = useState<ConfirmImportResult | null>(null);
  const importingRef = useRef(false);

  async function revisar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Elige un archivo .xlsx o .csv.");
      return;
    }
    setReviewing(true);
    setError(null);
    setPreview(null);
    setResultado(null);
    const form = new FormData();
    form.append("archivo", file);
    try {
      const response = await fetch("/api/admin/lealtad/socios/importar", { method: "POST", body: form });
      const body = (await response.json()) as PreviewResponse & { error?: string };
      if (!response.ok || body.error) setError(body.error ?? "No se pudo revisar el archivo.");
      else {
        setPreview(body);
        setDecisiones({});
        setFiltro("todas");
      }
    } catch {
      setError("No se pudo revisar el archivo. Revisa tu conexión e inténtalo de nuevo.");
    }
    setReviewing(false);
  }

  const conteo = useMemo(() => {
    if (!preview) return { insertar: 0, actualizar: 0, omitir: 0 };
    let insertar = 0;
    let actualizar = 0;
    let omitir = 0;
    for (const row of preview.rows) {
      if (row.estado === "error") continue;
      if (!row.duplicado) insertar += 1;
      else if (decisiones[row.rowNumber] === "actualizar") actualizar += 1;
      else omitir += 1;
    }
    return { insertar, actualizar, omitir };
  }, [preview, decisiones]);

  async function importar() {
    if (!preview || importingRef.current) return;
    importingRef.current = true;
    setImporting(true);
    setError(null);
    const result = await confirmPartnersImport(
      preview.rows
        .filter((row) => row.estado !== "error")
        .map((row) => ({ rowNumber: row.rowNumber, input: row.input, decision: decisiones[row.rowNumber] ?? "omitir" }))
    );
    importingRef.current = false;
    setImporting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const conErrorPrevio: RowResult[] = preview.rows
      .filter((row) => row.estado === "error")
      .map((row) => ({
        rowNumber: row.rowNumber,
        nombre: row.data.nombre_comercial || "(sin nombre)",
        resultado: "error",
        motivo: row.errors.join(" "),
      }));
    const resultados = [...(result.resultados ?? []), ...conErrorPrevio].sort((a, b) => a.rowNumber - b.rowNumber);
    setResultado({ ...result, errores: (result.errores ?? 0) + conErrorPrevio.length, resultados });
  }

  function reiniciar() {
    setFile(null);
    setPreview(null);
    setResultado(null);
    setError(null);
  }

  if (resultado) {
    const conProblema = (resultado.resultados ?? []).filter((row) => row.resultado !== "insertado" || row.motivo);
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-lg bg-white p-5 shadow-sm sm:p-6">
          <p className="flex items-center gap-2 font-sans text-base font-semibold text-brand-black">
            <CheckCircle2 className="size-5 text-green-700" aria-hidden="true" />
            Importación terminada
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Insertados", resultado.insertados ?? 0, "text-green-800"],
              ["Actualizados", resultado.actualizados ?? 0, "text-brand-slate"],
              ["Omitidos", resultado.omitidos ?? 0, "text-brand-slate"],
              ["Con error", resultado.errores ?? 0, "text-red-700"],
            ].map(([label, value, color]) => (
              <div key={label as string} className="rounded-lg bg-brand-gray p-3">
                <dt className="font-sans text-xs font-medium text-brand-slate">{label}</dt>
                <dd className={`font-display text-2xl tabular-nums ${color}`}>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {conProblema.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  descargar(
                    "reporte-importacion-socios.csv",
                    reporteCsv(
                      conProblema.map((row) => ({
                        rowNumber: row.rowNumber,
                        nombre: row.nombre,
                        estado: RESULTADO_LABEL[row.resultado],
                        motivo: row.motivo,
                      }))
                    )
                  )
                }
                className={buttonClassName("secondary")}
              >
                <Download className="size-4" aria-hidden="true" />
                Descargar reporte de errores
              </button>
            )}
            <Link href="/admin/lealtad/socios" className={buttonClassName("primary")}>
              Ver el directorio
            </Link>
            <button type="button" onClick={reiniciar} className="min-h-11 px-3 font-sans text-sm font-medium text-brand-slate underline">
              Importar otro archivo
            </button>
          </div>
        </div>
        {conProblema.length > 0 && (
          <div className="relative min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                  <th className="px-4 py-3">Fila</th>
                  <th className="px-4 py-3">Nombre comercial</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {conProblema.map((row) => (
                  <tr key={row.rowNumber} className="border-b border-brand-slate/10 align-top last:border-0">
                    <td className="px-4 py-3 tabular-nums text-brand-slate">{row.rowNumber}</td>
                    <td className="px-4 py-3 text-brand-black">{row.nombre}</td>
                    <td className="whitespace-nowrap px-4 py-3">{RESULTADO_LABEL[row.resultado]}</td>
                    <td className="px-4 py-3 text-brand-slate">{row.motivo || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  const visibles = preview
    ? preview.rows.filter((row) =>
        filtro === "todas" ? true : filtro === "duplicados" ? row.duplicado : row.estado === filtro
      )
    : [];
  const duplicados = preview?.rows.filter((row) => row.duplicado && row.estado !== "error") ?? [];

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base uppercase text-brand-slate">1. Descarga la plantilla</h2>
            <p className="mt-1 font-sans text-sm text-brand-slate/80">
              Encabezados exactos, una fila de ejemplo y una hoja de instrucciones. También funciona el Excel normalizado
              del directorio (hoja Socios_Comerciales).
            </p>
          </div>
          <a href="/api/admin/lealtad/socios/plantilla" className={buttonClassName("secondary", "shrink-0")}>
            <Download className="size-4" aria-hidden="true" />
            Descargar plantilla
          </a>
        </div>

        <form onSubmit={revisar} className="flex flex-col gap-3 border-t border-brand-slate/10 pt-4">
          <h2 className="font-display text-base uppercase text-brand-slate">2. Sube tu archivo</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label
              htmlFor={fileId}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-brand-slate/30 px-4 font-sans text-sm font-medium text-brand-slate hover:border-brand-slate/60 hover:bg-brand-gray"
            >
              <FileSpreadsheet className="size-4" aria-hidden="true" />
              {file ? "Cambiar archivo" : "Elegir archivo .xlsx o .csv"}
            </label>
            <input
              id={fileId}
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setPreview(null);
                setError(null);
                event.target.value = "";
              }}
            />
            {file && <span className="min-w-0 break-all font-sans text-sm text-brand-black">{file.name}</span>}
          </div>
          <Button type="submit" disabled={!file || reviewing} className="sm:self-start">
            <Upload className="size-4" aria-hidden="true" />
            {reviewing ? "Revisando…" : "Revisar archivo"}
          </Button>
        </form>
      </section>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}

      {preview && (
        <section aria-labelledby="vista-previa" className="flex flex-col gap-4">
          <div className="rounded-lg bg-white p-5 shadow-sm sm:p-6">
            <h2 id="vista-previa" className="font-display text-base uppercase text-brand-slate">
              3. Revisa antes de importar
            </h2>
            <p className="mt-1 font-sans text-sm text-brand-slate/80">
              Hoja «{preview.sheetName}», {preview.summary.total} {preview.summary.total === 1 ? "fila" : "filas"}. Las filas
              con error no se importan.
            </p>
            <div role="tablist" aria-label="Filtrar filas" className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  ["todas", `Todas (${preview.summary.total})`],
                  ["valida", `Válidas (${preview.summary.validas})`],
                  ["advertencia", `Con advertencia (${preview.summary.advertencias})`],
                  ["error", `Con error (${preview.summary.errores})`],
                  ["duplicados", `Duplicados (${preview.summary.duplicados})`],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filtro === value}
                  onClick={() => setFiltro(value)}
                  className={`min-h-11 rounded-full px-4 font-sans text-sm font-medium ${
                    filtro === value ? "bg-brand-slate text-white" : "bg-brand-gray text-brand-slate hover:bg-brand-slate/15"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {preview.summary.girosNuevos.length > 0 && (
              <p className="mt-3 font-sans text-sm text-amber-900">
                {preview.summary.girosNuevos.length === 1 ? "Se creará 1 giro nuevo" : `Se crearán ${preview.summary.girosNuevos.length} giros nuevos`}:{" "}
                {preview.summary.girosNuevos.join(", ")}.
              </p>
            )}
            {duplicados.length > 0 && (
              <div className="mt-4 flex flex-col gap-2 rounded-lg bg-brand-gray p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-sans text-sm text-brand-black">
                  {duplicados.length} {duplicados.length === 1 ? "fila coincide" : "filas coinciden"} con socios que ya existen.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisiones(Object.fromEntries(duplicados.map((row) => [row.rowNumber, "omitir"])))}
                    className={buttonClassName("secondary", "!px-3 text-sm")}
                  >
                    Omitir todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisiones(Object.fromEntries(duplicados.map((row) => [row.rowNumber, "actualizar"])))}
                    className={buttonClassName("secondary", "!px-3 text-sm")}
                  >
                    Actualizar todos
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="w-full min-w-[880px] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                  <th className="px-4 py-3">Fila</th>
                  <th className="px-4 py-3">Socio</th>
                  <th className="px-4 py-3">Giro</th>
                  <th className="px-4 py-3">Estado y motivo</th>
                  <th className="px-4 py-3">Si ya existe</th>
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-brand-slate/70">
                      No hay filas con este filtro.
                    </td>
                  </tr>
                )}
                {visibles.map((row) => (
                  <tr key={row.rowNumber} className="border-b border-brand-slate/10 align-top last:border-0">
                    <td className="px-4 py-3 tabular-nums text-brand-slate">{row.rowNumber}</td>
                    <td className="max-w-[220px] px-4 py-3">
                      <span className="font-semibold text-brand-black">{row.data.nombre_comercial || "(sin nombre)"}</span>
                      {row.data.telefono && <span className="block tabular-nums text-xs text-brand-slate">{row.data.telefono}</span>}
                      {row.data.correo && <span className="block break-all text-xs text-brand-slate">{row.data.correo}</span>}
                    </td>
                    <td className="px-4 py-3 text-brand-black">
                      {row.data.giro ?? <span className="text-amber-900">Por definir</span>}
                    </td>
                    <td className="max-w-[320px] px-4 py-3">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_CLASS[row.estado]}`}>
                        {ESTADO_LABEL[row.estado]}
                      </span>
                      {[...row.errors, ...row.warnings].length > 0 && (
                        <ul className="mt-1.5 flex flex-col gap-0.5 text-xs text-brand-slate">
                          {[...row.errors, ...row.warnings].map((motivo) => (
                            <li key={motivo}>{motivo}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.duplicado && row.estado !== "error" ? (
                        <fieldset>
                          <legend className="sr-only">Qué hacer con la fila {row.rowNumber}</legend>
                          <div className="flex gap-1">
                            {(["omitir", "actualizar"] as const).map((decision) => (
                              <label
                                key={decision}
                                className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border border-brand-slate/20 px-2.5 text-sm has-[:checked]:border-brand-slate has-[:checked]:bg-brand-gray"
                              >
                                <input
                                  type="radio"
                                  name={`dup-${row.rowNumber}`}
                                  checked={(decisiones[row.rowNumber] ?? "omitir") === decision}
                                  onChange={() => setDecisiones((current) => ({ ...current, [row.rowNumber]: decision }))}
                                  className="accent-brand-slate"
                                />
                                {decision === "omitir" ? "Omitir" : "Actualizar"}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      ) : (
                        <span className="text-brand-slate/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="font-sans text-sm text-brand-black">
              Se {conteo.insertar === 1 ? "inserta" : "insertan"} <strong>{conteo.insertar}</strong>, se{" "}
              {conteo.actualizar === 1 ? "actualiza" : "actualizan"} <strong>{conteo.actualizar}</strong> y se{" "}
              {conteo.omitir + preview.summary.errores === 1 ? "omite" : "omiten"}{" "}
              <strong>{conteo.omitir + preview.summary.errores}</strong>.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {preview.summary.errores + preview.summary.advertencias > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    descargar(
                      "revision-importacion-socios.csv",
                      reporteCsv(
                        preview.rows
                          .filter((row) => row.estado !== "valida")
                          .map((row) => ({
                            rowNumber: row.rowNumber,
                            nombre: row.data.nombre_comercial,
                            estado: ESTADO_LABEL[row.estado],
                            motivo: [...row.errors, ...row.warnings].join(" "),
                          }))
                      )
                    )
                  }
                  className={buttonClassName("secondary")}
                >
                  <Download className="size-4" aria-hidden="true" />
                  Descargar reporte
                </button>
              )}
              <Button
                type="button"
                onClick={() => void importar()}
                disabled={importing || conteo.insertar + conteo.actualizar === 0}
              >
                {importing ? "Importando…" : `Importar ${conteo.insertar + conteo.actualizar} ${conteo.insertar + conteo.actualizar === 1 ? "fila" : "filas"}`}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
