"use client";

import { useRef, useState } from "react";
import { CircleCheck, FileUp, LoaderCircle } from "lucide-react";
import { buttonClassName } from "@/components/ui";
import { PROMO_MAX_BYTES, type PromoTipo } from "@/lib/club57/promociones/config";
import { formatBytes, hasPdfSignature } from "@/lib/club57/promociones/archivo";
import {
  createPromoUploadUrl,
  finalizePromoUpload,
  type FinalizePromoUploadResult,
} from "@/app/(admin)/admin/(protected)/lealtad/promociones/actions";

export type UploadedPromoDraft = NonNullable<FinalizePromoUploadResult["promo"]>;

type Phase =
  | { kind: "idle" }
  | { kind: "uploading"; fileName: string; fileSize: number; percent: number }
  | { kind: "verifying"; fileName: string; fileSize: number };

// PUT directo a Storage con la URL firmada (nunca pasa por Vercel, así que
// no aplica su límite de ~4.5 MB). XMLHttpRequest en vez de fetch: es la
// única API del navegador que reporta progreso de SUBIDA. El cuerpo es el
// File tal cual — Storage lo guarda byte a byte, sin recomprimir.
function uploadWithProgress(url: string, file: File, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", "application/pdf");
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
        return reject(new Error(`El PDF supera el máximo de ${formatBytes(PROMO_MAX_BYTES)}.`));
      }
      reject(new Error("No se pudo subir el archivo. Intenta de nuevo."));
    };
    xhr.onerror = () => reject(new Error("Se perdió la conexión durante la subida. Intenta de nuevo."));
    xhr.send(file);
  });
}

export function PromoFileDropzone({
  tipo,
  draft,
  onUploaded,
  onBeforeReplace,
}: {
  tipo: PromoTipo;
  draft: UploadedPromoDraft | null;
  onUploaded: (draft: UploadedPromoDraft) => void;
  /** Se llama antes de subir un archivo nuevo cuando ya había uno (para descartar el borrador anterior). */
  onBeforeReplace: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const busy = phase.kind !== "idle";

  async function handleFile(file: File) {
    setError(null);
    if (file.size === 0) return setError(`"${file.name}" está vacío.`);
    if (file.size > PROMO_MAX_BYTES) {
      return setError(`"${file.name}" pesa ${formatBytes(file.size)}; el máximo permitido es ${formatBytes(PROMO_MAX_BYTES)}.`);
    }
    // Cortesía para avisar de inmediato; la verificación real (firma,
    // tamaño, SHA-256) la repite el servidor al finalizar.
    const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    if (!hasPdfSignature(head)) {
      return setError(`"${file.name}" no es un PDF válido. Exporta la promoción como PDF y vuelve a intentarlo.`);
    }

    setPhase({ kind: "uploading", fileName: file.name, fileSize: file.size, percent: 0 });
    try {
      if (draft) await onBeforeReplace();

      const prepared = await createPromoUploadUrl({ tipo, fileSize: file.size });
      if (prepared.error || !prepared.signedUrl || !prepared.path) throw new Error(prepared.error ?? "No se pudo preparar la subida.");

      await uploadWithProgress(prepared.signedUrl, file, (percent) =>
        setPhase({ kind: "uploading", fileName: file.name, fileSize: file.size, percent })
      );

      setPhase({ kind: "verifying", fileName: file.name, fileSize: file.size });
      const result = await finalizePromoUpload({ tipo, path: prepared.path, originalName: file.name });
      if (result.error || !result.promo) throw new Error(result.error ?? "No se pudo verificar el archivo.");
      onUploaded(result.promo);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir el archivo.");
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
            <FileUp className="size-8 text-brand-slate" aria-hidden="true" strokeWidth={1.5} />
            <p className="font-sans text-sm text-brand-black">
              Arrastra aquí el PDF de la promoción
              <span className="block text-brand-slate">o</span>
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={buttonClassName("secondary", "text-sm")}
            >
              {draft ? "Cambiar archivo" : "Seleccionar PDF"}
            </button>
            <p className="font-sans text-xs text-brand-slate">Solo PDF · máximo {formatBytes(PROMO_MAX_BYTES)}</p>
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
              {phase.kind === "uploading" ? `Subiendo… ${phase.percent}%` : "Verificando que sea un PDF válido…"}
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleInputChange}
          disabled={busy}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}

      {draft && phase.kind === "idle" && (
        <div className="flex items-start gap-3 rounded-lg bg-green-50 px-4 py-3">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-green-700" aria-hidden="true" strokeWidth={1.75} />
          <div className="min-w-0">
            <p className="break-words font-sans text-sm font-medium text-brand-black">{draft.nombre}</p>
            <p className="font-sans text-xs text-green-800">
              {formatBytes(draft.bytes)} · PDF verificado y guardado sin modificaciones
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
