import Link from "next/link";
import { Images, Plus, Star, Upload } from "lucide-react";

// Las 4 acciones más frecuentes del día a día (alta de catálogo,
// moderación, marketing) resueltas en un clic desde Inicio, en vez de
// tener que entrar primero a cada sección del menú. No son botones con el
// mismo peso visual que "Nuevo producto" ya tiene en /admin/productos —
// aquí son accesos, con su ícono como protagonista, no CTAs de una tabla.
const QUICK_ACTIONS = [
  { href: "/admin/productos/nuevo", label: "Nuevo producto", icon: Plus },
  { href: "/admin/productos/importar", label: "Importar desde Excel", icon: Upload },
  { href: "/admin/resenas?estado=pending", label: "Ver reseñas pendientes", icon: Star },
  { href: "/admin/promo-banners/nueva", label: "Crear tarjeta de promoción", icon: Images },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg bg-white px-3 py-4 text-center shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        >
          <Icon className="size-5 text-brand-orange" aria-hidden="true" strokeWidth={1.75} />
          <span className="font-sans text-sm font-medium text-brand-black">{label}</span>
        </Link>
      ))}
    </div>
  );
}
