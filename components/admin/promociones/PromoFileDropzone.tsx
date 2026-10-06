"use client";

import { useRef, useState } from "react";
import { CircleCheck, Download, FileSpreadsheet, FileUp, LoaderCircle, TriangleAlert } from "lucide-react";
import { buttonClassName } from "@/components/ui";
import {
  LIQUIDACION_EXCEL_MAX_BYTES,
  PROMO_MAX_BYTES,
  type PromoTipo,
} from "@/lib/club57/promociones/config";
import { formatBytes, hasPdfSignature } from "@/lib/club57/promociones/archivo";
import type { LiquidacionProducto } from "@/lib/club57/promociones/liquidaciones/parseExcel";
import {
  createPromoUploadUrl,
  finalizeLiquidacionUpload,
  finalizePromoUpload,
  type FinalizePromoUploadResult,
} from "@/app/(admin)/admin/(protected)/lealtad/promociones/actions";

export interface UploadedPromoFuente {
  nombre: string;
  productos: number;
  sinPiezas?: number;
  /** Solo disponible justo después de subir el Excel (no al retomar un borrador). */
  preview?: LiquidacionProducto[];
}

export type UploadedPromoDraft = NonNullable<FinalizePromoUploadResult["promo"]> & { fuente?: UploadedPromoFuente };

export const LIQUIDACIONES_TEMPLATE_HREF = "/api/admin/lealtad/promociones/plantilla-liquidaciones";

type Phase =
  | { kind: "idle" }
  | { kind: "uploading"; fileName: string; fileSize: number; percent: number }
  | { kind: "verifying"; fileName: string; fileSize: number };

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];

const FORMATOS = {
  pdf: {
    maxBytes: PROMO_MAX_BYTES,
    contentType: "application/pdf",
    accept: "application/pdf,.pdf",
    nombre: "PDF",
    arrastra: "Arrastra aquí el PDF de la promoción",
    seleccionar: "Seleccionar PDF",
    verificando: "Verificando que sea un PDF válido…",
    invalido: "no es un PDF válido. Exporta la promoción como PDF y vuelve a intentarlo.",
    firmaValida: (head: Uint8Array) => hasPdfSignature(head),
  },
  excel: {
    maxBytes: LIQUIDACION_EXCEL_MAX_BYTES,
    contentType: XLSX_MIME,
    accept: `${XLSX_MIME},.xlsx`,
    nombre: "Excel (.xlsx)",
    arrastra: "Arrastra aquí el Excel de la liquidación",
    seleccionar: "Seleccionar Excel",
    verificando: "Revisando el Excel y generando el PDF…",
    invalido: "no es un Excel .xlsx válido. Guárdalo como \"Libro de Excel (.xlsx)\" y vuelve a intentarlo.",
    firmaValida: (head: Uint8Array) => ZIP_SIGNATURE.every((byte, index) => head[index] === byte),
  },
} as const;

const moneyFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

// PUT directo a Storage con la URL firmada (nunca pasa por Vercel, así que
// no aplica su límite de ~4.5 MB). XMLHttpRequest en vez de fetch: es la
// única API del navegador que reporta progreso de SUBIDA. El cuerpo es el
// File tal cual — Storage lo guarda byte a byte, sin recomprimir.
function uploadWithProgress(
  url: string,
  file: File,
  contentType: string,
  maxBytes: number,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", contentType);
    xhr.setRequestHeader("x-upsert", "false");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) xhr.setRequestHeader("apikey", anonKey);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      // Storage responde el exceso de tamaño como HTTP 400 con
      // statusCode "413" / EntityTooLarge en el cuerpo.
      if (xhr.status === 413 || /EntityTooLarge|"statusCode":"413"/.test(xhr.responseText)) {
        return reject(new Error(`El archivo supera el máximo de ${formatBytes(maxBytes)}.`));
      }
      reject(new Error("No se pudo subir el archivo. Intenta de nuevo."));
    };
    xhr.onerror = () => reject(new Error("Se perdió la conexión durante la subida. Intenta de nuevo."));
    xhr.send(file);
  });
}

export function PromoFileDropzone({
  tipo,
  formato,
  draft,
  onUploaded,
  onBeforeReplace,
}: {
  tipo: PromoTipo;
  formato: "pdf" | "excel";
  draft: UploadedPromoDraft | null;
  onUploaded: (draft: UploadedPromoDraft) => void;
  /** Se llama antes de subir un archivo nuevo cuando ya había uno (para descartar el borrador anterior). */
  onBeforeReplace: () => Promise<void>;
}) {
  const config = FORMATOS[formato];
  const inputRef = useRef<HTMLInputElement>(null);
  // Candado síncrono: el estado de React tarda un render en reflejar
  // "ocupado", y un segundo archivo no debe encimarse con el que se procesa.
  const processingRef = useRef(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState<{ message: string; detalles?: string[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const busy = phase.kind !== "idle";

  async function handleFile(file: File) {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      await processFile(file);
    } finally {
      processingRef.current = false;
    }
  }

  async function processFile(file: File) {
    setError(null);
    if (file.size === 0) return setError({ message: `"${file.name}" está vacío.` });
    if (file.size > config.maxBytes) {
      return setError({
        message: `"${file.name}" pesa ${formatBytes(file.size)}; el máximo permitido es ${formatBytes(config.maxBytes)}.`,
      });
    }
    // Cortesía para avisar de inmediato; la verificación real la repite el
    // servidor al finalizar.
    const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    if (!config.firmaValida(head)) return setError({ message: `"${file.name}" ${config.invalido}` });

    setPhase({ kind: "uploading", fileName: file.name, fileSize: file.size, percent: 0 });
    try {
      if (draft) await onBeforeReplace();

      const prepared = await createPromoUploadUrl({ tipo, fileSize: file.size });
      if (prepared.error || !prepared.signedUrl || !prepared.path) throw new Error(prepared.error ?? "No se pudo preparar la subida.");

      await uploadWithProgress(prepared.signedUrl, file, config.contentType, config.maxBytes, (percent) =>
        setPhase({ kind: "uploading", fileName: file.name, fileSize: file.size, percent })
      );

      setPhase({ kind: "verifying", fileName: file.name, fileSize: file.size });
      if (formato === "excel") {
        const result = await finalizeLiquidacionUpload({ path: prepared.path, originalName: file.name });
        if (result.error || !result.promo) {
          setError({ message: result.error ?? "No se pudo procesar el Excel.", detalles: result.detalles });
        } else {
          onUploaded(result.promo);
        }
      } else {
        const result = await finalizePromoUpload({ tipo, path: prepared.path, originalName: file.name });
        if (result.error || !result.promo) throw new Error(result.error ?? "No se pudo verificar el archivo.");
        onUploaded(result.promo);
      }
    } catch (uploadError) {
      setError({ message: uploadError instanceof Error ? uploadError.message : "No se pudo subir el archivo." });
    }
    setPhase({ kind: "idle" });
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void handleFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const fuente = draft?.fuente;

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
          isDragging ? "border-brand-orange bg-brand-orange/5" : "border-brand-slate/30 bg-white"
        }`}
      >
        {phase.kind === "idle" ? (
          <>
            {formato === "excel" ? (
              <FileSpreadsheet className="size-8 text-brand-slate" aria-hidden="true" strokeWidth={1.5} />
            ) : (
              <FileUp className="size-8 text-brand-slate" aria-hidden="true" strokeWidth={1.5} />
            )}
            <p className="font-sans text-sm text-brand-black">
              {config.arrastra}
              <span className="block text-brand-slate">o</span>
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={buttonClassName("secondary", "text-sm")}
            >
              {draft ? "Cambiar archivo" : config.seleccionar}
            </button>
            <p className="font-sans text-xs text-brand-slate">
              Solo {config.nombre} · máximo {formatBytes(config.maxBytes)}
            </p>
          </>
        ) : (
          <div className="flex w-full max-w-md flex-col gap-2 text-left">
            <p className="truncate font-sans text-sm font-medium text-brand-black">{phase.fileName}</p>
            <p className="font-sans text-xs text-brand-slate">{formatBytes(phase.fileSize)}</p>
            <div
              role="progressbar"
              aria-label="Progreso de la subida"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={phase.kind === "uploading" ? phase.percent : 100}
              className="h-2 w-full overflow-hidden rounded-full bg-brand-gray"
            >
              <div
                className="h-full rounded-full bg-brand-orange transition-[width] duration-200"
                style={{ width: `${phase.kind === "uploading" ? phase.percent : 100}%` }}
              />
            </div>
            <p aria-live="polite" className="flex items-center gap-2 font-sans text-xs text-brand-slate">
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
              {phase.kind === "uploading" ? `Subiendo… ${phase.percent}%` : config.verificando}
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={config.accept}
          onChange={handleInputChange}
          disabled={busy}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {formato === "excel" && (
        <a
          href={LIQUIDACIONES_TEMPLATE_HREF}
          className="inline-flex min-h-11 items-center gap-1.5 self-start font-sans text-sm font-medium text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          <Download className="size-4" aria-hidden="true" strokeWidth={1.75} />
          Descargar plantilla de Excel
        </a>
      )}

      {error && (
        <div role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          <p>{error.message}</p>
          {error.detalles && error.detalles.length > 0 && (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs">
              {error.detalles.map((detalle) => (
                <li key={detalle}>{detalle}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {draft && phase.kind === "idle" && (
        <div className="flex items-start gap-3 rounded-lg bg-green-50 px-4 py-3">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-green-700" aria-hidden="true" strokeWidth={1.75} />
          <div className="min-w-0">
            <p className="break-words font-sans text-sm font-medium text-brand-black">{fuente ? fuente.nombre : draft.nombre}</p>
            <p className="font-sans text-xs text-green-800">
              {fuente
                ? `${fuente.productos} ${fuente.productos === 1 ? "producto" : "productos"} · PDF generado (${formatBytes(draft.bytes)})`
                : `${formatBytes(draft.bytes)} · PDF verificado y guardado sin modificaciones`}
            </p>
          </div>
        </div>
      )}

      {fuente && !!fuente.sinPiezas && phase.kind === "idle" && (
        <p className="flex items-start gap-2 rounded-md bg-amber-50 px-4 py-2.5 font-sans text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
          <span>
            {fuente.sinPiezas === 1 ? "1 producto trae" : `${fuente.sinPiezas} productos traen`} 0 piezas y se
            {fuente.sinPiezas === 1 ? " imprime" : " imprimen"} tal cual en el PDF. Si no deben aparecer, quítalos del
            Excel y vuelve a subirlo.
          </span>
        </p>
      )}

      {fuente?.preview && phase.kind === "idle" && (
        <div className="max-h-72 overflow-auto rounded-lg border border-brand-slate/15">
          <table className="w-full min-w-[480px] text-left font-sans text-xs">
            <caption className="sr-only">Productos que se imprimirán en el PDF</caption>
            <thead className="sticky top-0 bg-brand-slate text-white">
              <tr>
                <th className="px-3 py-2 font-semibold">Código</th>
                <th className="px-3 py-2 text-center font-semibold">Piezas</th>
                <th className="px-3 py-2 font-semibold">Descripción</th>
                <th className="px-3 py-2 text-right font-semibold">Precio</th>
              </tr>
            </thead>
            <tbody>
              {fuente.preview.map((producto, index) => (
                <tr key={`${producto.codigo}-${index}`} className="odd:bg-white even:bg-brand-gray">
                  <td className="px-3 py-1.5 text-brand-black">{producto.codigo}</td>
                  <td className={`px-3 py-1.5 text-center ${producto.piezas === 0 ? "font-semibold text-amber-900" : "text-brand-black"}`}>
                    {producto.piezas}
                  </td>
                  <td className="px-3 py-1.5 text-brand-black">{producto.descripcion}</td>
                  <td className="px-3 py-1.5 text-right font-semibold text-brand-black">{moneyFormatter.format(producto.precio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
