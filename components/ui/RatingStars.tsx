export interface RatingStarsProps {
  /** Calificación de 0 a 5. Se redondea a la estrella entera más cercana. */
  value: number;
  className?: string;
}

export const STAR_PATH =
  "M12 2.5l2.9 6.06 6.6.77-4.86 4.6 1.27 6.58L12 17.4l-5.91 3.11 1.27-6.58-4.86-4.6 6.6-.77z";

// Icono de estrella dibujado en SVG (un solo trazo/peso reutilizado para
// llena y vacía), no glifos Unicode ni emoji, por indicación de la skill
// Impeccable (craft-floor: "Unicode glyphs or emoji standing in for an
// icon system" está prohibido). Exportado (no solo de uso interno): el
// selector de calificación del formulario de reseñas (StarRatingInput)
// dibuja la misma forma en vez de mantener un segundo trazo de estrella.
// Sin tamaño por default: cada quien lo trae en className (RatingStars usa
// "size-4 sm:size-5"; StarRatingInput, más grande por ser un control con el
// que se interactúa) — dos clases `size-*` en el mismo elemento compiten
// por especificidad de origen en la hoja generada, no por su orden dentro
// del atributo class, así que es más seguro no fijar una acá que confiar
// en que un tamaño pasado por className la reemplace.
export function Star({ filled, className = "" }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${filled ? "text-brand-slate" : "text-brand-slate/30"} ${className}`}
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      strokeLinejoin="round"
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

// Solo de lectura: llena/vacía en base al valor, sin medias estrellas
// (no se pidieron y no se inventan aquí). Naranja no se usa aquí porque
// el cliente solo autorizó ese acento para botones, badges de descuento
// y precios activos; se usa gris pizarra, el color institucional dominante.
export function RatingStars({ value, className = "" }: RatingStarsProps) {
  const clamped = Math.min(5, Math.max(0, value));
  const filledCount = Math.round(clamped);

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`Calificación: ${clamped} de 5 estrellas`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} filled={i < filledCount} className="size-4 sm:size-5" />
      ))}
    </div>
  );
}
