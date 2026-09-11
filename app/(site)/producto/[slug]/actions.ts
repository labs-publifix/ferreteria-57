"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SubmitReviewResult {
  error?: string;
  success?: boolean;
}

// Sin sesión requerida (a propósito): cualquier visitante puede escribir
// una reseña. El status SIEMPRE se fija aquí como 'pending' — nunca se lee
// un valor de status del formulario — y la política RLS de reviews
// (with check status = 'pending') es la segunda capa independiente que
// bloquea cualquier intento de insertar ya aprobada, aunque alguien
// mandara la petición directo a la API sin pasar por este formulario.
export async function submitReview(productSlug: string, formData: FormData): Promise<SubmitReviewResult> {
  const authorName = String(formData.get("authorName") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();
  const rating = Number.parseInt(String(formData.get("rating") ?? ""), 10);

  if (!authorName) return { error: "Escribe tu nombre." };
  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    return { error: "Elige una calificación de 1 a 5 estrellas." };
  }
  if (!comment) return { error: "Escribe un comentario." };

  const supabase = await createClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("slug", productSlug)
    .maybeSingle();
  if (productError) return { error: "No se pudo enviar tu reseña. Intenta de nuevo." };
  if (!product) return { error: "Este producto ya no está disponible." };

  const { error } = await supabase.from("reviews").insert({
    product_id: product.id,
    author_name: authorName,
    rating,
    comment,
    status: "pending",
  });
  if (error) return { error: "No se pudo enviar tu reseña. Intenta de nuevo." };

  // No cambia el promedio visible (la reseña nace pendiente, no aprobada),
  // pero sí revalida para cuando un admin la apruebe más tarde y alguien
  // recargue esta misma ficha.
  revalidatePath(`/producto/${productSlug}`);
  return { success: true };
}
