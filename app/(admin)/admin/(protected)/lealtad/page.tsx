import type { Metadata } from "next";
import Link from "next/link";
import { Gift, RefreshCw, Settings, Users } from "lucide-react";

export const metadata: Metadata = { title: "Club 57 — Panel de administración" };

const SECTIONS = [
  {
    href: "/admin/lealtad/configuracion",
    label: "Configuración",
    description: "Reglas de puntos, canje y referidos.",
    icon: Settings,
  },
  {
    href: "/admin/lealtad/clientes",
    label: "Clientes",
    description: "Alta manual, saldo de puntos y compras en tienda.",
    icon: Users,
  },
  {
    href: "/admin/lealtad/catalogo",
    label: "Catálogo",
    description: "Artículos de canje: alta manual e importación desde Excel.",
    icon: Gift,
  },
  {
    href: "/admin/lealtad/canjes",
    label: "Canjes",
    description: "Solicitudes de canje pendientes de entrega en tienda.",
    icon: RefreshCw,
  },
];

// Índice de la sección — mismo criterio de "landing con tarjetas grandes"
// que el resto del admin usa para agrupar sub-secciones (ver /admin
// mismo), en vez de anidar un segundo nivel dentro del sidebar (que hoy
// es una lista plana, ver components/admin/AdminShell.tsx).
export default function AdminClub57Page() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Club 57</h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
          Programa de lealtad de Ferretería 57.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex min-h-11 flex-col gap-2 rounded-lg bg-white p-5 shadow-sm transition-colors hover:bg-brand-gray/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            >
              <Icon className="size-6 text-brand-orange" aria-hidden="true" strokeWidth={1.75} />
              <p className="font-display text-base uppercase text-brand-slate">{section.label}</p>
              <p className="font-sans text-sm text-brand-slate/70">{section.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
