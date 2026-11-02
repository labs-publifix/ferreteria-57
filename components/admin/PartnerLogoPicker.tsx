"use client";

import { useEffect, useId, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { PartnerAvatar } from "@/components/club57/PartnerAvatar";
import { LOGO_ACCEPT, LOGO_MAX_BYTES, LOGO_SQUARE_PX } from "@/lib/club57/socios/logo";

export interface LogoChange {
  /** Archivo listo para subir (ya cuadrado si es PNG/JPG/WebP), o null. */
  file: Blob | null;
  /** true: quitar el logo actual y volver a las iniciales. */
  remove: boolean;
}

type Modo = "recortar" | "ajustar";

const TIPOS = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

async function cuadrar(file: File, modo: Modo): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo leer la imagen."));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = LOGO_SQUARE_PX;
    canvas.height = LOGO_SQUARE_PX;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Tu navegador no permite procesar la imagen.");
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (modo === "recortar") {
      const lado = Math.min(w, h);
      ctx.drawImage(img, (w - lado) / 2, (h - lado) / 2, lado, lado, 0, 0, LOGO_SQUARE_PX, LOGO_SQUARE_PX);
    } else {
      // Ajustar: el logo completo dentro del cuadrado, con margen y fondo transparente.
      const margen = LOGO_SQUARE_PX * 0.06;
      const escala = Math.min((LOGO_SQUARE_PX - margen * 2) / w, (LOGO_SQUARE_PX - margen * 2) / h);
      const dw = w * escala;
      const dh = h * escala;
      ctx.drawImage(img, (LOGO_SQUARE_PX - dw) / 2, (LOGO_SQUARE_PX - dh) / 2, dw, dh);
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    if (!blob) throw new Error("No se pudo preparar la imagen.");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Logotipo del socio: sustituye al avatar de iniciales. Los PNG/JPG/WebP se
// dejan cuadrados aquí mismo (recortando al centro o ajustando el logo
// completo con margen); los SVG se suben tal cual porque escalan solos. La
// validación definitiva (firma, tamaño, SVG sin código) la repite el servidor.
export function PartnerLogoPicker({
  nombre,
  currentUrl,
  onChange,
}: {
  nombre: string;
  currentUrl: string | null;
  onChange: (change: LogoChange) => void;
}) {
  const inputId = useId();
  const [original, setOriginal] = useState<File | null>(null);
  const [modo, setModo] = useState<Modo>("ajustar");
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function preparar(file: File, nuevoModo: Modo) {
    setProcessing(true);
    setError(null);
    try {
      const blob = file.type === "image/svg+xml" ? file : await cuadrar(file, nuevoModo);
      setPreview(URL.createObjectURL(blob));
      setRemove(false);
      onChange({ file: blob, remove: false });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo preparar la imagen.");
      onChange({ file: null, remove: false });
    }
    setProcessing(false);
  }

  function elegir(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!TIPOS.includes(file.type)) {
      setError(`«${file.name}» no es PNG, JPG, WebP ni SVG.`);
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError(`«${file.name}» pesa más de 2 MB.`);
      return;
    }
    setOriginal(file);
    void preparar(file, modo);
  }

  function cancelarCambio() {
    setOriginal(null);
    setPreview(null);
    setRemove(false);
    setError(null);
    onChange({ file: null, remove: false });
  }

  const mostrado = remove ? null : preview ?? currentUrl;

  return (
    <fieldset className="rounded-lg border border-brand-slate/15 p-4">
      <legend className="px-1 font-sans text-sm font-medium text-brand-black">Logotipo</legend>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <PartnerAvatar nombre={nombre || "Socio"} logoUrl={mostrado} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="font-sans text-xs text-brand-slate/80">
            {mostrado
              ? preview
                ? "Vista previa: se guarda al guardar el socio."
                : "Logotipo actual."
              : "Sin logotipo: se muestra el avatar con las iniciales."}{" "}
            PNG, JPG, WebP o SVG de hasta 2 MB.
          </p>
          {original && original.type !== "image/svg+xml" && !remove && (
            <div role="radiogroup" aria-label="Cómo dejarlo cuadrado" className="flex flex-wrap gap-2">
              {(
                [
                  ["ajustar", "Ajustar completo"],
                  ["recortar", "Recortar al centro"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-brand-slate/20 px-3 font-sans text-sm has-[:checked]:border-brand-slate"
                >
                  <input
                    type="radio"
                    name={`${inputId}-modo`}
                    value={value}
                    checked={modo === value}
                    onChange={() => {
                      setModo(value);
                      void preparar(original, value);
                    }}
                    className="accent-brand-slate"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={inputId}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border-2 border-dashed border-brand-slate/30 px-4 font-sans text-sm font-medium text-brand-slate hover:border-brand-slate/60 hover:bg-brand-gray"
            >
              <ImageUp className="size-4" aria-hidden="true" />
              {processing ? "Preparando…" : mostrado ? "Cambiar logotipo" : "Subir logotipo"}
            </label>
            <input id={inputId} type="file" accept={LOGO_ACCEPT} onChange={elegir} className="sr-only" disabled={processing} />
            {preview && (
              <button
                type="button"
                onClick={cancelarCambio}
                className="min-h-11 px-3 font-sans text-sm text-brand-slate underline underline-offset-2"
              >
                Descartar cambio
              </button>
            )}
            {currentUrl && !remove && !preview && (
              <button
                type="button"
                onClick={() => {
                  setRemove(true);
                  onChange({ file: null, remove: true });
                }}
                className="inline-flex min-h-11 items-center gap-1.5 px-3 font-sans text-sm font-medium text-red-700 underline-offset-2 hover:underline"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Quitar logotipo
              </button>
            )}
            {remove && (
              <button
                type="button"
                onClick={cancelarCambio}
                className="min-h-11 px-3 font-sans text-sm text-brand-slate underline underline-offset-2"
              >
                Conservar logotipo
              </button>
            )}
          </div>
          {remove && (
            <p className="font-sans text-xs text-amber-900">Al guardar, el socio vuelve al avatar de iniciales.</p>
          )}
          {error && <p className="font-sans text-xs text-red-700">{error}</p>}
        </div>
      </div>
    </fieldset>
  );
}
