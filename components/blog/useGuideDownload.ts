"use client";

import { useState } from "react";
import { useToast } from "@/components/ui";
import { pushBlogEvent } from "@/lib/blog/analytics";
import { guiaDownloadHref } from "@/lib/blog/guias";
import { filenameFromContentDisposition } from "@/lib/club57/promociones/archivo";

// Descarga de una guía PDF (CTA del artículo y «Mis guías»): fetch al
// endpoint protegido y guardado como archivo, con el mensaje del servidor
// en un toast si algo falla (401, 403, 404, 429). Solo un clic a la vez.
export function useGuideDownload(onDownloaded?: (slug: string) => void) {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  async function download(slug: string) {
    if (downloading) return;
    setDownloading(slug);
    try {
      const response = await fetch(guiaDownloadHref(slug), { cache: "no-store" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        showToast({ message: body?.error ?? "No se pudo descargar la guía. Intenta de nuevo." });
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFromContentDisposition(response.headers.get("content-disposition")) ?? `guia-${slug}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      pushBlogEvent("blog_guia_descarga", { slug });
      onDownloaded?.(slug);
    } catch {
      showToast({ message: "No se pudo descargar. Revisa tu conexión e intenta de nuevo." });
    } finally {
      setDownloading(null);
    }
  }

  return { download, downloading };
}
