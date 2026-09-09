import type { Product } from "@/types/catalog";

// Datos de prueba para verificar que ProductCard no se rompe visualmente
// con nombres de longitud muy distinta. Sin fotografía real todavía
// (ver Product.imageUrl) — ProductCard cae a un marcador de posición.
export const mockProducts: Product[] = [
  {
    id: "martillo-truper-16oz",
    name: "Martillo Truper 16 oz",
    brand: "Truper",
    price: 299,
    rating: 4.3,
  },
  {
    id: "taladro-destornillador-20v",
    name: "Taladro/destornillador 1/2 pulgada, 20V, 1 batería 2Ah, Truper",
    brand: "Truper",
    price: 1299,
    previousPrice: 1799,
    rating: 4.7,
  },
  {
    id: "juego-desarmadores-6pzas",
    name: "Juego de desarmadores 6 piezas Truper",
    brand: "Truper",
    price: 189,
    rating: 5,
  },
];
