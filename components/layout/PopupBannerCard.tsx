"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import type { PopupBackgroundType } from "@/types/popup";

// Forma mínima que necesita el contenido visual — tanto el banner público
// real (PublicPopupBanner, con id/updatedAt) como el objeto "de mentiras"
// que arma el formulario del admin para su vista previa en vivo (mismo
// criterio que PromoBannerForm/PromoCard: la vista previa renderiza el
// componente REAL, nunca una aproximación aparte).
export interface PopupCardContentData {
  titulo: string;
  texto: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  tipoFondo: PopupBackgroundType;
  colorFondo: string;
  colorTexto: string;
  colorBoton: string;
  colorTextoBoton: string;
  imagenUrl: string | null;
  textoAlternativo: string | null;
}

// Colores arbitrarios (selector de color real, no un enum de temas de
// marca como Promo Banners) — no hay clases de Tailwind que los cubran,
// así que van por `style` inline. Con fondo de imagen, el texto/botón
// siempre van en blanco sobre la capa degradada oscura (nunca el color de
// texto elegido): ningún color arbitrario puede garantizarse legible
// encima de una foto cualquiera, pero un degradado suficientemente oscuro
// sí garantiza que el blanco lo sea — por eso el checador de contraste del
// formulario (lib/popup/contrast.ts) valida colorTexto contra un negro de
// referencia cuando tipoFondo es "imagen", no contra colorFondo.
export function PopupBannerCardContent({
  banner,
  onClose,
  interactive = true,
}: {
  banner: PopupCardContentData;
  onClose?: () => void;
  /** false en la vista previa del admin: el botón cerrar y el CTA se ven
   *  pero no navegan ni reciben foco por teclado — es una muestra, no el
   *  banner real. */
  interactive?: boolean;
}) {
  const isImage = banner.tipoFondo === "imagen" && banner.imagenUrl;
  const textColor = isImage ? "#FFFFFF" : banner.colorTexto;

  const cta = banner.ctaLabel && banner.ctaUrl && (
    banner.ctaUrl.startsWith("/") ? (
      <Link
        href={banner.ctaUrl}
        tabIndex={interactive ? undefined : -1}
        style={{ backgroundColor: banner.colorBoton, color: banner.colorTextoBoton }}
        className="mt-3 inline-flex min-h-9 items-center justify-center rounded-md px-4 font-sans text-sm font-semibold transition-opacity hover:opacity-90"
      >
        {banner.ctaLabel}
      </Link>
    ) : (
      <a
        href={banner.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={interactive ? undefined : -1}
        style={{ backgroundColor: banner.colorBoton, color: banner.colorTextoBoton }}
        className="mt-3 inline-flex min-h-9 items-center justify-center rounded-md px-4 font-sans text-sm font-semibold transition-opacity hover:opacity-90"
      >
        {banner.ctaLabel}
      </a>
    )
  );

  return (
    <div
      style={{ backgroundColor: isImage ? undefined : banner.colorFondo }}
      className="relative max-h-[25vh] overflow-hidden rounded-xl shadow-xl"
    >
      {isImage && (
        <>
          <Image
            src={banner.imagenUrl!}
            alt={banner.textoAlternativo ?? ""}
            fill
            loading="lazy"
            className="object-cover"
          />
          {/* Capa degradada oscura: garantiza legibilidad del texto blanco
              sin importar qué tan clara sea la foto de fondo — más oscura
              abajo (donde vive el texto) que arriba. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/20" />
        </>
      )}

      <div className="relative flex flex-col p-4">
        <button
          type="button"
          onClick={onClose}
          tabIndex={interactive ? undefined : -1}
          aria-label="Cerrar"
          style={{ color: textColor }}
          className="absolute right-2 top-2 flex min-h-11 min-w-11 items-center justify-center rounded-full opacity-80 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="size-5" aria-hidden="true" strokeWidth={2} />
        </button>

        <div className="max-w-[calc(100%-2.75rem)]">
          <p style={{ color: textColor }} className="font-display text-base leading-snug">
            {banner.titulo}
          </p>
          <p style={{ color: textColor }} className="mt-1 font-sans text-sm leading-snug opacity-90">
            {banner.texto}
          </p>
          {cta}
        </div>
      </div>
    </div>
  );
}
