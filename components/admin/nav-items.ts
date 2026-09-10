import {
  ClipboardList,
  Gift,
  Home,
  Images,
  LayoutGrid,
  Package,
  Image as ImageIcon,
  ShieldCheck,
  Star,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Orden fijo pedido para el menú lateral. Cada entrada ya tiene su propia
// ruta con placeholder (ver app/(admin)/admin/(protected)/), aunque el
// contenido real de cada sección llegue en prompts posteriores.
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Inicio", icon: Home },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/categorias", label: "Categorías", icon: LayoutGrid },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/resenas", label: "Reseñas", icon: Star },
  { href: "/admin/top-banner", label: "Top Banner", icon: ImageIcon },
  { href: "/admin/promo-banners", label: "Promo Banners", icon: Images },
  { href: "/admin/lealtad", label: "Programa de Lealtad", icon: Gift },
  // Al final: a diferencia de las 7 anteriores (gestión de contenido de la
  // tienda), esta es administración del propio panel — mismo criterio que
  // separa "Programa de Lealtad" del resto de categorías en el header de
  // la tienda, aquí como el último ítem en vez de un tratamiento visual
  // aparte.
  { href: "/admin/accesos", label: "Accesos", icon: ShieldCheck },
];
