"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, Gift, LogOut, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface VendedorNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const VENDEDOR_NAV_ITEMS: VendedorNavItem[] = [
  { href: "/admin/vendedor/clientes", label: "Clientes", icon: Users },
  { href: "/admin/vendedor/catalogo", label: "Catálogo", icon: Gift },
  { href: "/admin/vendedor/canjes", label: "Canjes", icon: ClipboardList },
];

// Vista de vendedor: solo 3 secciones, así que un top bar + franja de
// pestañas es suficiente (nunca necesita colapsar ni un drawer como
// AdminShell) — pensado para usarse también en una tablet de piso de
// venta, por eso los objetivos táctiles de 44px y sin overflow horizontal
// desde 375px.
export function VendedorShell({
  staffName,
  children,
}: {
  staffName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      <header className="flex items-center gap-3 border-b border-brand-slate/10 bg-brand-slate px-4 py-3 sm:px-6">
        <Image
          src="/brand/logo-blanco.png"
          alt="Ferretería 57"
          width={983}
          height={302}
          className="h-8 w-auto"
        />
        <span className="ml-1 min-w-0 truncate font-sans text-sm font-medium text-white/80">
          {staffName}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="ml-auto flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 font-sans text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-50"
        >
          <LogOut className="size-4" aria-hidden="true" strokeWidth={1.75} />
          {isSigningOut ? "Cerrando…" : "Cerrar sesión"}
        </button>
      </header>

      <nav
        aria-label="Navegación de vendedor"
        className="flex gap-1 overflow-x-auto border-b border-brand-slate/10 bg-white px-2 sm:px-6"
      >
        {VENDEDOR_NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 font-sans text-sm font-medium transition-colors ${
                isActive
                  ? "border-brand-orange text-brand-black"
                  : "border-transparent text-brand-slate/70 hover:text-brand-black"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
