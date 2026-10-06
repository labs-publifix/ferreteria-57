import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";
import { PROMO_TIPOS } from "@/lib/club57/promociones/config";
import { loadPromocionesAdmin, publicadasDe } from "@/lib/club57/promociones/adminQueries";
import {
  PROMO_ESTADO_BADGE_CLASS,
  formatRangoLegible,
  resumenPorTipo,
} from "@/lib/club57/promociones/vigencia";
import { PROMO_TIPO_ICON } from "@/components/club57/promoTipoIcons";

export const metadata: Metadata = { title: "Promociones Club 57 — Panel de administración" };

export default async function AdminPromocionesPage() {
  const supabase = await createClient();
  const hoy = todayInStoreTimezone();
  const { rows, error } = await loadPromocionesAdmin(supabase);
  const publicadas = publicadasDe(rows);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/lealtad" className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black">
          ← Club 57
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">Promociones</h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate">
          PDFs que los miembros descargan desde su cuenta. Solo puede haber una promoción vigente a la vez por tipo;
          puedes dejar varias programadas a futuro.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudieron cargar las promociones: {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PROMO_TIPOS.map((info) => {
          const Icon = PROMO_TIPO_ICON[info.tipo];

          if (!info.habilitado) {
            return (
              <div
                key={info.tipo}
                aria-disabled="true"
                className="flex flex-col gap-3 rounded-lg border border-dashed border-brand-slate/30 bg-white/60 p-5"
              >
                <Icon className="size-6 text-brand-slate" aria-hidden="true" strokeWidth={1.75} />
                <p className="font-display text-base uppercase text-brand-slate">{info.label}</p>
                <span className="inline-flex self-start rounded-full bg-brand-gray px-2.5 py-1 font-sans text-xs font-semibold text-brand-slate">
                  Disponible en la siguiente fase
                </span>
              </div>
            );
          }

          const { vigente, proxima } = resumenPorTipo(publicadas, info.tipo, hoy);
          return (
            <Link
              key={info.tipo}
              href={`/admin/lealtad/promociones/${info.slug}`}
              className="group flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm transition-colors hover:bg-brand-gray/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            >
              <div className="flex items-center justify-between">
                <Icon className="size-6 text-brand-orange" aria-hidden="true" strokeWidth={1.75} />
                <ChevronRight className="size-5 text-brand-slate transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
              <p className="font-display text-base uppercase text-brand-slate">{info.label}</p>

              {vigente ? (
                <div className="flex flex-col gap-1.5">
                  <span className={`inline-flex self-start rounded-full px-2.5 py-1 text-xs font-semibold ${PROMO_ESTADO_BADGE_CLASS.vigente}`}>
                    Vigente
                  </span>
                  <p className="font-sans text-sm text-brand-black">{formatRangoLegible(vigente)}</p>
                  <p className="font-sans text-sm text-brand-slate">
                    <span className="font-semibold text-brand-black">{vigente.descargasUnicas}</span>{" "}
                    {vigente.descargasUnicas === 1 ? "descarga única" : "descargas únicas"}
                  </p>
                  {proxima && (
                    <p className="font-sans text-xs text-brand-slate">Siguiente: {formatRangoLegible(proxima)}</p>
                  )}
                </div>
              ) : proxima ? (
                <div className="flex flex-col gap-1.5">
                  <span className={`inline-flex self-start rounded-full px-2.5 py-1 text-xs font-semibold ${PROMO_ESTADO_BADGE_CLASS.programada}`}>
                    Próxima programada
                  </span>
                  <p className="font-sans text-sm text-brand-black">{formatRangoLegible(proxima)}</p>
                </div>
              ) : (
                <span className={`inline-flex self-start rounded-full px-2.5 py-1 text-xs font-semibold ${PROMO_ESTADO_BADGE_CLASS.vencida}`}>
                  Sin vigencia
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
