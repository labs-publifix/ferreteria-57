"use client";

import { useMemo } from "react";
import { useProductCatalog } from "@/components/cart/ProductCatalogProvider";
import { useCart } from "./CartProvider";
import type { Product, ProductVariant } from "@/types/catalog";

export interface ResolvedCartLine {
  product: Product;
  variant: ProductVariant;
  /** Nunca mayor al stock actual de la variante — ver `wasReduced`. */
  quantity: number;
  /** true cuando lo guardado en el carrito (localStorage) pedía más de lo
   *  que hay ahora mismo en existencia (p. ej. otro cliente compró el
   *  resto mientras este carrito esperaba) — `quantity` ya viene topada al
   *  máximo real, esto solo indica que hubo que recortarla para que quien
   *  llama pueda avisarlo. */
  wasReduced: boolean;
}

// Resuelve las líneas del carrito (solo productId/variantId/cantidad) a
// producto+variante reales y calcula el subtotal — compartido por
// CartView y CheckoutView para que ambos muestren exactamente el mismo
// total sin duplicar la lógica de "descarta líneas que ya no resuelven a
// un producto real" (ver CartProvider).
//
// La cantidad se topa aquí contra el stock ACTUAL de la variante (no el
// que había cuando se agregó al carrito) — si bajó desde entonces, todo lo
// que lee de aquí (subtotal, total del pedido, lo que se manda a
// create_order) ya refleja el máximo real, sin depender de que el cliente
// haya tocado el stepper +/- para forzar la corrección.
export function useResolvedCart() {
  const { lines, ...rest } = useCart();
  const { getProductById } = useProductCatalog();

  const items = useMemo<ResolvedCartLine[]>(() => {
    return lines.reduce<ResolvedCartLine[]>((acc, line) => {
      const product = getProductById(line.productId);
      const variant = product?.variants.find((item) => item.id === line.variantId);
      if (product && variant) {
        // 0 es un valor válido y esperado (se agotó por completo mientras
        // estaba en el carrito) — la línea se conserva igual, no se
        // descarta, para que CartLineItem pueda mostrar el aviso en vez de
        // que el producto desaparezca sin explicación. Quien arma el
        // pedido (CheckoutView) es quien filtra las de quantity 0 antes de
        // mandarlas a create_order.
        const quantity = Math.max(0, Math.min(line.quantity, variant.stock));
        acc.push({ product, variant, quantity, wasReduced: quantity < line.quantity });
      }
      return acc;
    }, []);
    // getProductById cambia de referencia cada vez que carga el catálogo
    // (una sola vez); agregarlo aquí no aporta nada, solo repetiría el
    // cálculo sin necesidad.
  }, [lines]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = useMemo(
    () => items.reduce((sum, { variant, quantity }) => sum + variant.price * quantity, 0),
    [items]
  );

  // Reemplaza el totalQuantity "crudo" de useCart() (suma directa de lo
  // guardado en localStorage) por uno que ya cuenta las cantidades topadas
  // — sin esto, el badge del carrito en el Header podía mostrar más
  // unidades de las que /carrito de verdad iba a cobrar. El orden del
  // spread importa: totalQuantity va DESPUÉS de ...rest para pisar el
  // valor crudo.
  const totalQuantity = useMemo(() => items.reduce((sum, { quantity }) => sum + quantity, 0), [items]);

  return { ...rest, items, subtotal, totalQuantity };
}
