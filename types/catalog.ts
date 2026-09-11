// Contrato de datos del catálogo.
export interface TechnicalSpec {
  label: string;
  value: string;
}

// El precio, precio de comparación y existencia viven en la variante, no en
// el producto: un producto puede tener más de una presentación (medida,
// capacidad, color) con su propio precio y stock.
export interface ProductVariant {
  id: string;
  sku: string;
  label: string;
  /** Precio de esta variante, en MXN. */
  price: number;
  /** Precio de comparación (tachado) en MXN, solo cuando hay descuento. */
  compareAtPrice?: number;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  /** Slug de la categoría (no su uuid) — así /categoria/[slug] y el
   *  breadcrumb de /producto/[slug] siguen resolviendo la categoría con
   *  `categories.find(c => c.slug === product.categoryId)`, igual que
   *  cuando esto era el arreglo estático de mock-data. */
  categoryId: string;
  shortDescription: string;
  technicalSpecs: TechnicalSpec[];
  /**
   * Arreglo vacío es válido y esperado (todavía sin fotografía subida).
   * ProductCard cae a un marcador de posición cuando está vacío, en vez de
   * romper el layout o inventar una URL de imagen externa.
   */
  images: string[];
  /** Ficha técnica completa del fabricante (Truper u otra marca hermana),
   *  opcional — botón "Ver ficha técnica completa" en /producto/[slug]. */
  specSheetUrl?: string;
  variants: ProductVariant[];
  rating?: number;
  reviewCount?: number;
}
