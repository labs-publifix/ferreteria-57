export type PromoColorTheme = "naranja" | "pizarra" | "negro" | "claro";

export interface Promo {
  id: string;
  /** Texto chico arriba del título (opcional, puede ir vacío). */
  eyebrow?: string;
  title: string;
  subtitle: string;
  /** Texto chico de vigencia, esquina inferior de la tarjeta. */
  fineprint: string;
  /** A dónde lleva TODA la tarjeta al hacer clic (sin botón/chip propio). */
  href: string;
  colorTheme: PromoColorTheme;
  /** Sin fotografía real todavía: cuando exista, PromoCard la coloca en la
   *  zona inferior sangrando fuera del marco; mientras tanto cae al fondo
   *  sólido + acento diagonal. */
  imageUrl?: string;
}

// Riel de tarjetas de promoción (reemplaza el antiguo carrusel de portada
// única). 3 evergreen con los mismos mensajes de TrustBar —
// repetirlos aquí es intencional, la misma confianza en un formato
// distinto, no un descuido — más 4 de campaña de ejemplo. Los 4
// colorTheme se reparten entre las 7 para que se note la variedad.
export const promos: Promo[] = [
  {
    id: "evergreen-truper",
    eyebrow: "Confianza",
    title: "Distribuidor Truper",
    subtitle: "Producto original, garantía real",
    fineprint: "Todo el año",
    href: "/buscar?q=truper",
    colorTheme: "pizarra",
  },
  {
    id: "evergreen-garantia",
    eyebrow: "Confianza",
    title: "Garantía real",
    subtitle: "Respaldo directo de Ferretería 57, no solo del fabricante",
    fineprint: "Válida con tu ticket de compra",
    href: "#destacados-heading",
    colorTheme: "claro",
  },
  {
    id: "evergreen-mayoreo",
    eyebrow: "Confianza",
    title: "Precio de mayoreo",
    subtitle: "Sin monto mínimo de compra",
    fineprint: "Todo el año",
    href: "#categorias-heading",
    colorTheme: "negro",
  },
  {
    id: "campana-herramienta",
    eyebrow: "Oferta",
    title: "Herramienta eléctrica",
    subtitle: "Hasta 25% de descuento",
    fineprint: "Vigente todo septiembre",
    href: "/categoria/herramienta",
    colorTheme: "naranja",
  },
  {
    id: "campana-jardineria",
    eyebrow: "Temporada",
    title: "Temporada de jardinería",
    subtitle: "Todo para tu jardín en un solo lugar",
    fineprint: "Nuevos productos cada semana",
    href: "/categoria/jardineria",
    colorTheme: "claro",
  },
  {
    id: "campana-iluminacion",
    eyebrow: "Ahorra en casa",
    title: "Ilumina tu hogar",
    subtitle: "Focos LED de bajo consumo",
    fineprint: "Precios especiales este mes",
    href: "/categoria/iluminacion",
    colorTheme: "pizarra",
  },
  {
    id: "campana-seguridad",
    eyebrow: "Protección",
    title: "Seguridad para tu familia",
    subtitle: "Candados, cascos y equipo",
    fineprint: "Envío gratis en compras mayores a $950",
    href: "/categoria/seguridad",
    colorTheme: "negro",
  },
];
