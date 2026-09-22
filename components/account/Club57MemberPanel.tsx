"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClassName, ConfirmDialog, ProductImagePlaceholder } from "@/components/ui";
import { requestClub57Redemption } from "@/app/(site)/cuenta/actions";
import { CLUB57_REDEMPTION_ESTADO_LABEL, CLUB57_TIPO_LABEL } from "@/lib/club57/labels";
import { ORDER_STATUS_BADGE_CLASS, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/orders/status";
import { Club57ItemQuickView } from "@/components/account/Club57ItemQuickView";

export interface Club57LedgerRow {
  id: string;
  cantidad: number;
  tipo: string;
  estado: "pendiente" | "disponible";
  fecha_disponible?: string | null;
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

export interface Club57OrderRow {
  id: string;
  order_number: string;
  created_at: string;
  total: number;
  status: OrderStatus;
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });
const pesosFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});
const totalFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const REDEMPTION_ESTADO_STYLE: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-700",
};

// Encabezado de sección compartido — el mismo tratamiento visual (título +
// tarjeta con sombra) en las cinco secciones del panel, para que la
// separación entre ellas se lea de un vistazo.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-5 text-left shadow-sm">
      <h2 className="mb-3 font-display text-base uppercase text-brand-slate">{title}</h2>
      {children}
    </section>
  );
}

export function Club57MemberPanel({
  saldoDisponible,
  puntosPendientes,
  proximaFechaDisponible,
  montoPorPunto,
  historial,
  catalogo,
  misCanjes,
  pedidos,
}: {
  saldoDisponible: number;
  puntosPendientes: number;
  proximaFechaDisponible: string | null;
  montoPorPunto: number;
  historial: Club57LedgerRow[];
  catalogo: Club57CatalogItem[];
  misCanjes: Club57RedemptionRow[];
  pedidos: Club57OrderRow[];
}) {
  const router = useRouter();
  const [confirmTarget, setConfirmTarget] = useState<Club57CatalogItem | null>(null);
  const [quickViewItem, setQuickViewItem] = useState<Club57CatalogItem | null>(null);
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
      <Section title="Tus puntos">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="font-display text-4xl text-brand-black">{saldoDisponible} pts</p>
          <p className="font-sans text-sm text-brand-slate/70">Disponibles para canje</p>
          {puntosPendientes > 0 && (
            <p className="mt-2 font-sans text-sm text-brand-slate">
              {puntosPendientes} pendientes
              {proximaFechaDisponible && (
                <> · disponibles el {dateFormatter.format(new Date(`${proximaFechaDisponible}T00:00:00`))}</>
              )}
            </p>
          )}
        </div>
      </Section>

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

      <Section title="Catálogo de canje">
        {catalogo.length === 0 ? (
          <p className="font-sans text-sm text-brand-slate/70">Todavía no hay artículos disponibles para canje.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalogo.map((item) => {
              const canRedeem = saldoDisponible >= item.costo_puntos && item.stock > 0;
              const faltante = Math.max(0, item.costo_puntos - saldoDisponible);
              const progresoPct = Math.min(100, Math.round((saldoDisponible / item.costo_puntos) * 100));
              return (
                <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-brand-slate/10 p-4">
                  <button
                    type="button"
                    onClick={() => setQuickViewItem(item)}
                    className="flex flex-col gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                  >
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
                    </div>
                  </button>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-gray">
                    <div
                      className="h-full rounded-full bg-brand-orange transition-all"
                      style={{ width: `${progresoPct}%` }}
                    />
                  </div>

                  {!canRedeem && (
                    <p className="font-sans text-xs text-brand-slate/60">
                      {item.stock <= 0 ? (
                        "Sin stock por ahora"
                      ) : (
                        <>
                          Te faltan {faltante} pts
                          <span className="block">aprox. {pesosFormatter.format(faltante * montoPorPunto)} en compras</span>
                        </>
                      )}
                    </p>
                  )}

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
      </Section>

      {misCanjes.length > 0 && (
        <Section title="Mis canjes">
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
        </Section>
      )}

      <Section title="Historial de pedidos">
        {pedidos.length === 0 ? (
          <p className="font-sans text-sm text-brand-slate/70">Aún no tienes pedidos.</p>
        ) : (
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[460px] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Folio</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido) => (
                  <tr key={pedido.id} className="border-b border-brand-slate/10 last:border-0">
                    <td className="py-2 text-brand-slate">{dateFormatter.format(new Date(pedido.created_at))}</td>
                    <td className="py-2 text-brand-black">{pedido.order_number}</td>
                    <td className="py-2 text-brand-black">{totalFormatter.format(pedido.total)}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS_BADGE_CLASS[pedido.status]}`}
                      >
                        {ORDER_STATUS_LABEL[pedido.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Historial de puntos">
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
      </Section>

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

      {quickViewItem && (
        <Club57ItemQuickView
          item={quickViewItem}
          montoPorPunto={montoPorPunto}
          saldoDisponible={saldoDisponible}
          onRequestRedeem={() => {
            setConfirmTarget(quickViewItem);
            setQuickViewItem(null);
          }}
          onClose={() => setQuickViewItem(null)}
        />
      )}
    </div>
  );
}
