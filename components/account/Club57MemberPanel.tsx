"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClassName, ConfirmDialog, ProductImagePlaceholder } from "@/components/ui";
import { requestClub57Redemption } from "@/app/(site)/cuenta/actions";
import { CLUB57_REDEMPTION_ESTADO_LABEL, CLUB57_TIPO_LABEL } from "@/lib/club57/labels";

export interface Club57LedgerRow {
  id: string;
  cantidad: number;
  tipo: string;
  estado: "pendiente" | "disponible";
  created_at: string;
  referencia: string | null;
}

export interface Club57CatalogItem {
  id: string;
  nombre: string;
  descripcion: string;
  costo_puntos: number;
  stock: number;
  image_url: string | null;
}

export interface Club57RedemptionRow {
  id: string;
  puntos_usados: number;
  estado: "pendiente" | "entregado" | "cancelado";
  created_at: string;
  itemNombre: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

const REDEMPTION_ESTADO_STYLE: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-700",
};

export function Club57MemberPanel({
  saldoDisponible,
  puntosPendientes,
  historial,
  catalogo,
  misCanjes,
}: {
  saldoDisponible: number;
  puntosPendientes: number;
  historial: Club57LedgerRow[];
  catalogo: Club57CatalogItem[];
  misCanjes: Club57RedemptionRow[];
}) {
  const router = useRouter();
  const [confirmTarget, setConfirmTarget] = useState<Club57CatalogItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleConfirmRedeem() {
    if (!confirmTarget) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    const result = await requestClub57Redemption(confirmTarget.id);
    setIsSubmitting(false);
    setConfirmTarget(null);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(`Canje solicitado: "${confirmTarget.nombre}". Recógelo en tienda.`);
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-5 text-center shadow-sm">
          <p className="font-display text-3xl text-brand-black">{saldoDisponible} pts</p>
          <p className="mt-1 font-sans text-sm text-brand-slate/70">Disponibles para canje</p>
        </div>
        {puntosPendientes > 0 && (
          <div className="rounded-lg bg-white p-5 text-center shadow-sm">
            <p className="font-display text-3xl text-brand-black">{puntosPendientes} pts</p>
            <p className="mt-1 font-sans text-sm text-brand-slate/70">Pendientes (todavía no disponibles)</p>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 text-center font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-md bg-green-50 px-4 py-2.5 text-center font-sans text-sm text-green-800">
          {success}
        </p>
      )}

      <div className="rounded-lg bg-white p-5 text-left shadow-sm">
        <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Catálogo de canje</h2>
        {catalogo.length === 0 ? (
          <p className="font-sans text-sm text-brand-slate/70">Todavía no hay artículos disponibles para canje.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalogo.map((item) => {
              const canRedeem = saldoDisponible >= item.costo_puntos && item.stock > 0;
              return (
                <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-brand-slate/10 p-4">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt=""
                      width={200}
                      height={200}
                      className="aspect-square w-full rounded-md object-cover"
                    />
                  ) : (
                    <ProductImagePlaceholder className="aspect-square w-full" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-sans text-sm font-medium text-brand-black">{item.nombre}</p>
                    <p className="font-display text-lg text-brand-orange">{item.costo_puntos} pts</p>
                    {item.stock <= 0 && (
                      <p className="font-sans text-xs text-brand-slate/60">Sin stock por ahora</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!canRedeem}
                    onClick={() => setConfirmTarget(item)}
                    className={buttonClassName("primary", "w-full")}
                  >
                    {canRedeem ? "Canjear" : "Puntos insuficientes"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {misCanjes.length > 0 && (
        <div className="rounded-lg bg-white p-5 text-left shadow-sm">
          <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Mis canjes</h2>
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[460px] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Artículo</th>
                  <th className="py-2">Puntos</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {misCanjes.map((row) => (
                  <tr key={row.id} className="border-b border-brand-slate/10 last:border-0">
                    <td className="py-2 text-brand-slate">{dateFormatter.format(new Date(row.created_at))}</td>
                    <td className="max-w-[200px] py-2 text-brand-black">{row.itemNombre}</td>
                    <td className="py-2 text-brand-black">-{row.puntos_usados}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${REDEMPTION_ESTADO_STYLE[row.estado]}`}
                      >
                        {CLUB57_REDEMPTION_ESTADO_LABEL[row.estado]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-white p-5 text-left shadow-sm">
        <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Historial de puntos</h2>
        {historial.length === 0 ? (
          <p className="font-sans text-sm text-brand-slate/70">Sin movimientos todavía.</p>
        ) : (
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[460px] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Puntos</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((row) => (
                  <tr key={row.id} className="border-b border-brand-slate/10 last:border-0">
                    <td className="py-2 text-brand-slate">{dateFormatter.format(new Date(row.created_at))}</td>
                    <td className="py-2 text-brand-black">{CLUB57_TIPO_LABEL[row.tipo] ?? row.tipo}</td>
                    <td className={`py-2 font-medium ${row.cantidad < 0 ? "text-red-700" : "text-brand-black"}`}>
                      {row.cantidad > 0 ? "+" : ""}
                      {row.cantidad}
                    </td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.estado === "disponible" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {row.estado === "disponible" ? "Disponible" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Canjear artículo"
        description={
          confirmTarget
            ? `¿Canjear "${confirmTarget.nombre}" por ${confirmTarget.costo_puntos} puntos? Se descuentan al momento — recoge el artículo en tienda.`
            : undefined
        }
        confirmLabel={isSubmitting ? "Canjeando…" : "Canjear"}
        onConfirm={handleConfirmRedeem}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
