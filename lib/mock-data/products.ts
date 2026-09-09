import type { Product } from "@/types/catalog";

// Datos de prueba para verificar que ProductCard no se rompe visualmente
// con nombres de longitud muy distinta. Sin fotografía real todavía
// (ver Product.images) — ProductCard cae a un marcador de posición.
// Un solo variant por producto por ahora: basta para probar que la forma
// del contrato completo (variants, technicalSpecs, categoryId, etc.)
// compila y se puede leer, sin construir todavía un selector de variantes.
export const mockProducts: Product[] = [
  {
    id: "martillo-truper-16oz",
    slug: "martillo-truper-16oz",
    name: "Martillo Truper 16 oz",
    brand: "Truper",
    categoryId: "herramienta",
    shortDescription: "Martillo de uña con mango de fibra de vidrio y cabeza forjada.",
    technicalSpecs: [
      { label: "Peso de cabeza", value: "16 oz" },
      { label: "Material del mango", value: "Fibra de vidrio" },
      { label: "Tipo de cabeza", value: "Uña curva" },
    ],
    images: [],
    variants: [
      {
        id: "martillo-truper-16oz-unico",
        sku: "TRU-MART-16OZ",
        label: "Único",
        price: 299,
        stock: 24,
      },
    ],
    rating: 4.3,
    reviewCount: 18,
  },
  {
    id: "taladro-destornillador-20v",
    slug: "taladro-destornillador-1-2-20v",
    name: "Taladro/destornillador 1/2 pulgada, 20V, 1 batería 2Ah, Truper",
    brand: "Truper",
    categoryId: "herramienta",
    shortDescription:
      "Taladro/destornillador inalámbrico con mandril de 1/2 pulgada, incluye una batería de 2Ah.",
    technicalSpecs: [
      { label: "Voltaje", value: "20V" },
      { label: "Mandril", value: "1/2 pulgada" },
      { label: "Batería incluida", value: "1 x 2Ah" },
    ],
    images: [],
    variants: [
      {
        id: "taladro-destornillador-20v-1bat",
        sku: "TRU-TAL-20V-2AH",
        label: "1 batería 2Ah",
        price: 1299,
        compareAtPrice: 1799,
        stock: 7,
      },
    ],
    rating: 4.7,
    reviewCount: 34,
  },
  {
    id: "juego-desarmadores-6pzas",
    slug: "juego-desarmadores-6-piezas",
    name: "Juego de desarmadores 6 piezas Truper",
    brand: "Truper",
    categoryId: "herramienta",
    shortDescription: "Juego de desarmadores de acero cromo-vanadio con mangos ergonómicos.",
    technicalSpecs: [
      { label: "Piezas", value: "6" },
      { label: "Material", value: "Acero cromo-vanadio" },
      { label: "Puntas incluidas", value: "Plano y de cruz, varias medidas" },
    ],
    images: [],
    variants: [
      {
        id: "juego-desarmadores-6pzas-unico",
        sku: "TRU-DESA-6PZ",
        label: "Único",
        price: 189,
        stock: 40,
      },
    ],
    rating: 5,
    reviewCount: 9,
  },
];
