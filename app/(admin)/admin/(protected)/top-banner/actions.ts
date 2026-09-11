"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TopBannerTheme } from "@/types/marketing";

export interface TopBannerActionResult {
  error?: string;
}

// Mismo criterio que el resto del admin: cada Server Action confirma
// is_admin() por su cuenta, sin confiar en que el middleware ya filtró la
// request.
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

const VALID_THEMES: TopBannerTheme[] = ["pizarra", "naranja", "negro"];

export async function updateTopBannerConfig(formData: FormData): Promise<TopBannerActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const message = String(formData.get("message") ?? "").trim();
  const colorTheme = String(formData.get("colorTheme") ?? "");
  const href = String(formData.get("href") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const endsAt = String(formData.get("endsAt") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!message) return { error: "Escribe el mensaje del banner." };
  if (!VALID_THEMES.includes(colorTheme as TopBannerTheme)) {
    return { error: "Elige un tema de color válido." };
  }
  if (startsAt && endsAt && startsAt > endsAt) {
    return { error: "La fecha de inicio no puede ser posterior a la fecha de fin." };
  }

  const { error } = await supabase
    .from("top_banner_config")
    .update({
      message,
      color_theme: colorTheme,
      href: href || null,
      starts_at: startsAt || null,
      ends_at: endsAt || null,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return { error: `No se pudo guardar el banner: ${error.message}` };

  // "layout" porque AnnouncementBar se renderiza desde app/(site)/layout.tsx
  // (dentro de Header), no desde una página específica.
  revalidatePath("/", "layout");
  revalidatePath("/admin/top-banner");
  return {};
}
