"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { createContext, useContext, useRef, useState } from "react";

interface ToastOptions {
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

interface Toast extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// 3s: dentro del rango de 2-3s pedido, y coincide con el mínimo de la
// guía de ui-ux-pro-max para toasts ("auto-dismiss after 3-5 seconds").
// Un solo toast a la vez (no una pila): esta app solo dispara uno por
// evento de "agregar al carrito", mostrar varios apilados no aporta nada
// y complica el layout — un nuevo toast simplemente reemplaza al anterior
// y reinicia el temporizador.
const DISMISS_MS = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextIdRef = useRef(0);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function scheduleDismiss() {
    clearTimer();
    timerRef.current = setTimeout(() => setToast(null), DISMISS_MS);
  }

  function showToast(options: ToastOptions) {
    nextIdRef.current += 1;
    setToast({ ...options, id: nextIdRef.current });
    scheduleDismiss();
  }

  function dismiss() {
    clearTimer();
    setToast(null);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          // Pausa el auto-cierre si el mouse está encima (p. ej. yendo
          // hacia "Ver carrito"): que no se cierre justo cuando el usuario
          // intenta darle clic. En touch no aplica (sin hover), mismo
          // criterio que la investigación de Baymard: 3s + cierre manual
          // ya cubre ese caso sin necesitar lógica extra de touch.
          onMouseEnter={clearTimer}
          onMouseLeave={scheduleDismiss}
          className="fixed inset-x-4 bottom-6 z-[60] mx-auto flex max-w-sm items-center gap-3 rounded-lg bg-brand-black px-4 py-3 text-white shadow-lg sm:inset-x-auto sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
        >
          <p className="flex-1 font-sans text-sm">{toast.message}</p>
          {toast.actionHref && toast.actionLabel && (
            <Link
              href={toast.actionHref}
              onClick={dismiss}
              className="shrink-0 font-sans text-sm font-semibold text-brand-orange underline underline-offset-2 hover:text-white"
            >
              {toast.actionLabel}
            </Link>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar notificación"
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="size-4" aria-hidden="true" strokeWidth={1.75} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>");
  }
  return ctx;
}
