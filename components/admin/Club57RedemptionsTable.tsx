"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui";
import { updateClub57RedemptionStatus } from "@/app/(admin)/admin/(protected)/lealtad/canjes/actions";
import { CLUB57_REDEMPTION_ESTADO_LABEL } from "@/lib/club57/labels";

export interface Club57RedemptionRow {
  id: string;
  puntosUsados: number;
  estado: "pendiente" | "entregado" | "cancelado";
  createdAt: string;
  memberNombre: string;
  memberEmail: string;
  itemNombre: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

const ESTADO_STYLE: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-700",
};

// Cancelar reembolsa puntos al cliente y restaura stock (ver
// update_club57_redemption_status en la migración) — pide confirmación
// como cualquier otra acción que revierte algo ya hecho; "Entregar" no
// toca ni puntos ni stock (ya se descontaron al solicitar el canje), así
// que no necesita segunda confirmación.
export function Club57RedemptionsTable({
  rows,
  showActions,
}: {
  rows: Club57RedemptionRow[];
  showActions: boolean;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [cancelTarget, setCancelTarget] = useState<Club57RedemptionRow | null>(null);

  async function handleResolve(id: string, estado: "entregado" | "cancelado") {
    setPendingId(id);
    setRowErrors((current) => ({ ...current, [id]: "" }));
    const result = await updateClub57RedemptionStatus(id, estado);
    if (result.error) setRowErrors((current) => ({ ...current, [id]: result.error! }));
    setPendingId(null);
    router.refresh();
  }

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    const { id } = cancelTarget;
    setCancelTarget(null);
    await handleResolve(id, "cancelado");
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
        Sin canjes en esta lista.
      </p>
    );
  }

  return (
    <>
      <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Artículo</th>
              <th className="px-4 py-3">Puntos</th>
              <th className="px-4 py-3">Estado</th>
              {showActions && <th className="px-4 py-3" aria-label="Acciones" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isPending = pendingId === row.id;
              const rowError = rowErrors[row.id];
              return (
                <tr key={row.id} className="border-b border-brand-slate/10 last:border-0">
                  <td className="px-4 py-3 text-brand-slate">{dateFormatter.format(new Date(row.createdAt))}</td>
                  <td className="max-w-[200px] px-4 py-3">
                    <p className="truncate font-medium text-brand-black">{row.memberNombre}</p>
                    <p className="truncate text-xs text-brand-slate/60">{row.memberEmail}</p>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-brand-black">{row.itemNombre}</td>
                  <td className="px-4 py-3 text-brand-black">{row.puntosUsados} pts</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_STYLE[row.estado]}`}>
                      {CLUB57_REDEMPTION_ESTADO_LABEL[row.estado]}
                    </span>
                    {rowError && <p className="mt-1 text-xs text-red-700">{rowError}</p>}
                  </td>
                  {showActions && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleResolve(row.id, "entregado")}
                          className="font-sans text-sm text-brand-slate hover:underline disabled:opacity-50"
                        >
                          Entregar
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setCancelTarget(row)}
                          className="font-sans text-sm text-red-700 hover:underline disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancelar canje"
        description={
          cancelTarget
            ? `¿Cancelar el canje de "${cancelTarget.itemNombre}"? Se le reembolsan ${cancelTarget.puntosUsados} puntos al cliente y se restaura el stock del artículo.`
            : undefined
        }
        confirmLabel="Cancelar canje"
        tone="danger"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
}
