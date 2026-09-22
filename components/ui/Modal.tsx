"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  titleId: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Ancho máximo del panel — por defecto suficiente para dos columnas en desktop. */
  maxWidthClassName?: string;
}

// Cascarón de modal compartido: overlay + panel centrado + botón de
// cerrar + Escape — extraído de Club57ItemQuickView para que el detalle
// de pedido (y cualquier otra vista de detalle futura) reutilice el mismo
// patrón en vez de reconstruirlo. El contenido interno (imagen, tabla,
// lo que sea) lo decide cada llamador.
export function Modal({ titleId, onClose, children, maxWidthClassName = "max-w-2xl" }: ModalProps) {
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
        className={`relative flex max-h-[90vh] w-full ${maxWidthClassName} flex-col overflow-y-auto rounded-lg bg-white p-5 shadow-lg sm:p-6`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-brand-black/60 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        >
          <X className="size-4" aria-hidden="true" strokeWidth={1.75} />
        </button>
        {children}
      </div>
    </div>
  );
}
