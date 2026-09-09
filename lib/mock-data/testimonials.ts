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
    id: "jacqueline-b",
    name: "Jacqueline B.",
    quote:
      "Me gustó mucho el servicio que ofrecen Rodo y Maite! Son muy amables y me ayudaron a encontrar lo que necesitaba, me dieron costos de todo lo que pregunté y la tienda está bien ordenada, limpia y surtida! Regresaré y volveré a comprar sin duda.",
  },
  {
    id: "carolina-c",
    name: "Carolina C.",
    quote:
      "Me encantan los productos que tienen, siempre tienen una excelente atención cuando voy a comprar y me ayudan a elegir el mejor producto para mi trabajo. Super recomendable.",
  },
  {
    id: "michael-e",
    name: "Michael E.",
    quote:
      "Excelente atención por parte del personal al igual que gran variedad de productos, tengo un negocio en la carretera y la ubicación me quedó perfecta ya que de igual forma me lo traen a domicilio en buen tiempo.",
  },
  {
    id: "leonardo-g",
    name: "Leonardo G.",
    quote:
      "Excelente atención de Rodo y Matías, sin duda volveré, tienen muy buenos precios y te ayudan a encontrar tu mejor opción. Lo recomiendo ampliamente.",
  },
];
