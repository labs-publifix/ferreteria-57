"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { getProductById } from "@/lib/mock-data/products";
import { useToast } from "@/components/ui";

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
}

type CartAction =
  | { type: "HYDRATE"; lines: CartLine[] }
  | { type: "ADD_ITEM"; productId: string; variantId: string; quantity: number; maxStock: number }
  | { type: "SET_QUANTITY"; productId: string; variantId: string; quantity: number; maxStock: number }
  | { type: "REMOVE_ITEM"; productId: string; variantId: string };

const STORAGE_KEY = "ferreteria57:cart";

function sameLine(line: CartLine, productId: string, variantId: string) {
  return line.productId === productId && line.variantId === variantId;
}

// Reducer "tonto": solo aritmética sobre líneas (id + cantidad), sin saber
// nada de precios ni de por qué existe un límite de stock — ese límite
// llega ya calculado en la acción (maxStock), resuelto por quien la
// disparó (ver addItem/setQuantity abajo). Mantiene la regla de negocio
// ("no rebasar stock") fuera del reducer, que solo aplica el número que le
// pasan.
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { lines: action.lines };

    case "ADD_ITEM": {
      const existing = state.lines.find((line) => sameLine(line, action.productId, action.variantId));
      if (!existing) {
        const quantity = Math.min(action.quantity, action.maxStock);
        if (quantity <= 0) return state;
        return {
          lines: [...state.lines, { productId: action.productId, variantId: action.variantId, quantity }],
        };
      }
      return {
        lines: state.lines.map((line) =>
          line === existing
            ? { ...line, quantity: Math.min(line.quantity + action.quantity, action.maxStock) }
            : line
        ),
      };
    }

    case "SET_QUANTITY": {
      const quantity = Math.max(1, Math.min(action.quantity, action.maxStock));
      return {
        lines: state.lines.map((line) =>
          sameLine(line, action.productId, action.variantId) ? { ...line, quantity } : line
        ),
      };
    }

    case "REMOVE_ITEM":
      return {
        lines: state.lines.filter((line) => !sameLine(line, action.productId, action.variantId)),
      };

    default:
      return state;
  }
}

interface CartContextValue {
  lines: CartLine[];
  totalQuantity: number;
  addItem: (productId: string, variantId: string, quantity?: number) => void;
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  removeItem: (productId: string, variantId: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// Carrito 100% client-side por ahora (sin backend). Las líneas SOLO
// guardan productId/variantId/cantidad — nunca precio/nombre/imagen
// duplicados, esos se resuelven desde lib/mock-data/products.ts al
// momento de mostrarse (ver CartView/CartLineItem/ProductCard). Es
// exactamente la forma que necesitaría una tabla `cart_items` real
// (user_id, product_id, variant_id, quantity): el día que conectemos
// Supabase, lo único que cambia es CÓMO se persiste (estos dos useEffect
// de localStorage se reemplazan por lecturas/escrituras a la API) y CÓMO
// se resuelve un producto por id (getProductById pasaría de síncrono a
// async) — el reducer, el Context y los componentes que llaman
// useCart() no cambian.
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { lines: [] });
  const { showToast } = useToast();
  const hasHydrated = useRef(false);

  // Cargar de localStorage una sola vez, después del primer render (nunca
  // durante SSR, que no tiene localStorage) — evita un error de
  // hidratación por mostrar algo distinto entre servidor y cliente.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { lines?: CartLine[] };
        // Descarta líneas que ya no resuelven a un producto/variante real
        // (el mock cambió entre sesiones) en vez de romper la UI con un
        // producto fantasma.
        const validLines = (parsed.lines ?? []).filter((line) =>
          getProductById(line.productId)?.variants.some((variant) => variant.id === line.variantId)
        );
        dispatch({ type: "HYDRATE", lines: validLines });
      }
    } catch {
      // localStorage corrupto, cuota llena o inaccesible (modo privado):
      // seguir con el carrito vacío en vez de romper la página.
    } finally {
      hasHydrated.current = true;
    }
  }, []);

  // Persistir cada cambio, pero solo después de la carga inicial — si no,
  // el primer render (carrito vacío, antes de leer localStorage)
  // sobreescribiría lo ya guardado antes de alcanzar a leerlo.
  useEffect(() => {
    if (!hasHydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines: state.lines }));
    } catch {
      // Cuota llena o inaccesible: no bloquear la compra por esto, solo no
      // persiste entre sesiones.
    }
  }, [state.lines]);

  function addItem(productId: string, variantId: string, quantity = 1) {
    const product = getProductById(productId);
    const variant = product?.variants.find((item) => item.id === variantId);
    if (!product || !variant || variant.stock <= 0) return;
    dispatch({ type: "ADD_ITEM", productId, variantId, quantity, maxStock: variant.stock });
    // Confirmación sin navegar (Baymard): el usuario se queda donde está,
    // con un link opcional para ir al carrito si así lo decide.
    showToast({
      message: "✓ Agregado al carrito",
      actionLabel: "Ver carrito",
      actionHref: "/carrito",
    });
  }

  function setQuantity(productId: string, variantId: string, quantity: number) {
    const variant = getProductById(productId)?.variants.find((item) => item.id === variantId);
    if (!variant) return;
    dispatch({ type: "SET_QUANTITY", productId, variantId, quantity, maxStock: variant.stock });
  }

  function removeItem(productId: string, variantId: string) {
    dispatch({ type: "REMOVE_ITEM", productId, variantId });
  }

  const totalQuantity = useMemo(
    () => state.lines.reduce((sum, line) => sum + line.quantity, 0),
    [state.lines]
  );

  return (
    <CartContext.Provider value={{ lines: state.lines, totalQuantity, addItem, setQuantity, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de <CartProvider>");
  }
  return ctx;
}
