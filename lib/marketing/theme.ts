import type { PromoColorTheme, TopBannerTheme } from "@/types/marketing";

// Solo los tokens de marca ya definidos — nunca un color libre. Naranja de
// fondo con texto BLANCO da ~2.94:1 de contraste, por debajo del mínimo
// 4.5:1 (mismo hallazgo ya corregido antes en el botón primario y la
// píldora de Programa de Lealtad) — por eso ese tema usa negro-suave
// encima, no blanco, aunque el pedido original lo haya descrito como
// "naranja/blanco".
export const TOP_BANNER_THEME_CLASSES: Record<TopBannerTheme, string> = {
  pizarra: "bg-brand-slate text-white",
  naranja: "bg-brand-orange text-brand-black",
  negro: "bg-brand-black text-white",
};

export const TOP_BANNER_THEME_OPTIONS: { value: TopBannerTheme; label: string }[] = [
  { value: "pizarra", label: "Pizarra" },
  { value: "naranja", label: "Naranja" },
  { value: "negro", label: "Negro" },
];

export const PROMO_THEME_OPTIONS: { value: PromoColorTheme; label: string }[] = [
  { value: "naranja", label: "Naranja" },
  { value: "pizarra", label: "Pizarra" },
  { value: "negro", label: "Negro" },
  { value: "claro", label: "Claro" },
];
