"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findOverlappingBanner } from "@/lib/popup/schedule";
import { mexicoCityInputValueToUtcIso } from "@/lib/popup/timezone";

export interface PopupBannerActionResult {
  error?: string;
}

// Mismo criterio que el resto del admin: cada Server Action confirma
// is_admin() por su cuenta (ver promo-banners/actions.ts, top-banner/actions.ts).
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return null;

  return supabase;
}

// Mismos máximos que el formulario ya impide superar al escribir
// (maxLength nativo) y que la base de datos vuelve a exigir como check
// constraint — tercera capa independiente, mismo criterio que
// promo-banners/actions.ts.
const MAX_LENGTHS = { nombre: 60, titulo: 35, texto: 100, ctaLabel: 20 } as const;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

function isValidCtaUrl(url: string): boolean {
  return url.startsWith("/") || url.startsWith("https://");
}

function parsePopupBannerForm(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const texto = String(formData.get("texto") ?? "").trim();
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();
  const ctaUrl = String(formData.get("ctaUrl") ?? "").trim();
  const tipoFondo = String(formData.get("tipoFondo") ?? "solido");
  const colorFondo = String(formData.get("colorFondo") ?? "");
  const colorTexto = String(formData.get("colorTexto") ?? "");
  const colorBoton = String(formData.get("colorBoton") ?? "");
  const colorTextoBoton = String(formData.get("colorTextoBoton") ?? "");
  const imagenUrl = String(formData.get("imagenUrl") ?? "").trim();
  const textoAlternativo = String(formData.get("textoAlternativo") ?? "").trim();
  const startsAtInput = String(formData.get("startsAt") ?? "").trim();
  const endsAtInput = String(formData.get("endsAt") ?? "").trim();
  const activo = formData.get("activo") === "on";

  if (!nombre) return { error: "Escribe un nombre interno para identificar el banner." } as const;
  if (nombre.length > MAX_LENGTHS.nombre) {
    return { error: `El nombre no puede pasar de ${MAX_LENGTHS.nombre} caracteres.` } as const;
  }
  if (!titulo) return { error: "Escribe un título." } as const;
  if (titulo.length > MAX_LENGTHS.titulo) {
    return { error: `El título no puede pasar de ${MAX_LENGTHS.titulo} caracteres.` } as const;
  }
  if (!texto) return { error: "Escribe el texto del banner." } as const;
  if (texto.length > MAX_LENGTHS.texto) {
    return { error: `El texto no puede pasar de ${MAX_LENGTHS.texto} caracteres.` } as const;
  }
  if (ctaLabel.length > MAX_LENGTHS.ctaLabel) {
    return { error: `La etiqueta del botón no puede pasar de ${MAX_LENGTHS.ctaLabel} caracteres.` } as const;
  }
  if (ctaUrl && !isValidCtaUrl(ctaUrl)) {
    return { error: "El enlace del botón debe ser una ruta interna (empieza con /) o una URL externa https://." } as const;
  }
  if (tipoFondo !== "solido" && tipoFondo !== "imagen") {
    return { error: "Elige un tipo de fondo válido." } as const;
  }
  if (tipoFondo === "imagen" && !imagenUrl) {
    return { error: "Sube una imagen o cambia el tipo de fondo a sólido." } as const;
  }
  if (imagenUrl && !textoAlternativo) {
    return { error: "Escribe el texto alternativo de la imagen." } as const;
  }
  for (const [label, value] of [
    ["fondo", colorFondo],
    ["texto", colorTexto],
    ["botón", colorBoton],
    ["texto del botón", colorTextoBoton],
  ] as const) {
    if (!HEX_COLOR_PATTERN.test(value)) {
      return { error: `El color de ${label} no es válido.` } as const;
    }
  }
  if (!startsAtInput) return { error: "Elige la fecha y hora de inicio." } as const;
  if (!endsAtInput) return { error: "Elige la fecha y hora de fin." } as const;

  let startsAt: string;
  let endsAt: string;
  try {
    startsAt = mexicoCityInputValueToUtcIso(startsAtInput);
    endsAt = mexicoCityInputValueToUtcIso(endsAtInput);
  } catch {
    return { error: "La fecha u hora no es válida." } as const;
  }
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return { error: "La fecha de fin debe ser posterior a la fecha de inicio." } as const;
  }

  return {
    nombre,
    titulo,
    texto,
    ctaLabel: ctaLabel || null,
    ctaUrl: ctaUrl || null,
    tipoFondo: tipoFondo as "solido" | "imagen",
    colorFondo,
    colorTexto,
    colorBoton,
    colorTextoBoton,
    imagenUrl: tipoFondo === "imagen" ? imagenUrl : null,
    textoAlternativo: tipoFondo === "imagen" ? textoAlternativo : null,
    startsAt,
    endsAt,
    activo,
  } as const;
}

// Traslape entre banners ACTIVOS: se rechaza al guardar (decisión
// confirmada con el cliente, ver el comentario extenso en
// lib/popup/schedule.ts sobre por qué esto es una validación a nivel
// APLICACIÓN y no una restricción de base de datos). Solo importa cuando
// el banner que se está guardando quedaría activo — uno guardado como
// inactivo nunca puede traslaparse con nada porque no se muestra.
async function checkOverlap(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>,
  candidate: { startsAt: string; endsAt: string },
  excludeId?: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("popup_banners")
    .select("id, nombre, starts_at, ends_at")
    .eq("activo", true);
  if (error) return `No se pudo validar traslapes: ${error.message}`;

  const existing = (data ?? []).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  }));
  const overlap = findOverlappingBanner(candidate, existing, excludeId);
  if (overlap) {
    return `Ya existe un banner activo en ese rango: "${overlap.nombre}". Ajusta las fechas o desactívalo primero.`;
  }
  return null;
}

export async function createPopupBanner(formData: FormData): Promise<PopupBannerActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const parsed = parsePopupBannerForm(formData);
  if ("error" in parsed) return parsed;

  if (parsed.activo) {
    const overlapError = await checkOverlap(supabase, parsed);
    if (overlapError) return { error: overlapError };
  }

  const { error } = await supabase.from("popup_banners").insert({
    nombre: parsed.nombre,
    titulo: parsed.titulo,
    texto: parsed.texto,
    cta_label: parsed.ctaLabel,
    cta_url: parsed.ctaUrl,
    tipo_fondo: parsed.tipoFondo,
    color_fondo: parsed.colorFondo,
    color_texto: parsed.colorTexto,
    color_boton: parsed.colorBoton,
    color_texto_boton: parsed.colorTextoBoton,
    imagen_url: parsed.imagenUrl,
    texto_alternativo: parsed.textoAlternativo,
    starts_at: parsed.startsAt,
    ends_at: parsed.endsAt,
    activo: parsed.activo,
  });
  if (error) return { error: `No se pudo crear el banner: ${error.message}` };

  // El widget se monta desde SiteChrome (todas las páginas públicas), no
  // desde una sola ruta — revalidar el layout raíz del sitio, mismo
  // criterio que top-banner/actions.ts usa para AnnouncementBar.
  revalidatePath("/", "layout");
  revalidatePath("/admin/pop-up-banner");
  // A diferencia de un <form action={...}>, aquí el formulario invoca esta
  // Server Action como una función normal (ver PopUpBannerForm.tsx) para
  // poder leer `result.error` en el mismo lugar. redirect() dentro de una
  // Server Action funciona lanzando una excepción especial que Next.js
  // reconoce del lado del cliente — pero si esa llamada directa alguna vez
  // lanza ANTES de llegar aquí (p. ej. un error de red real de
  // supabase-js), esa excepción real y la de redirect() son indistinguibles
  // para quien llama sin importar next/dist (ruta interna, no pública). Para
  // no depender de esa distinción, la redirección la hace el cliente
  // (router.push) una vez que ve `{}` de vuelta — así una falla real
  // siempre cae en el catch del formulario en vez de dejar el botón
  // "Guardando…" colgado para siempre sin aviso.
  return {};
}

export async function updatePopupBanner(
  id: string,
  formData: FormData
): Promise<PopupBannerActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const parsed = parsePopupBannerForm(formData);
  if ("error" in parsed) return parsed;

  if (parsed.activo) {
    const overlapError = await checkOverlap(supabase, parsed, id);
    if (overlapError) return { error: overlapError };
  }

  const { error } = await supabase
    .from("popup_banners")
    .update({
      nombre: parsed.nombre,
      titulo: parsed.titulo,
      texto: parsed.texto,
      cta_label: parsed.ctaLabel,
      cta_url: parsed.ctaUrl,
      tipo_fondo: parsed.tipoFondo,
      color_fondo: parsed.colorFondo,
      color_texto: parsed.colorTexto,
      color_boton: parsed.colorBoton,
      color_texto_boton: parsed.colorTextoBoton,
      imagen_url: parsed.imagenUrl,
      texto_alternativo: parsed.textoAlternativo,
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      activo: parsed.activo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: `No se pudo actualizar el banner: ${error.message}` };

  revalidatePath("/", "layout");
  revalidatePath("/admin/pop-up-banner");
  return {};
}

// "Retirar ahora" (botón dedicado en el editor) y el toggle del listado
// comparten esta acción — un solo UPDATE mínimo, sin volver a validar todo
// el formulario. Activar por esta vía SÍ revisa traslapes (misma regla que
// crear/editar); desactivar nunca los revisa (apagar un banner jamás puede
// chocar con otro).
export async function setPopupBannerActive(id: string, activo: boolean): Promise<PopupBannerActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  if (activo) {
    const { data, error: fetchError } = await supabase
      .from("popup_banners")
      .select("starts_at, ends_at")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) return { error: `No se pudo validar el banner: ${fetchError.message}` };
    if (!data) return { error: "Banner no encontrado." };

    const overlapError = await checkOverlap(supabase, { startsAt: data.starts_at, endsAt: data.ends_at }, id);
    if (overlapError) return { error: overlapError };
  }

  const { error } = await supabase
    .from("popup_banners")
    .update({ activo, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: `No se pudo actualizar el banner: ${error.message}` };

  revalidatePath("/", "layout");
  revalidatePath("/admin/pop-up-banner");
  return {};
}

// Duplicar (#7 del listado): nace SIEMPRE inactivo, sin importar el estado
// del original — nunca debe publicarse una copia sin que un admin la
// revise primero (nombre, fechas, y posible traslape con el propio
// original si sigue activo).
export async function duplicatePopupBanner(id: string): Promise<PopupBannerActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const { data, error: fetchError } = await supabase
    .from("popup_banners")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return { error: `No se pudo leer el banner: ${fetchError.message}` };
  if (!data) return { error: "Banner no encontrado." };

  const { error } = await supabase.from("popup_banners").insert({
    nombre: `Copia de ${data.nombre}`,
    titulo: data.titulo,
    texto: data.texto,
    cta_label: data.cta_label,
    cta_url: data.cta_url,
    tipo_fondo: data.tipo_fondo,
    color_fondo: data.color_fondo,
    color_texto: data.color_texto,
    color_boton: data.color_boton,
    color_texto_boton: data.color_texto_boton,
    imagen_url: data.imagen_url,
    texto_alternativo: data.texto_alternativo,
    starts_at: data.starts_at,
    ends_at: data.ends_at,
    activo: false,
  });
  if (error) return { error: `No se pudo duplicar el banner: ${error.message}` };

  revalidatePath("/admin/pop-up-banner");
  return {};
}

export async function deletePopupBanner(id: string): Promise<PopupBannerActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const { error } = await supabase.from("popup_banners").delete().eq("id", id);
  if (error) return { error: `No se pudo eliminar el banner: ${error.message}` };

  revalidatePath("/", "layout");
  revalidatePath("/admin/pop-up-banner");
  return {};
}
