// Top Banner y Promo Banners: contenido de marketing editable desde el
// admin, separado del catálogo (types/catalog.ts) porque no describe
// productos — son piezas de comunicación con vigencia propia.

export type TopBannerTheme = "pizarra" | "naranja" | "negro";

export interface TopBannerConfig {
  message: string;
  colorTheme: TopBannerTheme;
  href: string | null;
  /** "YYYY-MM-DD" o null — ver lib/marketing/visibility.ts. */
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}

export type PromoColorTheme = "naranja" | "pizarra" | "negro" | "claro";

export interface PromoBanner {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  fineprint: string | null;
  href: string;
  colorTheme: PromoColorTheme;
  imageUrl: string | null;
  position: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}
