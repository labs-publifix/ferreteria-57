import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonClassName } from "@/components/ui";
import { CategoriesTable, type CategoryRow } from "@/components/admin/CategoriesTable";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Categorías — Panel de administración" };

// La cantidad de productos por categoría se calcula aquí, no se guarda en
// la tabla — así nunca puede desincronizarse con la realidad. RLS permite
// a un admin ver todas las categorías (activas e inactivas) porque esta
// consulta corre con la sesión del admin logueado, no con la anon key.
async function getCategoriesWithCounts(): Promise<CategoryRow[]> {
  const supabase = await createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, icon, position, active").order("position"),
    supabase.from("products").select("category_id"),
  ]);

  const counts = new Map<string, number>();
  for (const product of products ?? []) {
    counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
  }

  return (categories ?? []).map((category) => ({
    ...category,
    productCount: counts.get(category.id) ?? 0,
  }));
}

export default async function AdminCategoriasPage() {
  let categories: CategoryRow[] = [];
  let loadError: string | null = null;

  try {
    categories = await getCategoriesWithCounts();
  } catch {
    loadError = "No se pudieron cargar las categorías.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">
            Categorías
          </h1>
          <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
            Las categorías inactivas no aparecen en el menú ni en el grid del
            Home. Solo se pueden eliminar si no tienen productos asociados.
          </p>
        </div>
        <Link href="/admin/categorias/nueva" className={buttonClassName("primary", "shrink-0")}>
          <Plus className="size-4" aria-hidden="true" strokeWidth={2} />
          Nueva categoría
        </Link>
      </div>

      {loadError ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {loadError}
        </p>
      ) : (
        <CategoriesTable categories={categories} />
      )}
    </div>
  );
}
