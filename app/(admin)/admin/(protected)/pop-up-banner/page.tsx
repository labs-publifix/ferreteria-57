import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PopUpBannersTable } from "@/components/admin/PopUpBannersTable";
import { buttonClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import type { PopupBanner } from "@/types/popup";

export const metadata: Metadata = { title: "Pop-Up Banner — Panel de administración" };

export default async function AdminPopUpBannerPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("popup_banners")
    .select("*")
    .order("starts_at", { ascending: false });

  const banners: PopupBanner[] = (data ?? []).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    titulo: row.titulo,
    texto: row.texto,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    tipoFondo: row.tipo_fondo,
    colorFondo: row.color_fondo,
    colorTexto: row.color_texto,
    colorBoton: row.color_boton,
    colorTextoBoton: row.color_texto_boton,
    imagenUrl: row.imagen_url,
    textoAlternativo: row.texto_alternativo,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Pop-Up Banner</h1>
          <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
            Tarjeta discreta en la esquina inferior izquierda del sitio — nunca un modal de pantalla
            completa. Solo un banner puede estar activo y vigente a la vez; si las fechas se traslapan con
            otro activo, se rechaza al guardar.
          </p>
        </div>
        <Link href="/admin/pop-up-banner/nuevo" className={buttonClassName("primary", "shrink-0")}>
          <Plus className="size-4" aria-hidden="true" strokeWidth={2} />
          Nuevo banner
        </Link>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudieron cargar los banners: {error.message}
        </p>
      ) : (
        <PopUpBannersTable banners={banners} />
      )}
    </div>
  );
}
