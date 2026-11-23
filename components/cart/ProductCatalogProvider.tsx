"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapRowToProduct, PRODUCT_SELECT } from "@/lib/catalog/mapRow";
import { readStoredCartProductIds } from "@/components/cart/cartStorage";
import type { Product } from "@/types/catalog";

interface ProductCatalogContextValue {
  /** true cuando ya se cargaron los productos del carrito guardado. */
  isLoaded: boolean;
  getProductById: (id: string) => Product | undefined;
  /** Agrega un producto que ya se tiene en pantalla (al ponerlo en el
   *  carrito) y, en segundo plano, vuelve a pedir sus datos vigentes. */
  registerProduct: (product: Product) => void;
  /** Vuelve a pedir precio y stock vigentes de los productos cargados (p. ej.
   *  cuando el checkout avisa que los precios cambiaron). */
  refreshProducts: () => Promise<void>;
}

const ProductCatalogContext = createContext<ProductCatalogContextValue | null>(null);

// Lotes chicos para que la lista de ids nunca rebase el largo de la URL de
// la consulta.
const ID_BATCH = 100;

async function fetchActiveProducts(ids: string[]): Promise<Product[]> {
  const supabase = createClient();
  const products: Product[] = [];
  for (let i = 0; i < ids.length; i += ID_BATCH) {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("active", true)
      .in("id", ids.slice(i, i + ID_BATCH));
    // Un error se propaga: quien llama conserva lo que ya tenía en vez de
    // tomar «no regresó» como «ya no está activo».
    if (error) {
      console.error("[ProductCatalogProvider]", error.message);
      throw new Error(error.message);
    }
    for (const row of data ?? []) products.push(mapRowToProduct(row));
  }
  return products;
}

// Antes cargaba TODO el catálogo activo al entrar al sitio (y la API corta en
// 1,000 filas, así que con un catálogo grande productos del carrito podían
// «desaparecer»). Ahora solo carga los productos que hay en el carrito
// guardado; los que se agregan después llegan desde la tarjeta o la ficha
// que ya los tiene en pantalla (registerProduct). Los precios y el stock
// siempre se piden a la base: nunca se guardan en el carrito.
export function ProductCatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const productsRef = useRef(products);
  productsRef.current = products;

  const mergeProducts = useCallback((fresh: Product[], requestedIds: string[]) => {
    setProducts((current) => {
      const next = new Map(current);
      // Los ids pedidos que no regresaron ya no están activos: se quitan
      // para que el carrito deje de ofrecerlos.
      for (const id of requestedIds) next.delete(id);
      for (const product of fresh) next.set(product.id, product);
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const ids = readStoredCartProductIds();
      try {
        if (ids.length > 0) {
          const fresh = await fetchActiveProducts(ids);
          if (!cancelled) mergeProducts(fresh, ids);
        }
      } catch {
        // Sin conexión o sin configurar: el carrito sigue funcionando, solo
        // no puede resolver sus líneas, en vez de trabarse cargando.
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [mergeProducts]);

  const getProductById = useCallback((id: string) => products.get(id), [products]);

  const registerProduct = useCallback(
    (product: Product) => {
      setProducts((current) => {
        if (current.has(product.id)) return current;
        const next = new Map(current);
        next.set(product.id, product);
        return next;
      });
      // La tarjeta pudo venir de una página guardada en caché: se piden los
      // datos vigentes para que el carrito muestre el precio actual.
      fetchActiveProducts([product.id])
        .then((fresh) => mergeProducts(fresh, [product.id]))
        .catch(() => undefined);
    },
    [mergeProducts]
  );

  const refreshProducts = useCallback(async () => {
    const ids = [...new Set([...productsRef.current.keys(), ...readStoredCartProductIds()])];
    if (ids.length === 0) return;
    try {
      mergeProducts(await fetchActiveProducts(ids), ids);
    } catch {
      // Se queda con lo que ya tenía.
    }
  }, [mergeProducts]);

  return (
    <ProductCatalogContext.Provider value={{ isLoaded, getProductById, registerProduct, refreshProducts }}>
      {children}
    </ProductCatalogContext.Provider>
  );
}

export function useProductCatalog() {
  const context = useContext(ProductCatalogContext);
  if (!context) {
    throw new Error("useProductCatalog debe usarse dentro de <ProductCatalogProvider>");
  }
  return context;
}
