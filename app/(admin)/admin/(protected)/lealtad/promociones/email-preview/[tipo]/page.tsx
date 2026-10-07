import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayInStoreTimezone, addDaysInStoreTimezone } from "@/lib/marketing/visibility";
import { PROMO_TIPOS, promoTipoFromSlug } from "@/lib/club57/promociones/config";
import { loadPromocionesAdmin, publicadasDe } from "@/lib/club57/promociones/adminQueries";
import { resumenPorTipo } from "@/lib/club57/promociones/vigencia";
import { getAvisosBaseUrl } from "@/lib/club57/avisos/config";
import { buildAvisoEmail } from "@/lib/club57/avisos/plantillas";
import { EmailPreviewFrame } from "@/components/admin/promociones/EmailPreviewFrame";

export const metadata: Metadata = { title: "Vista previa del aviso — Panel de administración" };

// Vista previa del correo de aviso con datos de muestra (no envía nada).
// Usa la promoción vigente o próxima del tipo si existe; si no, un rango
// de ejemplo.
export default async function EmailPreviewPage({ params }: { params: { tipo: string } }) {
  const info = promoTipoFromSlug(params.tipo);
  if (!info) notFound();

  const hoy = todayInStoreTimezone();
  const supabase = await createClient();
  const { rows } = await loadPromocionesAdmin(supabase, info.tipo);
  const { vigente, proxima } = resumenPorTipo(publicadasDe(rows), info.tipo, hoy);
  const rango = vigente ?? proxima ?? { inicio: hoy, fin: addDaysInStoreTimezone(20, hoy) };
  const baseUrl = getAvisosBaseUrl();

  const conNombre = buildAvisoEmail({
    tipo: info.tipo,
    nombre: "María López",
    puntos: 1250,
    rango,
    hoy,
    baseUrl,
    bajaUrl: `${baseUrl}/club57/baja?m=muestra&t=muestra`,
  });
  const sinNombre = buildAvisoEmail({
    tipo: info.tipo,
    nombre: null,
    puntos: null,
    rango,
    hoy,
    baseUrl,
    bajaUrl: `${baseUrl}/club57/baja?m=muestra&t=muestra`,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/admin/lealtad/promociones/${info.slug}`}
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← {info.label}
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">Vista previa del aviso</h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate">
          Así se ve el correo que reciben los miembros. Datos de muestra; no se envía nada desde esta página.
        </p>
        <nav aria-label="Tipo de promoción" className="mt-3 flex flex-wrap gap-2">
          {PROMO_TIPOS.map((t) => (
            <Link
              key={t.tipo}
              href={`/admin/lealtad/promociones/email-preview/${t.slug}`}
              aria-current={t.tipo === info.tipo ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 font-sans text-sm font-semibold ${
                t.tipo === info.tipo ? "bg-brand-slate text-white" : "bg-white text-brand-slate hover:bg-brand-gray"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      <EmailPreviewFrame
        variantes={[
          { id: "con-nombre", label: "Con nombre y puntos", ...conNombre },
          { id: "sin-nombre", label: "Sin nombre ni puntos", ...sinNombre },
        ]}
      />
    </div>
  );
}
