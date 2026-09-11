import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata: Metadata = { title: "Nueva categoría — Panel de administración" };

export default function AdminNuevaCategoriaPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">
        Nueva categoría
      </h1>
      <CategoryForm mode="create" />
    </div>
  );
}
