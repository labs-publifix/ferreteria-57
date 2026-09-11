import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/types/catalog";

interface ReviewRow {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  status: Review["status"];
  created_at: string;
}

function mapRowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productId: row.product_id,
    authorName: row.author_name,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
  };
}

// Sin .eq("status", "approved") explícito: la política RLS de reviews ya
// restringe esta consulta a solo aprobadas para cualquier caller que no
// sea admin (ver supabase/migrations/20260911010000_reviews.sql) — es la
// misma razón por la que PRODUCT_SELECT tampoco filtra a mano.
export async function getApprovedReviews(productId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, product_id, author_name, rating, comment, status, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapRowToReview);
}
