import type { Metadata } from "next";
import { FilterSelectField } from "@/components/admin/FilterSelectField";
import { ReviewsTable, type ReviewRow } from "@/components/admin/ReviewsTable";
import { buttonClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reseñas — Panel de administración" };

// RLS permite a un admin ver reseñas de cualquier estado (no solo
// aprobadas) porque esta consulta corre con la sesión del admin logueado
// — mismo criterio que ya usan /admin/categorias y /admin/productos.
async function getAdminReviews(filters: { estado: string; producto: string }): Promise<ReviewRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("reviews")
    .select("id, product_id, author_name, rating, comment, status, created_at, products(name)")
    .order("created_at", { ascending: false });

  if (filters.estado) query = query.eq("status", filters.estado);
  if (filters.producto) query = query.eq("product_id", filters.producto);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ReviewRow[];
}

export default async function AdminResenasPage({
  searchParams,
}: {
  searchParams: { estado?: string; producto?: string };
}) {
  const supabase = await createClient();
  const filters = {
    estado: searchParams.estado ?? "",
    producto: searchParams.producto ?? "",
  };

  const { data: products } = await supabase.from("products").select("id, name").order("name");

  let reviews: ReviewRow[] = [];
  let loadError: string | null = null;
  try {
    reviews = await getAdminReviews(filters);
  } catch (err) {
    loadError = `No se pudieron cargar las reseñas: ${err instanceof Error ? err.message : "error desconocido"}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Reseñas</h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
          Las reseñas nuevas nacen pendientes y no aparecen en el sitio público hasta que las apruebas
          aquí. Una reseña aprobada puede editarse o volver a ocultarse en cualquier momento.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div>
          <span className="mb-1.5 block font-sans text-sm font-medium text-brand-black">Estado</span>
          <FilterSelectField
            name="estado"
            defaultValue={filters.estado}
            label="Estado"
            options={[
              { value: "", label: "Todas" },
              { value: "pending", label: "Pendiente" },
              { value: "approved", label: "Aprobada" },
              { value: "rejected", label: "Rechazada" },
            ]}
          />
        </div>

        <div>
          <span className="mb-1.5 block font-sans text-sm font-medium text-brand-black">Producto</span>
          <FilterSelectField
            name="producto"
            defaultValue={filters.producto}
            label="Producto"
            options={[
              { value: "", label: "Todos" },
              ...(products ?? []).map((product) => ({ value: product.id, label: product.name })),
            ]}
          />
        </div>

        <button type="submit" className={buttonClassName("secondary")}>
          Filtrar
        </button>
      </form>

      {loadError ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {loadError}
        </p>
      ) : (
        <ReviewsTable reviews={reviews} />
      )}
    </div>
  );
}
