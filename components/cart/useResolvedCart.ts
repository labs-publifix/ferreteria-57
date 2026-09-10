"use client";

import { useMemo } from "react";
import { getProductById } from "@/lib/mock-data/products";
import { useCart } from "./CartProvider";
import type { Product, ProductVariant } from "@/types/catalog";

export interface ResolvedCartLine {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

// Resuelve las líneas del carrito (solo productId/variantId/cantidad) a
// producto+variante reales y calcula el subtotal — compartido por
// CartView y CheckoutView para que ambos muestren exactamente el mismo
// total sin duplicar la lógica de "descarta líneas que ya no resuelven a
// un producto real" (ver CartProvider).
export function useResolvedCart() {
  const { lines, ...rest } = useCart();

  const items = useMemo<ResolvedCartLine[]>(() => {
    return lines.reduce<ResolvedCartLine[]>((acc, line) => {
      const product = getProductById(line.productId);
      const variant = product?.variants.find((item) => item.id === line.variantId);
      if (product && variant) {
        acc.push({ product, variant, quantity: line.quantity });
      }
      return acc;
    }, []);
  }, [lines]);

  const subtotal = useMemo(
    () => items.reduce((sum, { variant, quantity }) => sum + variant.price * quantity, 0),
    [items]
  );

  return { items, subtotal, ...rest };
}
