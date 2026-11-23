"use client";

import { useMemo } from "react";
import { useProductCatalog } from "@/components/cart/ProductCatalogProvider";
import { useMemberPrices } from "@/components/club57/MemberPricesProvider";
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
  /** Precio que se cobra: el Club 57 del miembro si le toca, si no el de tienda. */
  unitPrice: number;
  /** true cuando unitPrice es su precio Club 57. */
  isMemberPrice: boolean;
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

  const variantIds = useMemo(() => lines.map((line) => line.variantId), [lines]);
  // Precio Club 57 (si quien compra es miembro con lista): el carrito y el
  // checkout cobran el mismo precio que calcula el servidor.
  const { getMemberPrice, ready: pricesReady } = useMemberPrices(variantIds);

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
        const memberPrice = getMemberPrice(variant.id);
        const isMemberPrice = memberPrice !== undefined && memberPrice < variant.price;
        acc.push({
          product,
          variant,
          quantity,
          wasReduced: quantity < line.quantity,
          unitPrice: isMemberPrice ? memberPrice : variant.price,
          isMemberPrice,
        });
      }
      return acc;
    }, []);
    // getProductById cambia de referencia cada vez que carga el catálogo
    // (una sola vez); agregarlo aquí no aporta nada, solo repetiría el
    // cálculo sin necesidad.
    // getProductById cambia cuando llegan datos vigentes del catálogo (precio
    // o stock actualizados): el carrito se vuelve a resolver con ellos.
  }, [lines, getProductById, getMemberPrice]);

  const subtotal = useMemo(
    () => Math.round(items.reduce((sum, { unitPrice, quantity }) => sum + unitPrice * quantity, 0) * 100) / 100,
    [items]
  );

  // Reemplaza el totalQuantity "crudo" de useCart() (suma directa de lo
  // guardado en localStorage) por uno que ya cuenta las cantidades topadas
  // — sin esto, el badge del carrito en el Header podía mostrar más
  // unidades de las que /carrito de verdad iba a cobrar. El orden del
  // spread importa: totalQuantity va DESPUÉS de ...rest para pisar el
  // valor crudo.
  const totalQuantity = useMemo(() => items.reduce((sum, { quantity }) => sum + quantity, 0), [items]);

  return { ...rest, items, subtotal, totalQuantity, pricesReady };
}
