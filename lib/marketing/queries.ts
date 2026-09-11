import { createClient } from "@/lib/supabase/server";
import { isWithinSchedule } from "@/lib/marketing/visibility";
import type { PromoBanner, TopBannerConfig } from "@/types/marketing";

interface TopBannerRow {
  message: string;
  color_theme: TopBannerConfig["colorTheme"];
  href: string | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
}

function mapTopBannerRow(row: TopBannerRow): TopBannerConfig {
  return {
    message: row.message,
    colorTheme: row.color_theme,
    href: row.href,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    active: row.active,
  };
}

// Devuelve null tanto si no hay fila (no debería pasar, la migración
// siembra una) como si la configuración existe pero no está vigente ahora
// — en ambos casos el llamador (Header) simplemente no renderiza nada,
// sin dejar un hueco vacío.
export async function getVisibleTopBanner(): Promise<TopBannerConfig | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("top_banner_config").select("*").maybeSingle();
  if (error) {
    console.error("[marketing] getVisibleTopBanner:", error.message);
    return null;
  }
  if (!data) return null;

  const config = mapTopBannerRow(data);
  if (!config.message.trim()) return null;
  return isWithinSchedule(config) ? config : null;
}

interface PromoBannerRow {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  fineprint: string | null;
  href: string;
  color_theme: PromoBanner["colorTheme"];
  image_url: string | null;
  position: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
}

function mapPromoBannerRow(row: PromoBannerRow): PromoBanner {
  return {
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
  };
}

// Solo las visibles ahora mismo, ya en el orden que definió el admin — el
// PromoRail público no vuelve a filtrar/ordenar nada.
export async function getVisiblePromoBanners(): Promise<PromoBanner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promo_banners")
    .select("*")
    .order("position", { ascending: true });
  if (error) {
    console.error("[marketing] getVisiblePromoBanners:", error.message);
    return [];
  }

  return (data ?? []).map(mapPromoBannerRow).filter((promo) => isWithinSchedule(promo));
}
