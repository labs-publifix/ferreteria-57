"use client";

import { useEffect, useRef, useState } from "react";
import { PopupBannerCardContent } from "./PopupBannerCard";
import type { PublicPopupBanner } from "@/types/popup";

const APPEAR_DELAY_MS = 4000;
const DISMISS_HOURS = 24;
const DISMISS_STORAGE_KEY = "ferreteria57:popupDismissed";

interface DismissRecord {
  id: string;
  updatedAt: string;
  dismissedAt: string;
}

// try/catch en cada acceso (mismo criterio que CartProvider.tsx): modo
// privado, cuota llena o localStorage inaccesible nunca debe romper la
// página — en el peor caso, el banner simplemente vuelve a aparecer más
// seguido de lo ideal, nunca deja de funcionar el resto del sitio.
function readDismissRecord(): DismissRecord | null {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DismissRecord;
  } catch {
    return null;
  }
}

function writeDismissRecord(record: DismissRecord) {
  try {
    localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Sin espacio o sin acceso: no hay nada que hacer, el cierre visual ya
    // ocurrió de todas formas (ver handleClose).
  }
}

// z-40, esquina inferior IZQUIERDA — mismo nivel que WhatsAppButton
// (esquina derecha, ver ese archivo), nunca se traslapan entre sí. Ancho
// acotado a lo menor entre 85% del viewport y 320px, alto acotado a 25vh
// (ver max-h-[25vh] en PopupBannerCard) — pedido explícito del cliente de
// que esto NUNCA se sienta como un modal.
export function PopupBannerWidget({ banner }: { banner: PublicPopupBanner }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const record = readDismissRecord();
    // La clave de descarte es id + updatedAt del banner: si el equipo edita
    // el banner (o publica uno distinto) después de que alguien lo cerró,
    // updatedAt/id cambian y el descarte guardado ya no aplica — vuelve a
    // mostrarse aunque no hayan pasado las 24h.
    if (record && record.id === banner.id && record.updatedAt === banner.updatedAt) {
      const elapsedMs = Date.now() - new Date(record.dismissedAt).getTime();
      if (elapsedMs < DISMISS_HOURS * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    const timer = setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    return () => clearTimeout(timer);
  }, [banner.id, banner.updatedAt]);

  function handleClose() {
    setVisible(false);
    writeDismissRecord({ id: banner.id, updatedAt: banner.updatedAt, dismissedAt: new Date().toISOString() });
  }

  // Escape cierra SOLO si el foco está dentro de la tarjeta — nunca captura
  // Escape globalmente (no es un modal, no debe interceptar nada fuera de
  // sí mismo).
  useEffect(() => {
    if (!visible) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && containerRef.current?.contains(document.activeElement)) {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (dismissed) return null;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Promoción"
      aria-hidden={!visible}
      className={`fixed bottom-6 left-4 z-40 w-[85vw] max-w-[320px] transition-all duration-500 ease-out motion-reduce:transition-none sm:left-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <PopupBannerCardContent banner={banner} onClose={handleClose} interactive={visible} />
    </div>
  );
}
