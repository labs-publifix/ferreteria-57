import {
  ClipboardList,
  Gift,
  Home,
  Images,
  LayoutGrid,
  Package,
  Image as ImageIcon,
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
];
