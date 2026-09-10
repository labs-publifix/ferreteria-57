import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar categoría — Panel de administración" };

export default async function AdminEditarCategoriaPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug, icon, position, active")
    .eq("id", params.id)
    .maybeSingle();

  if (!category) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">
        Editar categoría
      </h1>
      <CategoryForm
        mode="edit"
        categoryId={category.id}
        initialValues={{
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          position: category.position,
          active: category.active,
        }}
      />
    </div>
  );
}
