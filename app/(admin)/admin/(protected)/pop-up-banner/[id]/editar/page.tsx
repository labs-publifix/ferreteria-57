import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PopUpBannerForm } from "@/components/admin/PopUpBannerForm";
import { utcIsoToMexicoCityInputValue } from "@/lib/popup/timezone";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar banner — Panel de administración" };

export default async function EditarPopUpBannerPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data } = await supabase.from("popup_banners").select("*").eq("id", params.id).maybeSingle();
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Editar banner</h1>
      <PopUpBannerForm
        mode="edit"
        bannerId={data.id}
        initialActivo={data.activo}
        initialValues={{
          nombre: data.nombre,
          titulo: data.titulo,
          texto: data.texto,
          ctaLabel: data.cta_label ?? "",
          ctaUrl: data.cta_url ?? "",
          tipoFondo: data.tipo_fondo,
          colorFondo: data.color_fondo,
          colorTexto: data.color_texto,
          colorBoton: data.color_boton,
          colorTextoBoton: data.color_texto_boton,
          imagenUrl: data.imagen_url,
          textoAlternativo: data.texto_alternativo ?? "",
          startsAtInput: utcIsoToMexicoCityInputValue(data.starts_at),
          endsAtInput: utcIsoToMexicoCityInputValue(data.ends_at),
          activo: data.activo,
        }}
      />
    </div>
  );
}
