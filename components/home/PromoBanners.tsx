"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClassName } from "@/components/ui";

interface PromoBanner {
  id: string;
  gradientClassName: string;
  eyebrow: string;
  href: string;
}

// Arte de campaña pendiente: estos bloques son marcadores de posición con
// gradiente (tokens de marca) hasta que llegue la fotografía real.
// Reemplazar cuando exista: quitar gradientClassName y usar una imagen de
// fondo real, el resto del layout (texto, botón) no debería tener que
// cambiar.
const banners: PromoBanner[] = [
  {
    id: "campana-1",
    gradientClassName: "bg-gradient-to-r from-brand-slate to-brand-black",
    eyebrow: "Banner de campaña — arte pendiente",
    href: "/promociones",
  },
  {
    id: "campana-2",
    // Naranja con moderación: solo el extremo del gradiente, nunca la
    // mayoría del área del banner (regla de marca: naranja no es fondo
    // extenso).
    gradientClassName:
      "bg-gradient-to-r from-brand-slate via-brand-slate to-brand-orange/40",
    eyebrow: "Banner de campaña — arte pendiente",
    href: "/promociones",
  },
];

// Carrusel de portada completa: una portada visible a la vez, full-bleed
// (lo posiciona app/page.tsx fuera del contenedor con max-width). Sin
// autoplay todavía, per lo pedido. En móvil las flechas ocupaban demasiada
// área sobre el arte del banner y duplicaban lo que los puntos ya resuelven,
// así que ahí solo se muestran los puntos (44x44 cada uno); desde sm: hay
// espacio de sobra y se agregan las flechas como atajo directo prev/next.
export function PromoBanners() {
  const [index, setIndex] = useState(0);
  const hasMultiple = banners.length > 1;

  function goTo(i: number) {
    setIndex((i + banners.length) % banners.length);
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Promociones"
    >
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`flex h-56 w-full shrink-0 flex-col justify-center gap-3 px-5 sm:h-72 sm:px-16 md:h-96 lg:px-20 ${banner.gradientClassName}`}
            aria-hidden={i !== index}
          >
            <div className="mx-auto w-full max-w-6xl">
              <p className="max-w-[70%] font-display text-lg uppercase text-white sm:text-2xl md:text-3xl">
                {banner.eyebrow}
              </p>
              <div className="mt-3">
                <Link
                  href={banner.href}
                  tabIndex={i === index ? 0 : -1}
                  className={buttonClassName("primary")}
                >
                  Ver más
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Promoción anterior"
            className="absolute left-2 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-slate shadow transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:left-4 sm:flex"
          >
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Siguiente promoción"
            className="absolute right-2 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-slate shadow transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:right-4 sm:flex"
          >
            <ChevronRight className="size-6" aria-hidden="true" />
          </button>

          <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2">
            {/* El punto visual es pequeño, pero cada botón mantiene un
                área táctil de 44x44 (padding alrededor del punto). */}
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir a la promoción ${i + 1}`}
                aria-current={i === index}
                className="flex size-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span
                  className={`size-2.5 rounded-full transition-colors ${
                    i === index ? "bg-white" : "bg-white/50"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
