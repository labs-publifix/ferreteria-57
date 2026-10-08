import type { ClusterTema } from "@/content/blog/clusters";

// Bloque de color de cada clúster (tarjetas, banda del artículo, imagen
// OG). Solo tokens de marca y siempre con el par de contraste AA del
// manual: naranja con texto negro (nunca naranja como texto chico sobre
// blanco), pizarra y negro con texto blanco.
export interface ClusterThemeClasses {
  /** Fondo + texto del bloque de color. */
  block: string;
  /** Píldoras sobre el bloque de color. */
  pill: string;
  /** Texto atenuado sobre el bloque (número grande, categoría). */
  muted: string;
  /** Anillo de foco visible sobre el bloque. */
  ring: string;
  /** Hex de fondo y de texto (imagen OG, que no usa Tailwind). */
  bgHex: string;
  fgHex: string;
}

export const CLUSTER_THEME: Record<ClusterTema, ClusterThemeClasses> = {
  naranja: {
    block: "bg-brand-orange text-brand-black",
    pill: "bg-brand-black text-white",
    muted: "text-brand-black",
    ring: "focus-visible:ring-brand-black",
    bgHex: "#FF6600",
    fgHex: "#1A1A1A",
  },
  pizarra: {
    block: "bg-brand-slate text-white",
    pill: "bg-white text-brand-slate",
    muted: "text-white/80",
    ring: "focus-visible:ring-brand-slate",
    bgHex: "#3F515A",
    fgHex: "#FFFFFF",
  },
  negro: {
    block: "bg-brand-black text-white",
    pill: "bg-white text-brand-black",
    muted: "text-white/75",
    ring: "focus-visible:ring-brand-black",
    bgHex: "#1A1A1A",
    fgHex: "#FFFFFF",
  },
};
