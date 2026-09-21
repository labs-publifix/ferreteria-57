"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { ConfirmDialog, ProductImagePlaceholder } from "@/components/ui";
import { toggleCatalogItemActive } from "@/app/(admin)/admin/(protected)/lealtad/catalogo/actions";

export interface Club57CatalogRow {
  id: string;
  nombre: string;
  costo_puntos: number;
  stock: number;
  image_url: string | null;
  active: boolean;
}

// "Eliminar" nunca hace un DELETE real — solo desactiva (active=false),
// igual que el ConfirmDialog de abajo describe. Reactivar es el mismo
// control con el valor contrario, sin un botón aparte.
export function Club57CatalogTable({ items }: { items: Club57CatalogRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; nombre: string } | null>(null);

  async function handleToggle(id: string, active: boolean) {
    setPendingId(id);
    setRowErrors((current) => ({ ...current, [id]: "" }));
    const result = await toggleCatalogItemActive(id, active);
    if (result.error) setRowErrors((current) => ({ ...current, [id]: result.error! }));
    setPendingId(null);
    router.refresh();
  }

  async function handleConfirmDeactivate() {
    if (!deactivateTarget) return;
    const { id } = deactivateTarget;
    setDeactivateTarget(null);
    await handleToggle(id, false);
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
        Todavía no hay artículos en el catálogo — crea el primero o impórtalo desde Excel.
      </p>
    );
  }

  return (
    <>
      <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
              <th className="px-4 py-3">Artículo</th>
              <th className="px-4 py-3">Puntos</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isPending = pendingId === item.id;
              const rowError = rowErrors[item.id];
              return (
                <tr key={item.id} className="border-b border-brand-slate/10 last:border-0">
                  <td className="max-w-[260px] px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <ProductImagePlaceholder className="size-10 shrink-0 text-[10px]" />
                      )}
                      <p className="truncate font-medium text-brand-black">{item.nombre}</p>
                    </div>
                    {rowError && <p className="mt-1 text-xs text-red-700">{rowError}</p>}
                  </td>
                  <td className="px-4 py-3 text-brand-slate">{item.costo_puntos} pts</td>
                  <td className="px-4 py-3 text-brand-slate">{item.stock}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggle(item.id, !item.active)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${
                        item.active ? "bg-green-100 text-green-800" : "bg-brand-gray text-brand-slate"
                      }`}
                    >
                      {item.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/lealtad/catalogo/${item.id}/editar`}
                        aria-label={`Editar ${item.nombre}`}
                        className="flex size-9 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                      >
                        <Pencil className="size-4" aria-hidden="true" strokeWidth={1.75} />
                      </Link>
                      {item.active && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setDeactivateTarget({ id: item.id, nombre: item.nombre })}
                          className="font-sans text-sm text-red-700 hover:underline disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deactivateTarget !== null}
        title="Eliminar artículo"
        description={
          deactivateTarget
            ? `¿Eliminar "${deactivateTarget.nombre}"? Se desactiva del catálogo de canje — puedes reactivarlo después desde su estado.`
            : undefined
        }
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </>
  );
}
