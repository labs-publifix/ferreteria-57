import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { buttonClassName } from "@/components/ui";
import { PromocionesList } from "@/components/admin/promociones/PromocionesList";
import { createClient } from "@/lib/supabase/server";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";
import { promoTipoFromSlug } from "@/lib/club57/promociones/config";
import { loadPromocionesAdmin, publicadasDe } from "@/lib/club57/promociones/adminQueries";
import { promoEstadoParaChip } from "@/lib/club57/promociones/vigencia";

export const metadata: Metadata = { title: "Promociones Club 57 — Panel de administración" };

// Lo que el equipo necesita ver primero: lo vigente, luego lo que viene,
// luego lo pendiente de terminar, y al final el historial.
const ORDER = { vigente: 0, programada: 1, borrador: 2, vencida: 3, archivada: 4 } as const;

export default async function AdminPromocionesTipoPage({ params }: { params: { tipo: string } }) {
  const info = promoTipoFromSlug(params.tipo);
  if (!info || !info.habilitado) notFound();

  const supabase = await createClient();
  const hoy = todayInStoreTimezone();
  const { rows, error } = await loadPromocionesAdmin(supabase, info.tipo);

  const sorted = [...rows].sort((a, b) => {
    const chipA = promoEstadoParaChip(a.estado, { inicio: a.inicio ?? undefined, fin: a.fin ?? undefined }, hoy);
    const chipB = promoEstadoParaChip(b.estado, { inicio: b.inicio ?? undefined, fin: b.fin ?? undefined }, hoy);
    if (ORDER[chipA] !== ORDER[chipB]) return ORDER[chipA] - ORDER[chipB];
    if (chipA === "programada") return (a.inicio ?? "") < (b.inicio ?? "") ? -1 : 1;
    return 0;
  });
  const nuevaHref = `/admin/lealtad/promociones/${info.slug}/nueva`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/admin/lealtad/promociones"
            className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
          >
            ← Promociones
          </Link>
          <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">{info.label}</h1>
        </div>
        <Link href={nuevaHref} className={buttonClassName("primary", "w-full shrink-0 sm:w-auto")}>
          <Plus className="size-4" aria-hidden="true" strokeWidth={2} />
          Nueva promoción
        </Link>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudieron cargar las promociones: {error}
        </p>
      ) : (
        <PromocionesList rows={sorted} hoy={hoy} publicadas={publicadasDe(rows)} nuevaHref={nuevaHref} />
      )}
    </div>
  );
}
