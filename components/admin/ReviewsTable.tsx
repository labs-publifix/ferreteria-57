"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star } from "@/components/ui";
import { setReviewStatus, updateReview } from "@/app/(admin)/admin/(protected)/resenas/actions";
import type { ReviewStatus } from "@/types/catalog";

export interface ReviewRow {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  created_at: string;
  products: { name: string } | null;
}

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const STATUS_CLASS: Record<ReviewStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-brand-gray text-brand-slate",
};

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-3 py-2 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";

function EditRatingInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Calificación" className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} de 5 estrellas`}
          onClick={() => onChange(star)}
          className="flex size-7 items-center justify-center"
        >
          <Star filled={star <= value} className="size-5" />
        </button>
      ))}
    </div>
  );
}

// Tabla completa como Client Component (mismo criterio que
// CategoriesTable/ProductsTable): centraliza qué fila está en edición, qué
// fila está procesando algo, y el error propio de cada una.
export function ReviewsTable({ reviews }: { reviews: ReviewRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ authorName: string; rating: number; comment: string }>({
    authorName: "",
    rating: 0,
    comment: "",
  });
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  function startEditing(review: ReviewRow) {
    setEditingId(review.id);
    setEditValues({ authorName: review.author_name, rating: review.rating, comment: review.comment });
    setRowErrors((current) => ({ ...current, [review.id]: "" }));
  }

  async function handleStatusChange(id: string, status: ReviewStatus) {
    setPendingId(id);
    setRowErrors((current) => ({ ...current, [id]: "" }));
    const result = await setReviewStatus(id, status);
    if (result.error) setRowErrors((current) => ({ ...current, [id]: result.error! }));
    setPendingId(null);
    router.refresh();
  }

  async function handleSaveEdit(id: string) {
    setPendingId(id);
    setRowErrors((current) => ({ ...current, [id]: "" }));

    const formData = new FormData();
    formData.set("authorName", editValues.authorName);
    formData.set("rating", String(editValues.rating));
    formData.set("comment", editValues.comment);

    const result = await updateReview(id, formData);
    if (result.error) {
      setRowErrors((current) => ({ ...current, [id]: result.error! }));
      setPendingId(null);
      return;
    }
    setPendingId(null);
    setEditingId(null);
    router.refresh();
  }

  if (reviews.length === 0) {
    return (
      <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
        No hay reseñas que coincidan con esos filtros.
      </p>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
      <table className="w-full min-w-[820px] text-left font-sans text-sm">
        <thead>
          <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Calificación</th>
            <th className="px-4 py-3">Comentario</th>
            <th className="px-4 py-3">Estado</th>
            {/* aria-label en el <th> en vez de un span sr-only anidado: ese
                span es position:absolute sin inset propio, y su posición
                estática cae en la columna real de esta tabla ancha —
                dentro de un contenedor con scroll horizontal eso extendía
                el scrollWidth del documento completo en móvil (ver el
                mismo ajuste en ProductsTable). */}
            <th className="px-4 py-3" aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => {
            const isPending = pendingId === review.id;
            const isEditing = editingId === review.id;
            const rowError = rowErrors[review.id];

            return (
              <tr key={review.id} className="border-b border-brand-slate/10 align-top last:border-0">
                <td className="max-w-[160px] px-4 py-3 text-brand-slate">
                  {review.products?.name ?? "—"}
                </td>

                {isEditing ? (
                  <>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editValues.authorName}
                        onChange={(event) =>
                          setEditValues((current) => ({ ...current, authorName: event.target.value }))
                        }
                        className={inputClass}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EditRatingInput
                        value={editValues.rating}
                        onChange={(rating) => setEditValues((current) => ({ ...current, rating }))}
                      />
                    </td>
                    <td className="min-w-[220px] px-4 py-3">
                      <textarea
                        rows={3}
                        value={editValues.comment}
                        onChange={(event) =>
                          setEditValues((current) => ({ ...current, comment: event.target.value }))
                        }
                        className={inputClass}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-brand-black">{review.author_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5" aria-label={`${review.rating} de 5 estrellas`}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} filled={i < review.rating} className="size-4" />
                        ))}
                      </div>
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-brand-black">{review.comment}</td>
                  </>
                )}

                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[review.status]}`}
                  >
                    {STATUS_LABEL[review.status]}
                  </span>
                  {rowError && <p className="mt-1 text-xs text-red-700">{rowError}</p>}
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1.5">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSaveEdit(review.id)}
                          className="font-sans text-sm font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black disabled:opacity-50"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setEditingId(null)}
                          className="font-sans text-sm text-brand-slate/70 hover:text-brand-black disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        {review.status === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleStatusChange(review.id, "approved")}
                              className="font-sans text-sm font-semibold text-green-700 hover:underline disabled:opacity-50"
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleStatusChange(review.id, "rejected")}
                              className="font-sans text-sm text-red-700 hover:underline disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {review.status === "approved" && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleStatusChange(review.id, "rejected")}
                            className="font-sans text-sm text-red-700 hover:underline disabled:opacity-50"
                          >
                            Ocultar
                          </button>
                        )}
                        {review.status === "rejected" && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleStatusChange(review.id, "approved")}
                            className="font-sans text-sm font-semibold text-green-700 hover:underline disabled:opacity-50"
                          >
                            Aprobar
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => startEditing(review)}
                          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black disabled:opacity-50"
                        >
                          Editar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
