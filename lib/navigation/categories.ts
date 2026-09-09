export interface Category {
  label: string;
  href: string;
}

// Orden exacto pedido por el cliente. Agregar una categoría nueva es
// agregar un objeto aquí — el Header y el menú móvil solo iteran este
// arreglo, nunca hay que tocarlos.
export const categories: Category[] = [
  { label: "Iluminación", href: "/categoria/iluminacion" },
  { label: "Eléctrico", href: "/categoria/electrico" },
  { label: "Herramienta", href: "/categoria/herramienta" },
  { label: "Jardinería", href: "/categoria/jardineria" },
  { label: "Seguridad", href: "/categoria/seguridad" },
  { label: "Mecánica", href: "/categoria/mecanica" },
  { label: "Pintura", href: "/categoria/pintura" },
  { label: "Cerrajería", href: "/categoria/cerrajeria" },
  { label: "Herrería", href: "/categoria/herreria" },
  { label: "Plomería", href: "/categoria/plomeria" },
];
