import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PromoWizard, type PromoWizardDraft } from "@/components/admin/promociones/PromoWizard";
import { createClient } from "@/lib/supabase/server";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";
import { promoTipoFromSlug } from "@/lib/club57/promociones/config";
import { loadPromocionesAdmin, publicadasDe } from "@/lib/club57/promociones/adminQueries";
import { isAvisosEnabled } from "@/lib/club57/avisos/config";

export const metadata: Metadata = { title: "Nueva promoción Club 57 — Panel de administración" };

export default async function AdminNuevaPromocionPage({
  params,
  searchParams,
}: {
  params: { tipo: string };
  searchParams: { borrador?: string };
}) {
  const info = promoTipoFromSlug(params.tipo);
  if (!info || !info.habilitado) notFound();

  const supabase = await createClient();
  const hoy = todayInStoreTimezone();
  const { rows } = await loadPromocionesAdmin(supabase, info.tipo);

  // "Continuar" un borrador desde el listado: retoma en el paso de Vigencia.
  let initialDraft: PromoWizardDraft | null = null;
  if (searchParams.borrador) {
    const { data } = await supabase
      .from("club57_promociones")
      .select(
        "id, titulo, archivo_nombre_original, archivo_bytes, archivo_sha256, vigencia_inicio, vigencia_fin, fuente_excel_nombre, fuente_productos"
      )
      .eq("id", searchParams.borrador)
      .eq("tipo", info.tipo)
      .eq("estado", "borrador")
      .maybeSingle();
    if (data) {
      initialDraft = {
        id: data.id,
        titulo: data.titulo,
        nombre: data.archivo_nombre_original,
        bytes: Number(data.archivo_bytes),
        sha256: data.archivo_sha256,
        inicio: data.vigencia_inicio,
        fin: data.vigencia_fin,
        fuente: data.fuente_excel_nombre
          ? { nombre: data.fuente_excel_nombre, productos: Number(data.fuente_productos ?? 0) }
          : undefined,
      };
    }
  }

  const listHref = `/admin/lealtad/promociones/${info.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={listHref} className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black">
          ← {info.label}
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">Nueva promoción</h1>
        <p className="mt-1 font-sans text-sm text-brand-slate">{info.label}</p>
      </div>

      <PromoWizard
        tipo={info.tipo}
        formato={info.formato}
        tipoLabel={info.label}
        listHref={listHref}
        hoy={hoy}
        publicadas={publicadasDe(rows)}
        initialDraft={initialDraft}
        avisosHabilitado={isAvisosEnabled()}
      />
    </div>
  );
}
