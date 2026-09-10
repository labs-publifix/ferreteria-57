export interface Category {
  /** Coincide con el segmento final de `href` y con `Product.categoryId`
   *  en /lib/mock-data/products.ts — es la llave que usa /categoria/[slug]
   *  y la búsqueda para resolver una categoría, en vez de parsear `href`. */
  slug: string;
  label: string;
  href: string;
}

// Orden exacto pedido por el cliente. Agregar una categoría nueva es
// agregar un objeto aquí — el Header y el menú móvil solo iteran este
// arreglo, nunca hay que tocarlos.
export const categories: Category[] = [
  { slug: "iluminacion", label: "Iluminación", href: "/categoria/iluminacion" },
  { slug: "electrico", label: "Eléctrico", href: "/categoria/electrico" },
  { slug: "herramienta", label: "Herramienta", href: "/categoria/herramienta" },
  { slug: "jardineria", label: "Jardinería", href: "/categoria/jardineria" },
  { slug: "seguridad", label: "Seguridad", href: "/categoria/seguridad" },
  { slug: "mecanica", label: "Mecánica", href: "/categoria/mecanica" },
  { slug: "pintura", label: "Pintura", href: "/categoria/pintura" },
  { slug: "cerrajeria", label: "Cerrajería", href: "/categoria/cerrajeria" },
  { slug: "herreria", label: "Herrería", href: "/categoria/herreria" },
  { slug: "plomeria", label: "Plomería", href: "/categoria/plomeria" },
];
