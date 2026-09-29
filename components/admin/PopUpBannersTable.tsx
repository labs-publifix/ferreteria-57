"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Pencil } from "lucide-react";
import { ConfirmDialog } from "@/components/ui";
import { computePopupStatus, POPUP_STATUS_BADGE_CLASS, POPUP_STATUS_LABEL } from "@/lib/popup/schedule";
import { formatMexicoCityDateTime } from "@/lib/popup/timezone";
import {
  deletePopupBanner,
  duplicatePopupBanner,
  setPopupBannerActive,
} from "@/app/(admin)/admin/(protected)/pop-up-banner/actions";
import type { PopupBanner } from "@/types/popup";

// Tabla completa como Client Component — mismo criterio que
// PromoBannersTable/ProductsTable: centraliza selección para eliminar y el
// estado de "procesando"/error por fila.
export function PopUpBannersTable({ banners }: { banners: PopupBanner[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);

  async function handleToggleActive(id: string, activo: boolean) {
    setPendingId(id);
    setRowErrors((current) => ({ ...current, [id]: "" }));
    const result = await setPopupBannerActive(id, activo);
    if (result.error) setRowErrors((current) => ({ ...current, [id]: result.error! }));
    setPendingId(null);
    router.refresh();
  }

  async function handleDuplicate(id: string) {
    setPendingId(id);
    setRowErrors((current) => ({ ...current, [id]: "" }));
    const result = await duplicatePopupBanner(id);
    if (result.error) setRowErrors((current) => ({ ...current, [id]: result.error! }));
    setPendingId(null);
    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    setPendingId(id);
    const result = await deletePopupBanner(id);
    if (result.error) setRowErrors((current) => ({ ...current, [id]: result.error! }));
    setPendingId(null);
    router.refresh();
  }

  if (banners.length === 0) {
    return (
      <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
        Todavía no hay banners — crea el primero con el botón de arriba.
      </p>
    );
  }

  return (
    <>
      <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Inicio</th>
              <th className="px-4 py-3">Fin</th>
              <th className="px-4 py-3" aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => {
              const isPending = pendingId === banner.id;
              const rowError = rowErrors[banner.id];
              const status = computePopupStatus(banner);

              return (
                <tr key={banner.id} className="border-b border-brand-slate/10 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-black">{banner.nombre}</p>
                    <p className="truncate text-xs text-brand-slate/60">{banner.titulo}</p>
                    {rowError && <p className="mt-1 text-xs text-red-700">{rowError}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleActive(banner.id, !banner.activo)}
                      title={
                        banner.activo
                          ? "Clic para desactivar"
                          : "Clic para activar (se valida traslape con otros banners activos)"
                      }
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${POPUP_STATUS_BADGE_CLASS[status]}`}
                    >
                      {POPUP_STATUS_LABEL[status]}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-brand-slate">{formatMexicoCityDateTime(banner.startsAt)}</td>
                  <td className="px-4 py-3 text-brand-slate">{formatMexicoCityDateTime(banner.endsAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/pop-up-banner/${banner.id}/editar`}
                        aria-label={`Editar ${banner.nombre}`}
                        className="flex size-9 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                      >
                        <Pencil className="size-4" aria-hidden="true" strokeWidth={1.75} />
                      </Link>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDuplicate(banner.id)}
                        aria-label={`Duplicar ${banner.nombre}`}
                        title="Duplicar"
                        className="flex size-9 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate disabled:opacity-50"
                      >
                        <Copy className="size-4" aria-hidden="true" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setDeleteTarget({ id: banner.id, nombre: banner.nombre })}
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
        title="Eliminar banner"
        description={
          deleteTarget
            ? `¿Eliminar "${deleteTarget.nombre}"? Esta acción no se puede deshacer.`
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
