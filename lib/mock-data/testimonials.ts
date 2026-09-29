export interface Testimonial {
  id: string;
  name: string;
  quote: string;
}

// Reseñas reales de clientes (Google), tal como las compartió el cliente —
// el texto no se edita, solo se trunca visualmente con line-clamp cuando
// no cabe en la tarjeta (ver Testimonials.tsx).
export const testimonials: Testimonial[] = [
  {
    id: "michael-e",
    name: "Michael E.",
    quote:
      "Excelente atención por parte del personal al igual que gran variedad de productos, tengo un negocio en la carretera y la ubicación me quedó perfecta ya que de igual forma me lo traen a domicilio en buen tiempo",
  },
  {
    id: "mypsa-ingenieria-integral",
    name: "Mypsa Ingeniería Integral",
    quote:
      "Muy buena Atención del personal y en particular de Luis!!!, grandes descuentos en tienda y tiempos de entrega super rápidos!!",
  },
  {
    id: "valeria-c",
    name: "Valeria C.",
    quote:
      "Excelente opción para comprar, buenos precios y en ciertos montos de compra te llevan a domicilio, me gusta la atención brindada",
  },
  {
    id: "arturo-r",
    name: "Arturo R.",
    quote:
      "Buena tarde ay para todos los recomendable para la ferretería 57 buena atención y varios productos variedad buena trato",
  },
];
