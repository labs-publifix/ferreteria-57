"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_NAV_ITEMS } from "./nav-items";

// Shell del panel: sidebar fija en escritorio, drawer superpuesto en
// móvil (mismo patrón de overlay + backdrop que el menú móvil de la
// tienda en Header.tsx, para no inventar una segunda forma de resolver lo
// mismo) — el admin puede ser denso en información (herramienta de
// trabajo, no la vitrina pública), pero el menú debe seguir siendo
// utilizable en un ancho de teléfono real.
export function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-gray">
      {/* Sidebar fija: solo desde md, siempre visible, no compite con
          contenido (el <main> le deja el espacio con md:pl-64). */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-slate md:flex">
        <SidebarContent pathname={pathname} adminName={adminName} />
      </aside>

      {/* Topbar: solo antes de md, con el botón que abre el drawer. */}
      <header className="flex items-center gap-3 border-b border-brand-slate/10 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <Image
          src="/brand/logo-naranja.png"
          alt="Ferretería 57"
          width={983}
          height={302}
          className="h-8 w-auto"
        />
      </header>

      {/* Drawer móvil: mismo criterio que el menú móvil de la tienda — no
          depende de que ningún ancestro tenga overflow visible. */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-brand-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-brand-slate">
            <div className="flex justify-end p-2">
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setMenuOpen(false)}
                className="flex size-11 items-center justify-center rounded-md text-white/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <SidebarContent
              pathname={pathname}
              adminName={adminName}
              onNavigate={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      )}

      <main className="p-4 sm:p-6 md:pl-64 lg:p-8 lg:pl-[calc(16rem+2rem)]">
        {children}
      </main>
    </div>
  );
}

function SidebarContent({
  pathname,
  adminName,
  onNavigate,
}: {
  pathname: string;
  adminName: string;
  onNavigate?: () => void;
}) {
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
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center px-5 py-5">
        <Image
          src="/brand/logo-blanco.png"
          alt="Ferretería 57"
          width={983}
          height={302}
          className="h-9 w-auto"
        />
      </div>

      <nav aria-label="Navegación del panel" className="flex-1 px-3">
        <ul className="flex flex-col gap-0.5">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-md border-l-4 px-3 font-sans text-sm font-medium transition-colors ${
                    isActive
                      ? "border-brand-orange bg-white/10 text-white"
                      : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="truncate font-sans text-sm font-semibold text-white">
          {adminName}
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="mt-2 flex min-h-9 items-center gap-2 font-sans text-sm text-white/70 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-50"
        >
          <LogOut className="size-4" aria-hidden="true" strokeWidth={1.75} />
          {isSigningOut ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
      </div>
    </div>
  );
}
