"use client";

import { useEffect, useId, useRef } from "react";
import { buttonClassName } from "./buttonStyles";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" para acciones destructivas (eliminar) — botón de confirmar en rojo. */
  tone?: "danger" | "neutral";
  onConfirm: () => void;
  onCancel: () => void;
}

// Reemplaza window.confirm (modal nativo del sistema, sin look & feel de
// la plataforma) en cualquier acción del admin que necesite confirmación
// antes de algo irreversible — hoy "Eliminar categoría", pensado para
// reutilizarse en cualquier otra confirmación futura.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  tone = "neutral",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Foco en "Cancelar" al abrir (no en "Aceptar"): para una confirmación
  // destructiva, un Enter accidental no debe borrar nada. Escape cierra
  // igual que el clic en el fondo — ambos cuentan como cancelar.
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={cancelLabel}
        className="absolute inset-0 bg-brand-black/50"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-lg bg-brand-white p-5 shadow-lg sm:p-6"
      >
        <div>
          <h2 id={titleId} className="font-display text-base uppercase text-brand-slate">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-2 font-sans text-sm text-brand-black">
              {description}
            </p>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={buttonClassName("secondary", "w-full sm:w-auto")}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              tone === "danger"
                ? "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-red-700 px-5 font-sans text-sm font-semibold text-white transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 sm:w-auto"
                : buttonClassName("primary", "w-full sm:w-auto")
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
