// Pop-Up Banner: tarjeta promocional discreta (esquina inferior izquierda),
// separado de types/marketing.ts (Top Banner / Promo Banners) — módulo
// nuevo, sin relación de datos con esos dos.

export type PopupBackgroundType = "solido" | "imagen";

export interface PopupBanner {
  id: string;
  /** Solo para identificarlo en el admin — nunca se expone al público. */
  nombre: string;
  titulo: string;
  texto: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  tipoFondo: PopupBackgroundType;
  colorFondo: string;
  colorTexto: string;
  colorBoton: string;
  colorTextoBoton: string;
  imagenUrl: string | null;
  textoAlternativo: string | null;
  /** ISO UTC. */
  startsAt: string;
  /** ISO UTC. */
  endsAt: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Forma pública (lo que expone popup_banners_public) — el widget del sitio
// nunca ve `nombre`, `activo`, fechas ni `createdAt`.
export interface PublicPopupBanner {
  id: string;
  titulo: string;
  texto: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  tipoFondo: PopupBackgroundType;
  colorFondo: string;
  colorTexto: string;
  colorBoton: string;
  colorTextoBoton: string;
  imagenUrl: string | null;
  textoAlternativo: string | null;
  /** ISO UTC — única fecha expuesta, es la clave de descarte del localStorage. */
  updatedAt: string;
}
