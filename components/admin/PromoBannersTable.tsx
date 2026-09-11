"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { ConfirmDialog, ProductImagePlaceholder } from "@/components/ui";
import { isWithinSchedule } from "@/lib/marketing/visibility";
import {
  deletePromoBanner,
  togglePromoBannerActive,
} from "@/app/(admin)/admin/(protected)/promo-banners/actions";
import type { PromoBanner } from "@/types/marketing";

function formatSchedule(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt && !endsAt) return "Permanente";
  if (startsAt && endsAt) return `${startsAt} a ${endsAt}`;
  if (startsAt) return `Desde ${startsAt}`;
  return `Hasta ${endsAt}`;
}

// Tabla completa como Client Component (mismo criterio que
// CategoriesTable/ProductsTable): centraliza selección de fila para
// eliminar y el estado de "procesando"/error por fila en un solo lugar.
export function PromoBannersTable({ promoBanners }: { promoBanners: PromoBanner[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  async function handleToggleActive(id: string, active: boolean) {
    setPendingId(id);
    setRowErrors((current) => ({ ...current, [id]: "" }));
    const result = await togglePromoBannerActive(id, active);
    if (result.error) setRowErrors((current) => ({ ...current, [id]: result.error! }));
    setPendingId(null);
    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    setPendingId(id);
    setRowErrors((current) => ({ ...current, [id]: "" }));
    const result = await deletePromoBanner(id);
    if (result.error) setRowErrors((current) => ({ ...current, [id]: result.error! }));
    setPendingId(null);
    router.refresh();
  }

  if (promoBanners.length === 0) {
    return (
      <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
        Todavía no hay tarjetas de promoción — crea la primera con el botón de arriba.
      </p>
    );
  }

  return (
    <>
      <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
              <th className="px-4 py-3">Tarjeta</th>
              <th className="px-4 py-3">Tema</th>
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Vigencia</th>
              <th className="px-4 py-3">Visible ahora</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {promoBanners.map((promo) => {
              const isPending = pendingId === promo.id;
              const rowError = rowErrors[promo.id];
              const visibleNow = isWithinSchedule(promo);
              const hasSchedule = Boolean(promo.startsAt || promo.endsAt);

              return (
                <tr key={promo.id} className="border-b border-brand-slate/10 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {promo.imageUrl ? (
                        <Image
                          src={promo.imageUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <ProductImagePlaceholder className="size-10 shrink-0 text-[10px]" />
                      )}
                      <div>
                        {promo.eyebrow && (
                          <p className="text-xs uppercase tracking-wide text-brand-slate/70">{promo.eyebrow}</p>
                        )}
                        <p className="font-medium text-brand-black">{promo.title}</p>
                      </div>
                    </div>
                    {rowError && <p className="mt-1 text-xs text-red-700">{rowError}</p>}
                  </td>
                  <td className="px-4 py-3 capitalize text-brand-slate">{promo.colorTheme}</td>
                  <td className="px-4 py-3 text-brand-slate">{promo.position}</td>
                  <td className="px-4 py-3 text-brand-slate">
                    {formatSchedule(promo.startsAt, promo.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        visibleNow ? "bg-green-100 text-green-800" : "bg-brand-gray text-brand-slate"
                      }`}
                    >
                      {visibleNow ? "Visible" : "No visible"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isPending || hasSchedule}
                      onClick={() => handleToggleActive(promo.id, !promo.active)}
                      title={hasSchedule ? "La vigencia manda mientras tenga fechas configuradas" : undefined}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${
                        promo.active ? "bg-green-100 text-green-800" : "bg-brand-gray text-brand-slate"
                      }`}
                    >
                      {promo.active ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/promo-banners/${promo.id}/editar`}
                        aria-label={`Editar ${promo.title}`}
                        className="flex size-9 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                      >
                        <Pencil className="size-4" aria-hidden="true" strokeWidth={1.75} />
                      </Link>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setDeleteTarget({ id: promo.id, title: promo.title })}
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar tarjeta"
        description={
          deleteTarget
            ? `¿Eliminar la tarjeta "${deleteTarget.title}"? Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
