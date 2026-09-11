import { RatingStars } from "@/components/ui";
import { ReviewForm } from "./ReviewForm";
import type { Review } from "@/types/catalog";

// Reutiliza rating/reviewCount ya calculados en mapRowToProduct (a partir
// de las mismas reseñas aprobadas que trae `reviews`) en vez de volver a
// promediar aquí — un solo lugar calcula el promedio, esta sección solo
// lo muestra junto al listado de comentarios.
export function ProductReviews({
  productSlug,
  rating,
  reviewCount,
  reviews,
}: {
  productSlug: string;
  rating?: number;
  reviewCount?: number;
  reviews: Review[];
}) {
  return (
    <section className="mt-14 sm:mt-20" aria-labelledby="resenas-heading">
      <h2
        id="resenas-heading"
        className="mb-4 font-display text-lg uppercase text-brand-slate sm:mb-6 sm:text-xl"
      >
        Reseñas de clientes
      </h2>

      {typeof rating === "number" ? (
        <div className="mb-6 flex items-center gap-2">
          <RatingStars value={rating} />
          <span className="font-sans text-sm text-brand-black">
            {rating.toFixed(1)} de 5 · {reviewCount} {reviewCount === 1 ? "reseña" : "reseñas"}
          </span>
        </div>
      ) : (
        <p className="mb-6 font-sans text-sm text-brand-slate">
          Sin reseñas todavía. ¡Sé el primero en escribir una!
        </p>
      )}

      {reviews.length > 0 && (
        <ul className="mb-8 flex flex-col gap-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-sans text-sm font-semibold text-brand-black">
                  {review.authorName}
                </p>
                <RatingStars value={review.rating} />
              </div>
              <p className="mt-2 font-sans text-sm text-brand-black">{review.comment}</p>
            </li>
          ))}
        </ul>
      )}

      <ReviewForm productSlug={productSlug} />
    </section>
  );
}
