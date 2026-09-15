export interface ConfirmedOrderItem {
  name: string;
  variantLabel: string | null;
  quantity: number;
  price: number;
}

export interface ConfirmedOrderAddress {
  city: string;
  state: string;
  colonia: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  postalCode: string;
  references: string;
}

export interface ConfirmedOrder {
  orderNumber: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryMethod: "retiro" | "envio_local" | "envio_foraneo";
  // Ausente para "retiro" — ese flujo no pide dirección (ver Flujo 1).
  address?: ConfirmedOrderAddress;
  items: ConfirmedOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

const LAST_ORDER_KEY = "ferreteria57:lastOrder";

// sessionStorage, no localStorage: este "recibo" es un artefacto
// temporal de la simulación, vale solo para esta pestaña/sesión — a
// diferencia del carrito, que sí debe sobrevivir entre visitas.
export function saveLastOrder(order: ConfirmedOrder) {
  try {
    window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    // sessionStorage inaccesible: la página de confirmación mostrará su
    // propio estado de respaldo ("no encontramos un pedido reciente") en
    // vez de romper.
  }
}

export function getLastOrder(): ConfirmedOrder | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConfirmedOrder;
  } catch {
    return null;
  }
}
