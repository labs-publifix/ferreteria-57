import { createClient } from "@/lib/supabase/server";
import type { PublicPopupBanner } from "@/types/popup";

// Lee de la VISTA pública (popup_banners_public), nunca de la tabla base
// popup_banners — la tabla base le niega SELECT a todo lo que no sea admin
// (ver la migración), así que esta consulta con la sesión normal del sitio
// solo puede ver lo que la vista ya filtró y proyectó. La vista garantiza
// como mucho una fila (activo + dentro de ventana, "limit 1"), de ahí
// maybeSingle() en vez de un array.
export async function getVisiblePopupBanner(): Promise<PublicPopupBanner | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("popup_banners_public").select("*").maybeSingle();

  if (error) {
    console.error("[popup] getVisiblePopupBanner:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    titulo: data.titulo,
    texto: data.texto,
    ctaLabel: data.cta_label,
    ctaUrl: data.cta_url,
    tipoFondo: data.tipo_fondo,
    colorFondo: data.color_fondo,
    colorTexto: data.color_texto,
    colorBoton: data.color_boton,
    colorTextoBoton: data.color_texto_boton,
    imagenUrl: data.imagen_url,
    textoAlternativo: data.texto_alternativo,
    updatedAt: data.updated_at,
  };
}
