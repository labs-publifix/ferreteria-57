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
  categoryId: string;
  shortDescription: string;
  technicalSpecs: TechnicalSpec[];
  /**
   * Todavía no hay fotografía real de producto: un arreglo vacío es válido
   * y esperado. ProductCard cae a un marcador de posición cuando está vacío,
   * en vez de romper el layout o inventar una URL de imagen externa.
   */
  images: string[];
  variants: ProductVariant[];
  rating?: number;
  reviewCount?: number;
}

// parentId permite jerarquía (subcategorías) sin cambiar la forma del tipo:
// una categoría raíz tiene parentId null.
export interface Category {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  imageUrl?: string;
}
