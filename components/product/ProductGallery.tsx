"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";
import { ProductImagePlaceholder } from "@/components/ui";

// Cuánto se amplía la imagen en el panel de zoom — 2.5x es el punto medio
// habitual en este patrón (Amazon usa algo similar): suficiente para ver
// detalle real sin que la porción visible quede tan chica que sea difícil
// de recorrer con el cursor.
const ZOOM_FACTOR = 2.5;

export function ProductGallery({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canHover, setCanHover] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const selectedImage = images[selectedIndex];

  // "hover: hover and pointer: fine" es la forma correcta de detectar "hay
  // un mouse de verdad" — a diferencia de mirar el ancho de pantalla, un
  // tablet o teléfono grande en horizontal no cae aquí, y una laptop con
  // ventana angosta sí. Decide qué interacción ofrecer: lupa (escritorio)
  // o abrir el lightbox al tocar (todo lo demás, sin hover confiable).
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanHover(query.matches);
    function handleChange(event: MediaQueryListEvent) {
      setCanHover(event.matches);
    }
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = imageWrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    setPointer({ x, y });
  }

  // Tamaño de la lupa en la imagen original: el recuadro debe medir,
  // proporcionalmente, lo que ZOOM_FACTOR dice que representa 1/ZOOM_FACTOR
  // de la imagen completa — así lo que queda dentro del recuadro es
  // exactamente lo que se ve ampliado en el panel de al lado.
  const lensSizePercent = 100 / ZOOM_FACTOR;
  const lensStyle = {
    width: `${lensSizePercent}%`,
    height: `${lensSizePercent}%`,
    left: `${pointer.x * 100 - lensSizePercent / 2}%`,
    top: `${pointer.y * 100 - lensSizePercent / 2}%`,
  };
  const zoomPanelStyle = selectedImage
    ? {
        backgroundImage: `url(${selectedImage})`,
        backgroundSize: `${ZOOM_FACTOR * 100}%`,
        backgroundPosition: `${pointer.x * 100}% ${pointer.y * 100}%`,
        backgroundRepeat: "no-repeat",
      }
    : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        {selectedImage ? (
          <div
            ref={imageWrapperRef}
            className={canHover ? "relative cursor-crosshair" : "relative"}
            onMouseEnter={() => canHover && setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={canHover ? handleMouseMove : undefined}
            onClick={() => !canHover && setLightboxOpen(true)}
          >
            <Image
              src={selectedImage}
              alt={productName}
              width={800}
              height={800}
              priority
              className="aspect-square w-full rounded-lg object-cover"
            />
            {/* Recuadro que sigue al cursor, mostrando qué porción es la
                que se ve ampliada en el panel de al lado — solo visible
                mientras el cursor está sobre la imagen. */}
            {isZooming && (
              // hidden lg:block: sin el panel de zoom (que solo aparece
              // desde lg, ver más abajo) este recuadro no tendría ningún
              // resultado que mostrar — mejor no dibujarlo que dejarlo
              // flotando sin efecto visible.
              <div
                aria-hidden="true"
                className="pointer-events-none absolute hidden border-2 border-brand-orange bg-brand-orange/10 lg:block"
                style={lensStyle}
              />
            )}
            {/* Pista visual de que la imagen se puede tocar para verla más
                grande — sin esto, nada en pantalla insinúa que el tap abre
                el lightbox (a diferencia de escritorio, donde el cursor de
                mira ya lo hace). Solo en el camino sin hover. */}
            {!canHover && (
              <span
                aria-hidden="true"
                className="absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-full bg-brand-black/60 text-white"
              >
                <ZoomIn className="size-4" strokeWidth={1.75} />
              </span>
            )}
          </div>
        ) : (
          <ProductImagePlaceholder className="aspect-square w-full" />
        )}

        {/* Panel de zoom estilo Amazon: mismo tamaño aproximado que la
            imagen (w-full/h-full contra el wrapper "relative" de arriba),
            flotando a la derecha sin empujar el layout — por eso es
            "absolute", no un tercer elemento del grid. Solo desde lg: más
            angosto no hay espacio real para mostrarlo sin que se salga de
            la pantalla. */}
        {isZooming && selectedImage && (
          // aspect-square (no h-full): el wrapper "relative" que lo
          // contiene no tiene una altura explícita, así que un hijo
          // absolute con height:100% colapsaría a 0 (percentage height
          // contra un ancestro de altura "auto" no resuelve) — aspect-square
          // le da una altura definida a partir de su propio ancho sin
          // depender de la del padre.
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-full top-0 z-20 ml-4 hidden aspect-square w-full overflow-hidden rounded-lg border border-brand-slate/15 bg-white shadow-lg lg:block"
            style={zoomPanelStyle}
          />
        )}
      </div>

      {/* Con una sola imagen (o ninguna) no tiene sentido "elegir" entre
          miniaturas — la fila solo aparece con 2 o más. */}
      {images.length > 1 && (
        <div
          role="group"
          aria-label="Miniaturas del producto"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
              aria-current={index === selectedIndex}
              className={`size-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors sm:size-20 ${
                index === selectedIndex
                  ? "border-brand-orange"
                  : "border-transparent hover:border-brand-slate/30"
              }`}
            >
              <Image src={image} alt="" width={160} height={160} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox de pantalla completa (móvil/sin hover): la imagen se
          muestra a su tamaño natural dentro de un contenedor con scroll
          propio, sin bloquear los gestos táctiles nativos del navegador
          (nada de touch-action: none) — el pellizco para acercar y el
          arrastre para desplazar los da el navegador solo. */}
      {lightboxOpen && selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} — imagen ampliada`}
          className="fixed inset-0 z-50 overflow-auto bg-brand-black/95"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Cerrar imagen ampliada"
            className="fixed right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full bg-brand-black/60 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="size-5" aria-hidden="true" strokeWidth={1.75} />
          </button>
          <div className="flex min-h-full items-center justify-center p-4">
            <Image
              src={selectedImage}
              alt={productName}
              width={1600}
              height={1600}
              className="h-auto w-full max-w-3xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
