"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui";
import { StarRatingInput } from "./StarRatingInput";
import { submitReview } from "@/app/(site)/producto/[slug]/actions";

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

export function ReviewForm({ productSlug }: { productSlug: string }) {
  const nameId = useId();
  const commentId = useId();
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating === 0) {
      setError("Elige una calificación de 1 a 5 estrellas.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("authorName", authorName);
    formData.set("rating", String(rating));
    formData.set("comment", comment);

    const result = await submitReview(productSlug, formData);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p
        role="status"
        className="rounded-md bg-green-50 px-4 py-3 font-sans text-sm text-green-800"
      >
        ¡Gracias! Tu reseña se publicará después de ser revisada.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg bg-brand-gray p-4 sm:p-6"
    >
      <h3 className="font-display text-base uppercase text-brand-slate">
        Escribir una reseña
      </h3>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label htmlFor={nameId} className={labelClass}>
          Tu nombre
        </label>
        <input
          id={nameId}
          type="text"
          required
          value={authorName}
          onChange={(event) => setAuthorName(event.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass}>Calificación</span>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <div>
        <label htmlFor={commentId} className={labelClass}>
          Comentario
        </label>
        <textarea
          id={commentId}
          required
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className={inputClass}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto sm:self-start">
        {isSubmitting ? "Enviando…" : "Enviar reseña"}
      </Button>
    </form>
  );
}
