import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PromoBannersTable } from "@/components/admin/PromoBannersTable";
import { buttonClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import type { PromoBanner } from "@/types/marketing";

export const metadata: Metadata = { title: "Promo Banners — Panel de administración" };

export default async function AdminPromoBannersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promo_banners")
    .select("*")
    .order("position", { ascending: true });

  const promoBanners: PromoBanner[] = (data ?? []).map((row) => ({
    id: row.id,
    eyebrow: row.eyebrow,
    title: row.title,
    subtitle: row.subtitle,
    fineprint: row.fineprint,
    href: row.href,
    colorTheme: row.color_theme,
    imageUrl: row.image_url,
    position: row.position,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    active: row.active,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">
            Promo Banners
          </h1>
          <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
            Tarjetas del riel de promociones del Home, ordenadas por posición. Una tarjeta sin fecha de
            fin es permanente; con fechas, la vigencia manda sobre el interruptor de activa/inactiva.
          </p>
        </div>
        <Link href="/admin/promo-banners/nueva" className={buttonClassName("primary", "shrink-0")}>
          <Plus className="size-4" aria-hidden="true" strokeWidth={2} />
          Nueva tarjeta
        </Link>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudieron cargar las tarjetas: {error.message}
        </p>
      ) : (
        <PromoBannersTable promoBanners={promoBanners} />
      )}
    </div>
  );
}
