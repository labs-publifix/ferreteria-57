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
  {
    id: "foco-led-9w-truper",
    slug: "foco-led-9w-luz-de-dia-truper",
    name: "Foco LED 9W luz de día Truper",
    brand: "Truper",
    categoryId: "iluminacion",
    shortDescription: "Foco LED de bajo consumo, equivalente a un foco incandescente de 60W.",
    technicalSpecs: [
      { label: "Potencia", value: "9W" },
      { label: "Tono de luz", value: "Luz de día" },
      { label: "Rosca", value: "E27" },
    ],
    images: [],
    variants: [
      {
        id: "foco-led-9w-truper-unico",
        sku: "TRU-LED-9W-DIA",
        label: "Único",
        price: 49,
        stock: 120,
      },
    ],
    rating: 4.5,
    reviewCount: 27,
  },
  {
    id: "cinta-metrica-5m-truper",
    slug: "cinta-metrica-5m-truper",
    name: "Cinta métrica 5m Truper",
    brand: "Truper",
    categoryId: "herramienta",
    shortDescription: "Cinta métrica con carcasa de hule y broche para cinturón.",
    technicalSpecs: [
      { label: "Longitud", value: "5 m" },
      { label: "Ancho de cinta", value: "19 mm" },
    ],
    images: [],
    variants: [
      {
        id: "cinta-metrica-5m-truper-unico",
        sku: "TRU-CINTA-5M",
        label: "Único",
        price: 79,
        stock: 60,
      },
    ],
    rating: 4.1,
    reviewCount: 11,
  },
  {
    id: "careta-soldar-mica-oscura-truper",
    slug: "careta-para-soldar-mica-oscura-ajustable-truper",
    name: "Careta para soldar con mica oscura ajustable, Truper",
    brand: "Truper",
    categoryId: "seguridad",
    shortDescription:
      "Careta para soldadura con mica oscura y banda de cabeza ajustable para mayor comodidad.",
    technicalSpecs: [
      { label: "Tipo de mica", value: "Oscura fija" },
      { label: "Ajuste", value: "Banda de cabeza ajustable" },
    ],
    images: [],
    variants: [
      {
        id: "careta-soldar-mica-oscura-truper-unico",
        sku: "TRU-CARETA-SOLD",
        label: "Único",
        price: 159,
        stock: 15,
      },
    ],
    rating: 4.4,
    reviewCount: 6,
  },
  {
    id: "pintura-vinilica-blanca-4l-truper",
    slug: "pintura-vinilica-blanca-4-litros-interiores-truper",
    name: "Pintura vinílica blanca 4 litros, interiores, Truper",
    brand: "Truper",
    categoryId: "pintura",
    shortDescription: "Pintura vinílica lavable para interiores, acabado mate.",
    technicalSpecs: [
      { label: "Contenido", value: "4 litros" },
      { label: "Acabado", value: "Mate" },
      { label: "Uso", value: "Interiores" },
    ],
    images: [],
    variants: [
      {
        id: "pintura-vinilica-blanca-4l-truper-unico",
        sku: "TRU-PINT-VIN-4L-BCO",
        label: "4 litros",
        price: 349,
        compareAtPrice: 439,
        stock: 22,
      },
    ],
    rating: 4.6,
    reviewCount: 14,
  },
  {
    id: "candado-seguridad-50mm-truper",
    slug: "candado-de-seguridad-50mm-con-llave-truper",
    name: "Candado de seguridad 50mm con llave, Truper",
    brand: "Truper",
    categoryId: "cerrajeria",
    shortDescription: "Candado de acero endurecido con arco reforzado y dos llaves.",
    technicalSpecs: [
      { label: "Ancho de cuerpo", value: "50 mm" },
      { label: "Llaves incluidas", value: "2" },
    ],
    images: [],
    variants: [
      {
        id: "candado-seguridad-50mm-truper-unico",
        sku: "TRU-CAND-50MM",
        label: "Único",
        price: 129,
        stock: 33,
      },
    ],
    rating: 4.2,
    reviewCount: 5,
  },
];
