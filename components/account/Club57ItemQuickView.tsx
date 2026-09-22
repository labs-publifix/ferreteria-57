"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import { buttonClassName } from "@/components/ui";
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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-brand-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-lg bg-white p-5 shadow-lg sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-brand-black/60 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        >
          <X className="size-4" aria-hidden="true" strokeWidth={1.75} />
        </button>

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
      </div>
    </div>
  );
}
