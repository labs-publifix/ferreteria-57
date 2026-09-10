"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE_MB = 5;

// Sube directo a Supabase Storage desde el navegador con el cliente del
// admin ya autenticado (RLS en storage.objects exige is_admin(), ver la
// migración de catálogo) — no pasa por una Server Action ni por el
// servidor de la app: evita el límite de tamaño de body de una Server
// Action y es el patrón que Supabase recomienda para archivos. El
// resultado (URLs públicas) es lo único que después viaja en el
// formulario del producto.
export function ProductImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // permite volver a elegir el mismo archivo después
    if (files.length === 0) return;

    setError(null);
    setIsUploading(true);

    const supabase = createClient();
    const uploaded: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" no es una imagen.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`"${file.name}" pesa más de ${MAX_FILE_SIZE_MB}MB.`);
        continue;
      }

      const extension = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;

      // try/catch además de leer `error`: una falla de red (a diferencia
      // de un error HTTP normal, que sí viene como {error}) puede
      // rechazar la promesa directamente — sin esto, ese caso se saldría
      // sin pasar por el finally de abajo y el botón se quedaría en
      // "Subiendo…" para siempre.
      try {
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "3600" });

        if (uploadError) {
          setError(`No se pudo subir "${file.name}".`);
          continue;
        }

        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      } catch {
        setError(`No se pudo subir "${file.name}" — revisa tu conexión.`);
      }
    }

    if (uploaded.length > 0) {
      onChange([...images, ...uploaded]);
    }
    setIsUploading(false);
  }

  function handleRemove(url: string) {
    // Solo se quita del arreglo del producto — el archivo se queda en
    // Storage (limpieza automática de objetos huérfanos: fuera de
    // alcance por ahora, el costo de almacenamiento es mínimo).
    onChange(images.filter((image) => image !== url));
  }

  return (
    <div>
      <p className="mb-1.5 font-sans text-sm font-medium text-brand-black">Imágenes</p>

      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-md bg-brand-gray">
              <Image src={url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                aria-label="Quitar imagen"
                className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-brand-black/70 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        htmlFor={inputId}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-brand-slate/30 px-4 font-sans text-sm font-medium text-brand-slate hover:border-brand-slate/60 hover:bg-brand-gray"
      >
        {isUploading ? "Subiendo…" : "Subir imágenes"}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        disabled={isUploading}
        onChange={handleFilesSelected}
        className="sr-only"
      />

      {error && <p className="mt-2 font-sans text-xs text-red-700">{error}</p>}
      {images.length === 0 && !error && (
        <p className="mt-2 font-sans text-xs text-brand-slate/70">
          Se requiere al menos una imagen para poder activar el producto.
        </p>
      )}
    </div>
  );
}
