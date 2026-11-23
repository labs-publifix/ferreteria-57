// Dónde y cómo se guarda el carrito en el navegador. Lo comparten
// CartProvider (que lo escribe) y ProductCatalogProvider (que solo necesita
// saber qué productos hay en el carrito para cargarlos al entrar).

export const CART_STORAGE_KEY = "ferreteria57:cart";

/** Ids de producto del carrito guardado; vacío si no hay o no se puede leer. */
export function readStoredCartProductIds(): string[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { lines?: { productId?: unknown }[] };
    const ids = (parsed.lines ?? [])
      .map((line) => line.productId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    return [...new Set(ids)];
  } catch {
    return [];
  }
}
