"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReviewStatus } from "@/types/catalog";

export interface ReviewActionResult {
  error?: string;
}

// Mismo criterio que el resto del admin: cada Server Action confirma
// is_admin() por su cuenta, sin confiar en que el middleware ya filtró la
// request.
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return null;

  return supabase;
}

export async function setReviewStatus(id: string, status: ReviewStatus): Promise<ReviewActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
  if (error) return { error: `No se pudo actualizar la reseña: ${error.message}` };

  revalidatePath("/admin/resenas");
  return {};
}

export async function updateReview(
  id: string,
  formData: FormData
): Promise<ReviewActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const authorName = String(formData.get("authorName") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();
  const rating = Number.parseInt(String(formData.get("rating") ?? ""), 10);

  if (!authorName) return { error: "El nombre no puede quedar vacío." };
  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    return { error: "La calificación debe ser de 1 a 5." };
  }
  if (!comment) return { error: "El comentario no puede quedar vacío." };

  const { error } = await supabase
    .from("reviews")
    .update({ author_name: authorName, rating, comment })
    .eq("id", id);
  if (error) return { error: `No se pudo guardar la reseña: ${error.message}` };

  revalidatePath("/admin/resenas");
  return {};
}
