"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Badge, buttonClassName, useToast } from "@/components/ui";
import { PROMO_TIPO_ICON } from "@/components/club57/promoTipoIcons";
import { filenameFromContentDisposition } from "@/lib/club57/promociones/archivo";
import {
  formatFechaCorta,
  formatFechaLarga,
  type MemberPromoCard,
} from "@/lib/club57/promociones/vigencia";

const disabledButtonClass =
  "inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-lg border border-dashed border-brand-slate/30 bg-brand-gray px-4 text-center font-sans text-sm font-semibold text-brand-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2";

function disabledLabel(card: MemberPromoCard, hoy: string): string {
  switch (card.state.estado) {
    case "programada":
      return `Disponible a partir del ${formatFechaCorta(card.state.vigenciaInicio, hoy)}`;
    case "finalizada":
      return "Promoción finalizada";
    default:
      return "Próximamente";
  }
}

function statusText(card: MemberPromoCard): string {
  switch (card.state.estado) {
    case "vigente":
      return `Vigente hasta el ${formatFechaLarga(card.state.vigenciaFin)}`;
    case "programada":
      return "Nueva promoción en camino.";
    case "finalizada":
      return "Espera la siguiente edición.";
    default:
      return "Muy pronto, solo para miembros.";
  }
}

// Reemplaza los botones "Próximamente" de Club 57. El estado de cada
// tarjeta llega calculado del servidor (America/Mexico_City); el botón
// deshabilitado es solo cortesía — la vigencia real la decide el endpoint
// de descarga en cada clic (410 si venció con la página abierta).
export function Club57PromoCards({ cards, hoy }: { cards: MemberPromoCard[]; hoy: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(promocionId: string, label: string) {
    if (downloadingId) return;
    setDownloadingId(promocionId);
    try {
      const response = await fetch(`/api/club57/promociones/${promocionId}/descargar`, { cache: "no-store" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        if (response.status === 410) {
          showToast({ message: body?.error ?? "Esta promoción ya no está vigente" });
          router.refresh();
          return;
        }
        if (response.status === 401) {
          showToast({ message: "Tu sesión expiró — vuelve a iniciar sesión." });
          router.refresh();
          return;
        }
        showToast({ message: body?.error ?? "No se pudo descargar la promoción. Intenta de nuevo." });
        return;
      }

      const blob = await response.blob();
      const filename = filenameFromContentDisposition(response.headers.get("content-disposition")) ?? `${label}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      showToast({ message: "No se pudo descargar. Revisa tu conexión e intenta de nuevo." });
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <section aria-labelledby="club57-promos-title" className="flex flex-col gap-3">
      <h2 id="club57-promos-title" className="text-left font-display text-xs uppercase tracking-wide text-brand-slate">
        Promociones para miembros
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = PROMO_TIPO_ICON[card.tipo];
          const vigente = card.state.estado === "vigente" ? card.state : null;
          const isDownloading = vigente !== null && downloadingId === vigente.promocionId;

          return (
            <article
              key={card.tipo}
              className={`flex flex-col gap-3 rounded-lg bg-white p-4 text-left shadow-sm ${
                vigente ? "ring-1 ring-brand-orange/50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-md ${
                    vigente ? "bg-brand-orange/10 text-brand-orange" : "bg-brand-gray text-brand-slate"
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" strokeWidth={1.75} />
                </span>
                {vigente?.mostrarUltimosDias && (
                  <Badge>{vigente.diasRestantes === 1 ? "Último día" : `Últimos ${vigente.diasRestantes} días`}</Badge>
                )}
              </div>

              <div>
                <h3 className="font-display text-sm uppercase tracking-wide text-brand-black">{card.label}</h3>
                <p className="mt-1 font-sans text-sm text-brand-slate">{statusText(card)}</p>
              </div>

              <div className="mt-auto">
                {vigente ? (
                  <button
                    type="button"
                    onClick={() => handleDownload(vigente.promocionId, card.label)}
                    aria-busy={isDownloading}
                    className={buttonClassName("primary", "w-full text-sm")}
                  >
                    {isDownloading ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Download className="size-4" aria-hidden="true" strokeWidth={2} />
                    )}
                    {isDownloading ? "Descargando…" : "Descargar PDF"}
                  </button>
                ) : (
                  <button type="button" aria-disabled="true" className={disabledButtonClass}>
                    {disabledLabel(card, hoy)}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
