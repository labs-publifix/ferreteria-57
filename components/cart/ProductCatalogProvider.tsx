"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapRowToProduct, PRODUCT_SELECT } from "@/lib/catalog/mapRow";
import type { Product } from "@/types/catalog";

interface ProductCatalogContextValue {
  // false hasta terminar el primer fetch (éxito o error) — CartProvider
  // espera esto antes de podar líneas de carrito contra productos reales,
  // mismo criterio que isHydrated allí para "localStorage" (ver ese
  // archivo): no confundir "todavía no llegó el catálogo" con "el
  // producto de verdad ya no existe".
  isLoaded: boolean;
  getProductById: (id: string) => Product | undefined;
}

const ProductCatalogContext = createContext<ProductCatalogContextValue | null>(null);

// Reemplaza a getProductById de lib/mock-data/products.ts (ya eliminado):
// el carrito guarda solo productId/variantId/cantidad y necesita
// resolverlos de forma síncrona en cada render (ver CartProvider y
// useResolvedCart) — Supabase es async, así que esto trae el catálogo de
// productos ACTIVOS una sola vez al montar la tienda y lo deja en memoria
// para lectura síncrona. Los productos inactivos ya no aparecen aquí
// (igual que en la tienda pública), así que si un cliente tenía uno en el
// carrito y se desactivó, esa línea se poda igual que si el producto no
// existiera — comportamiento ya esperado por el carrito.
export function ProductCatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("products")
          .select(PRODUCT_SELECT)
          .eq("active", true);
        if (cancelled) return;
        const map = new Map<string, Product>();
        for (const row of data ?? []) {
          const product = mapRowToProduct(row);
          map.set(product.id, product);
        }
        setProducts(map);
      } catch {
        // Sin catálogo (red caída, Supabase sin configurar): el carrito
        // sigue funcionando, solo no puede resolver líneas — se comporta
        // como si el catálogo estuviera vacío en vez de trabarse cargando
        // para siempre.
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function getProductById(id: string) {
    return products.get(id);
  }

  return (
    <ProductCatalogContext.Provider value={{ isLoaded, getProductById }}>
      {children}
    </ProductCatalogContext.Provider>
  );
}

export function useProductCatalog() {
  const ctx = useContext(ProductCatalogContext);
  if (!ctx) {
    throw new Error("useProductCatalog debe usarse dentro de <ProductCatalogProvider>");
  }
  return ctx;
}
