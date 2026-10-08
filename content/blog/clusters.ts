// Las 8 categorías (clústeres) del blog. El slug es la URL pública
// (/blog/categoria/{slug}) y no debe cambiar una vez publicado; `nombre`
// coincide con la columna `cluster` del backlog (blog_topics) para poder
// cruzar ambos. `tema` es el bloque de color de las tarjetas y del
// artículo: solo tokens de marca (ver lib/blog/theme.ts).
export const CLUSTER_SLUGS = [
  "plomeria-y-agua",
  "electricidad-e-iluminacion",
  "pintura-sellado-e-impermeabilizacion",
  "construccion-fijacion-y-materiales",
  "herramientas-y-mantenimiento",
  "seguridad-y-proteccion",
  "oficios-y-negocio-ferretero",
  "marca-y-club-57",
] as const;

export type ClusterSlug = (typeof CLUSTER_SLUGS)[number];
export type ClusterTema = "naranja" | "pizarra" | "negro";

export interface BlogCluster {
  slug: ClusterSlug;
  nombre: string;
  descripcion: string;
  tema: ClusterTema;
}

export const CLUSTERS: Record<ClusterSlug, BlogCluster> = {
  "plomeria-y-agua": {
    slug: "plomeria-y-agua",
    nombre: "Plomería y agua",
    descripcion:
      "Tuberías, conexiones, tinacos y cisternas: cómo elegir el material correcto y resolver fugas comunes en casa. Te explicamos qué revisar antes de comprar y cuándo conviene llamar a un plomero.",
    tema: "pizarra",
  },
  "electricidad-e-iluminacion": {
    slug: "electricidad-e-iluminacion",
    nombre: "Electricidad e iluminación",
    descripcion:
      "Cables, contactos, apagadores e iluminación explicados en lenguaje claro. Aprende a elegir el material adecuado para cada circuito y a reconocer cuándo un trabajo eléctrico le toca a un electricista calificado.",
    tema: "naranja",
  },
  "pintura-sellado-e-impermeabilizacion": {
    slug: "pintura-sellado-e-impermeabilizacion",
    nombre: "Pintura, sellado e impermeabilización",
    descripcion:
      "Pintura, selladores e impermeabilizantes para muros, techos y fachadas. Te ayudamos a preparar la superficie, escoger el producto según el acabado y aplicar cada capa en orden.",
    tema: "negro",
  },
  "construccion-fijacion-y-materiales": {
    slug: "construccion-fijacion-y-materiales",
    nombre: "Construcción, fijación y materiales",
    descripcion:
      "Brocas, taquetes, tornillería y materiales de obra para trabajar en concreto, tabique, madera o tablaroca. Guías para elegir la combinación correcta y que lo que instales quede firme.",
    tema: "pizarra",
  },
  "herramientas-y-mantenimiento": {
    slug: "herramientas-y-mantenimiento",
    nombre: "Herramientas y mantenimiento",
    descripcion:
      "Qué herramienta conviene para cada tarea y cómo cuidarla para que te dure. Desde el kit básico del hogar hasta herramienta eléctrica para trabajo diario.",
    tema: "naranja",
  },
  "seguridad-y-proteccion": {
    slug: "seguridad-y-proteccion",
    nombre: "Seguridad y protección",
    descripcion:
      "Equipo de protección personal y buenas prácticas para trabajar sin accidentes. Te explicamos qué protección usar según la tarea y cómo revisar que siga en buen estado.",
    tema: "negro",
  },
  "oficios-y-negocio-ferretero": {
    slug: "oficios-y-negocio-ferretero",
    nombre: "Oficios y negocio ferretero",
    descripcion:
      "Contenido para quienes viven de su oficio: plomeros, electricistas, albañiles y pintores. Ideas para organizar tus compras de material y atender mejor a tus clientes.",
    tema: "pizarra",
  },
  "marca-y-club-57": {
    slug: "marca-y-club-57",
    nombre: "Marca y Club 57",
    descripcion:
      "Las marcas que manejamos en Ferretería 57 y cómo aprovechar Club 57, nuestro programa de lealtad. Conoce qué ofrece cada línea para elegir con confianza.",
    tema: "naranja",
  },
};

export const CLUSTER_LIST: BlogCluster[] = CLUSTER_SLUGS.map((slug) => CLUSTERS[slug]);
