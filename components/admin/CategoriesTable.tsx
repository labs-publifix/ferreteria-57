"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import {
  deleteCategory,
  toggleCategoryActive,
} from "@/app/(admin)/admin/(protected)/categorias/actions";

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  position: number;
  active: boolean;
  productCount: number;
}

// Tabla completa como Client Component (en vez de un botón cliente por
// fila): centraliza el estado de "qué fila está procesando algo" y "qué
// fila tiene un error propio" en un solo lugar, más simple que repartir
// muchas islas de cliente diminutas por fila.
export function CategoriesTable({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  async function handleToggleActive(id: string, active: boolean) {
    setPendingId(id);
    setRowErrors((current) => ({ ...current, [id]: "" }));
    const result = await toggleCategoryActive(id, active);
    if (result.error) {
      setRowErrors((current) => ({ ...current, [id]: result.error! }));
    }
    setPendingId(null);
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`¿Eliminar la categoría "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setPendingId(id);
    setRowErrors((current) => ({ ...current, [id]: "" }));
    const result = await deleteCategory(id);
    if (result.error) {
      setRowErrors((current) => ({ ...current, [id]: result.error! }));
    }
    setPendingId(null);
    router.refresh();
  }

  if (categories.length === 0) {
    return (
      <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
        Todavía no hay categorías — crea la primera con el botón de arriba.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left font-sans text-sm">
        <thead>
          <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">Productos</th>
            <th className="px-4 py-3">Posición</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.icon];
            const isPending = pendingId === category.id;
            const rowError = rowErrors[category.id];
            return (
              <tr key={category.id} className="border-b border-brand-slate/10 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {Icon && (
                      <Icon className="size-4 shrink-0 text-brand-slate" aria-hidden="true" strokeWidth={1.75} />
                    )}
                    <span className="font-medium text-brand-black">{category.name}</span>
                  </div>
                  {rowError && <p className="mt-1 text-xs text-red-700">{rowError}</p>}
                </td>
                <td className="px-4 py-3 text-brand-slate">{category.slug}</td>
                <td className="px-4 py-3 text-brand-slate">{category.productCount}</td>
                <td className="px-4 py-3 text-brand-slate">{category.position}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleToggleActive(category.id, !category.active)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${
                      category.active
                        ? "bg-green-100 text-green-800"
                        : "bg-brand-gray text-brand-slate"
                    }`}
                  >
                    {category.active ? "Activa" : "Inactiva"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/productos/nuevo?categoria=${category.id}`}
                      className="whitespace-nowrap font-sans text-sm font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
                    >
                      + Producto
                    </Link>
                    <Link
                      href={`/admin/categorias/${category.id}/editar`}
                      aria-label={`Editar ${category.name}`}
                      className="flex size-9 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                    >
                      <Pencil className="size-4" aria-hidden="true" strokeWidth={1.75} />
                    </Link>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(category.id, category.name)}
                      className="font-sans text-sm text-red-700 hover:underline disabled:opacity-50"
                    >
                      Eliminar
                    </button>
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
