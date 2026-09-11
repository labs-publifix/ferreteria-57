"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PromoColorTheme } from "@/types/marketing";

export interface PromoBannerActionResult {
  error?: string;
}

// Mismo criterio que el resto del admin: cada Server Action confirma
// is_admin() por su cuenta.
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

const VALID_THEMES: PromoColorTheme[] = ["naranja", "pizarra", "negro", "claro"];

// Mismos máximos que el formulario ya impide superar al escribir
// (maxLength nativo) — se vuelven a validar aquí porque un formulario del
// navegador nunca es el único punto de verificación, y además la base de
// datos también los tiene como check constraint (tercera capa).
const MAX_LENGTHS = { eyebrow: 20, title: 35, subtitle: 60, fineprint: 40 } as const;

function parsePromoBannerForm(formData: FormData) {
  const eyebrow = String(formData.get("eyebrow") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const fineprint = String(formData.get("fineprint") ?? "").trim();
  const href = String(formData.get("href") ?? "").trim();
  const colorTheme = String(formData.get("colorTheme") ?? "");
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const position = Number.parseInt(String(formData.get("position") ?? "0"), 10);
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const endsAt = String(formData.get("endsAt") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!title) return { error: "Escribe un título." } as const;
  if (title.length > MAX_LENGTHS.title) {
    return { error: `El título no puede pasar de ${MAX_LENGTHS.title} caracteres.` } as const;
  }
  if (eyebrow.length > MAX_LENGTHS.eyebrow) {
    return { error: `El eyebrow no puede pasar de ${MAX_LENGTHS.eyebrow} caracteres.` } as const;
  }
  if (subtitle.length > MAX_LENGTHS.subtitle) {
    return { error: `El subtítulo no puede pasar de ${MAX_LENGTHS.subtitle} caracteres.` } as const;
  }
  if (fineprint.length > MAX_LENGTHS.fineprint) {
    return { error: `El fineprint no puede pasar de ${MAX_LENGTHS.fineprint} caracteres.` } as const;
  }
  if (!href) return { error: "Escribe la URL de destino." } as const;
  if (!VALID_THEMES.includes(colorTheme as PromoColorTheme)) {
    return { error: "Elige un tema de color válido." } as const;
  }
  if (Number.isNaN(position)) return { error: "La posición debe ser un número." } as const;
  if (startsAt && endsAt && startsAt > endsAt) {
    return { error: "La fecha de inicio no puede ser posterior a la fecha de fin." } as const;
  }

  return {
    eyebrow: eyebrow || null,
    title,
    subtitle: subtitle || null,
    fineprint: fineprint || null,
    href,
    colorTheme,
    imageUrl: imageUrl || null,
    position,
    startsAt: startsAt || null,
    endsAt: endsAt || null,
    active,
  } as const;
}

export async function createPromoBanner(formData: FormData): Promise<PromoBannerActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const parsed = parsePromoBannerForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase.from("promo_banners").insert({
    eyebrow: parsed.eyebrow,
    title: parsed.title,
    subtitle: parsed.subtitle,
    fineprint: parsed.fineprint,
    href: parsed.href,
    color_theme: parsed.colorTheme,
    image_url: parsed.imageUrl,
    position: parsed.position,
    starts_at: parsed.startsAt,
    ends_at: parsed.endsAt,
    active: parsed.active,
  });
  if (error) return { error: `No se pudo crear la tarjeta: ${error.message}` };

  // La tarjeta vive en el Home ("/"), no en un layout compartido — a
  // diferencia del Top Banner, aquí basta revalidar esa página puntual.
  revalidatePath("/");
  revalidatePath("/admin/promo-banners");
  redirect("/admin/promo-banners");
}

export async function updatePromoBanner(
  id: string,
  formData: FormData
): Promise<PromoBannerActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const parsed = parsePromoBannerForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase
    .from("promo_banners")
    .update({
      eyebrow: parsed.eyebrow,
      title: parsed.title,
      subtitle: parsed.subtitle,
      fineprint: parsed.fineprint,
      href: parsed.href,
      color_theme: parsed.colorTheme,
      image_url: parsed.imageUrl,
      position: parsed.position,
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      active: parsed.active,
    })
    .eq("id", id);
  if (error) return { error: `No se pudo actualizar la tarjeta: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/admin/promo-banners");
  redirect("/admin/promo-banners");
}

export async function togglePromoBannerActive(
  id: string,
  active: boolean
): Promise<PromoBannerActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const { error } = await supabase.from("promo_banners").update({ active }).eq("id", id);
  if (error) return { error: `No se pudo actualizar la tarjeta: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/admin/promo-banners");
  return {};
}

export async function deletePromoBanner(id: string): Promise<PromoBannerActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const { error } = await supabase.from("promo_banners").delete().eq("id", id);
  if (error) return { error: `No se pudo eliminar la tarjeta: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/admin/promo-banners");
  return {};
}
