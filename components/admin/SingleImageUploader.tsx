"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE_MB = 5;

// Versión de una sola imagen del mismo patrón que ProductImageUploader:
// sube directo a Storage desde el navegador con la sesión del admin ya
// autenticada (RLS exige is_admin() en el bucket dado), sin pasar por una
// Server Action. `bucket` es parámetro (no fijo) para poder reusarlo con
// cualquier bucket público de imágenes que siga la misma política —
// primero product-images, ahora promo-images.
export function SingleImageUploader({
  bucket,
  value,
  onChange,
  label = "Imagen",
}: {
  bucket: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite volver a elegir el mismo archivo después
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError(`"${file.name}" no es una imagen.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`"${file.name}" pesa más de ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${extension}`;

    // try/catch además de leer `error`: una falla de red puede rechazar la
    // promesa directo en vez de devolver {error} — sin esto, el botón se
    // quedaría en "Subiendo…" para siempre en ese caso.
    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600" });

      if (uploadError) {
        setError(`No se pudo subir "${file.name}".`);
      } else {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        onChange(data.publicUrl);
      }
    } catch {
      setError(`No se pudo subir "${file.name}" — revisa tu conexión.`);
    }
    setIsUploading(false);
  }

  return (
    <div>
      <p className="mb-1.5 font-sans text-sm font-medium text-brand-black">{label}</p>

      {value && (
        <div className="group relative mb-3 aspect-square w-32 overflow-hidden rounded-md bg-brand-gray">
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
        {isUploading ? "Subiendo…" : value ? "Cambiar imagen" : "Subir imagen"}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        disabled={isUploading}
        onChange={handleFileSelected}
        className="sr-only"
      />

      {error && <p className="mt-2 font-sans text-xs text-red-700">{error}</p>}
    </div>
  );
}
