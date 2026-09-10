import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nuevo producto — Panel de administración" };

export default async function AdminNuevoProductoPage({
  searchParams,
}: {
  // Precarga la categoría cuando se entra desde /admin/categorias con un
  // acceso directo a "agregar producto en esta categoría" (?categoria=id).
  searchParams: { categoria?: string };
}) {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("position");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">
        Nuevo producto
      </h1>
      <ProductForm
        mode="create"
        categories={categories ?? []}
        defaultCategoryId={searchParams.categoria}
      />
    </div>
  );
}
