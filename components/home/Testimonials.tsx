import { RatingStars } from "@/components/ui";
import { GOOGLE_MAPS_REVIEWS_URL } from "@/lib/store-info";
import { testimonials } from "@/lib/mock-data/testimonials";

// Grid 2x2 desde sm:, apiladas en móvil (una sola columna): con solo 4
// reseñas, otro carrusel/riel habría repetido el mismo patrón de control
// que PromoRail ya resuelve, sin necesidad real — apilar es más simple y
// sigue siendo cómodo de leer en móvil.
// Sin h-full en las tarjetas: mismo criterio que ProductCard (ver ese
// componente) — se deja que el align-items:stretch por defecto de grid
// iguale la altura de las tarjetas de cada fila en vez de forzar un alto
// que el navegador no puede resolver contra un contenedor sin alto propio.
export function Testimonials() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="flex flex-col gap-3 rounded-lg bg-white p-6 shadow-sm"
          >
            <RatingStars value={5} />
            <p className="line-clamp-4 font-sans text-sm text-brand-black sm:text-base">
              “{testimonial.quote}”
            </p>
            <p className="mt-auto font-sans text-sm font-semibold text-brand-slate">
              {testimonial.name}
            </p>
          </div>
        ))}
      </div>

      <a
        href={GOOGLE_MAPS_REVIEWS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-sans text-sm font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
      >
        Ver más reseñas en Google
      </a>
    </div>
  );
}
