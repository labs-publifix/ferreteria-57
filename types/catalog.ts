// Contrato de datos del catálogo. No existía en el repo todavía — se define
// aquí por primera vez, a partir de lo que ProductCard necesita mostrar
// (imagen, nombre, marca, PriceTag, RatingStars, botón).
export interface Product {
  id: string;
  name: string;
  brand: string;
  /** Precio actual en MXN. */
  price: number;
  /** Precio anterior en MXN, solo cuando hay descuento. */
  previousPrice?: number;
  /** Calificación de 0 a 5. */
  rating: number;
  /**
   * Todavía no hay fotografía real de producto: cuando falta, ProductCard
   * muestra un marcador de posición en vez de romper el layout o inventar
   * una URL de imagen externa.
   */
  imageUrl?: string;
  imageAlt?: string;
}
