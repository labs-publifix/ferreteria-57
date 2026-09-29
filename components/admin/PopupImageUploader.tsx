"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// A diferencia de SingleImageUploader (5MB, sin comprimir, cualquier
// image/*), el cliente pidió explícitamente jpg/png/webp y ~1MB máximo
// con compresión/redimensionado — por eso este componente es nuevo en vez
// de reusar aquel (que no expone esos límites como props).
const MAX_FILE_SIZE_BYTES = 1024 * 1024;
const MAX_DIMENSION = 1600;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Redimensiona (si excede MAX_DIMENSION) y comprime reduciendo la calidad
// JPEG en pasos hasta caber en ~1MB. Siempre re-codifica a JPEG — es lo
// único con control de calidad real en canvas.toBlob (PNG lo ignora) — lo
// cual es aceptable aquí porque esta imagen es el FONDO del banner (nunca
// un logo con transparencia que deba preservarse).
async function resizeAndCompress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen en este navegador.");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const qualitySteps = [0.85, 0.7, 0.55, 0.4];
  let lastBlob: Blob | null = null;
  for (const quality of qualitySteps) {
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) continue;
    lastBlob = blob;
    if (blob.size <= MAX_FILE_SIZE_BYTES) return blob;
  }
  // Ninguna pasada bajó de 1MB (imagen muy grande incluso comprimida al
  // mínimo) — se sube igual con la mejor compresión lograda en vez de
  // fallar del todo; el límite es "razonable", no absoluto.
  if (lastBlob) return lastBlob;
  throw new Error("No se pudo comprimir la imagen.");
}

export function PopupImageUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`"${file.name}" debe ser JPG, PNG o WEBP.`);
      return;
    }

    setIsUploading(true);
    try {
      const compressed = await resizeAndCompress(file);
      const supabase = createClient();
      const path = `${crypto.randomUUID()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("popup-images")
        .upload(path, compressed, { cacheControl: "3600", contentType: "image/jpeg" });

      if (uploadError) {
        setError(`No se pudo subir "${file.name}".`);
      } else {
        const { data } = supabase.storage.from("popup-images").getPublicUrl(path);
        onChange(data.publicUrl);
      }
    } catch {
      setError(`No se pudo procesar "${file.name}" — intenta con otra imagen.`);
    }
    setIsUploading(false);
  }

  return (
    <div>
      <p className="mb-1.5 font-sans text-sm font-medium text-brand-black">Imagen de fondo</p>

      {value && (
        <div className="group relative mb-3 aspect-video w-full max-w-xs overflow-hidden rounded-md bg-brand-gray">
          <Image src={value} alt="" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Quitar imagen"
            className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-brand-black/70 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <label
        htmlFor={inputId}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-brand-slate/30 px-4 font-sans text-sm font-medium text-brand-slate hover:border-brand-slate/60 hover:bg-brand-gray"
      >
        {isUploading ? "Procesando…" : value ? "Cambiar imagen" : "Subir imagen"}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={isUploading}
        onChange={handleFileSelected}
        className="sr-only"
      />
      <p className="mt-1.5 font-sans text-xs text-brand-slate/60">
        JPG, PNG o WEBP — se redimensiona y comprime automáticamente a ~1MB o menos.
      </p>

      {error && <p className="mt-2 font-sans text-xs text-red-700">{error}</p>}
    </div>
  );
}
