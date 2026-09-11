import type { Metadata } from "next";
import { TopBannerForm } from "@/components/admin/TopBannerForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Top Banner — Panel de administración" };

export default async function AdminTopBannerPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("top_banner_config").select("*").maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Top Banner</h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
          Franja de aviso arriba de todo el sitio. Si le pones fechas de vigencia, esas fechas deciden
          solas si se muestra — el interruptor de activo/inactivo solo aplica cuando no hay ninguna
          fecha configurada.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudo cargar la configuración: {error.message}
        </p>
      ) : (
        <TopBannerForm
          initialValues={{
            message: data?.message ?? "",
            colorTheme: data?.color_theme ?? "pizarra",
            href: data?.href ?? "",
            startsAt: data?.starts_at ?? "",
            endsAt: data?.ends_at ?? "",
            active: data?.active ?? true,
          }}
        />
      )}
    </div>
  );
}
