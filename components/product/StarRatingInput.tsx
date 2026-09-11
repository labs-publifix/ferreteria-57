"use client";

import { useState } from "react";
import { Star } from "@/components/ui";

// Control interactivo (a diferencia de RatingStars, de solo lectura): el
// visitante elige 1-5 estrellas para su reseña. Mismo trazo de estrella
// que el resto del sitio (Star, ver components/ui/RatingStars.tsx), solo
// que más grande — es un control con el que se interactúa, no una
// etiqueta pasiva.
export function StarRatingInput({
  value,
  onChange,
  label = "Calificación",
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} de 5 estrellas`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(star)}
          onBlur={() => setHovered(null)}
          onClick={() => onChange(star)}
          className="flex size-11 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        >
          <Star filled={star <= display} className="size-7" />
        </button>
      ))}
    </div>
  );
}
