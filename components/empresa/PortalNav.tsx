"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/empresa", label: "Inicio" },
  { href: "/empresa/pedidos", label: "Pedidos" },
  { href: "/empresa/nomina", label: "Nómina" },
  { href: "/empresa/cortes", label: "Estados de cuenta" },
  { href: "/empresa/empleados", label: "Empleados" },
];

export function PortalNav({
  pendientes,
  pedidosPendientes = 0,
  nominasPorConfirmar = 0,
  cortesPorRevisar = 0,
}: {
  pendientes: number;
  pedidosPendientes?: number;
  nominasPorConfirmar?: number;
  cortesPorRevisar?: number;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Portal Empresa" className="flex gap-1 overflow-x-auto border-b border-brand-slate/15">
      {ITEMS.map((item) => {
        const activo = item.href === "/empresa" ? pathname === "/empresa" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activo ? "page" : undefined}
            className={`-mb-px inline-flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-4 font-sans text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate ${
              activo ? "border-brand-orange text-brand-black" : "border-transparent text-brand-slate hover:text-brand-black"
            }`}
          >
            {item.label}
            {(() => {
              const n =
                item.href === "/empresa/empleados"
                  ? pendientes
                  : item.href === "/empresa/pedidos"
                    ? pedidosPendientes
                    : item.href === "/empresa/nomina"
                      ? nominasPorConfirmar
                      : item.href === "/empresa/cortes"
                        ? cortesPorRevisar
                        : 0;
              return n > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-orange px-1.5 text-xs font-bold text-brand-black">
                  {n}
                </span>
              ) : null;
            })()}
          </Link>
        );
      })}
    </nav>
  );
}
