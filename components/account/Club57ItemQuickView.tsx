"use client";

import { useId } from "react";
import { buttonClassName, Modal } from "@/components/ui";
import { ProductGallery } from "@/components/product/ProductGallery";

export interface Club57QuickViewItem {
  id: string;
  nombre: string;
  descripcion: string;
  costo_puntos: number;
  stock: number;
  image_url: string | null;
}

const pesosFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

// Reutiliza el mismo ProductGallery de la ficha de producto (lupa en
// desktop, lightbox en móvil) — pedido explícito de no construir un
// componente de zoom aparte. Un solo artículo del catálogo de canje solo
// tiene una imagen, así que se le pasa como arreglo de un elemento; la fila
// de miniaturas de ProductGallery ya se oculta sola con un solo elemento.
export function Club57ItemQuickView({
  item,
  montoPorPunto,
  saldoDisponible,
  onRequestRedeem,
  onClose,
}: {
  item: Club57QuickViewItem;
  montoPorPunto: number;
  saldoDisponible: number;
  onRequestRedeem: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const canRedeem = saldoDisponible >= item.costo_puntos && item.stock > 0;
  const faltante = Math.max(0, item.costo_puntos - saldoDisponible);
  const progresoPct = Math.min(100, Math.round((saldoDisponible / item.costo_puntos) * 100));

  return (
    <Modal titleId={titleId} onClose={onClose}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ProductGallery images={item.image_url ? [item.image_url] : []} productName={item.nombre} />

        <div className="flex flex-col gap-3 text-left">
          <h2 id={titleId} className="font-display text-lg uppercase text-brand-slate">
            {item.nombre}
          </h2>
          {item.descripcion && (
            <p className="font-sans text-sm text-brand-black">{item.descripcion}</p>
          )}
          <p className="font-display text-2xl text-brand-orange">{item.costo_puntos} pts</p>

          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-gray">
            <div
              className="h-full rounded-full bg-brand-orange transition-all"
              style={{ width: `${progresoPct}%` }}
            />
          </div>

          {canRedeem ? (
            <p className="font-sans text-sm text-green-700">Ya puedes canjear este artículo.</p>
          ) : item.stock <= 0 ? (
            <p className="font-sans text-sm text-brand-slate/70">Sin stock por ahora.</p>
          ) : (
            <p className="font-sans text-sm text-brand-slate/70">
              Te faltan {faltante} pts
              <span className="block text-xs text-brand-slate/60">
                aprox. {pesosFormatter.format(faltante * montoPorPunto)} en compras
              </span>
            </p>
          )}

          <button
            type="button"
            disabled={!canRedeem}
            onClick={onRequestRedeem}
            className={buttonClassName("primary", "w-full")}
          >
            {canRedeem ? "Canjear" : "Puntos insuficientes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
