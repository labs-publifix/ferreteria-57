"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_NAV_ITEMS } from "./nav-items";

// Ancho de la barra colapsada: suficiente para centrar un ícono de size-4
// con algo de aire (5rem = 80px) — no el mínimo posible, para que siga
// siendo un blanco de clic/toque cómodo, solo angosto de verdad frente a
// los 16rem de siempre.
const COLLAPSED_WIDTH = "w-20";
const EXPANDED_WIDTH = "w-64";
const COLLAPSED_PADDING = "md:pl-20 lg:pl-[calc(5rem+2rem)]";
const EXPANDED_PADDING = "md:pl-64 lg:pl-[calc(16rem+2rem)]";

// Recordado entre sesiones (localStorage, no cookie/DB): es una preferencia
// puramente visual de ESTE navegador, no un dato de cuenta que deba viajar
// entre dispositivos ni pasar por el servidor.
const STORAGE_KEY = "admin:sidebarCollapsed";

// Shell del panel: sidebar fija en escritorio, drawer superpuesto en
// móvil (mismo patrón de overlay + backdrop que el menú móvil de la
// tienda en Header.tsx, para no inventar una segunda forma de resolver lo
// mismo) — el admin puede ser denso en información (herramienta de
// trabajo, no la vitrina pública), pero el menú debe seguir siendo
// utilizable en un ancho de teléfono real.
//
// La barra fija de escritorio puede colapsarse a solo íconos para ganar
// espacio de contenido — el drawer de móvil NUNCA colapsa (es un overlay
// temporal, no compite por espacio de pantalla como la barra fija, así que
// colapsarlo no resolvería nada y solo restaría claridad).
export function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // El servidor no conoce localStorage, así que el primer render siempre
  // asume expandido (igual que el HTML que llegó por SSR) y esto lo
  // corrige apenas monta en el navegador — un solo parpadeo de un frame
  // para quien tenía la barra colapsada, no algo que valga la pena
  // complicar con un script anti-flash para una herramienta interna.
  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      {/* Sidebar fija: solo desde md, siempre visible, no compite con
          contenido (el <main> le deja el espacio exacto en cada estado,
          ver COLLAPSED_PADDING/EXPANDED_PADDING abajo). La transición de
          ancho es la misma duración que el padding de <main> para que
          ambos se muevan juntos, sin espacio muerto momentáneo. */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col bg-brand-slate transition-[width] duration-200 motion-reduce:transition-none md:flex ${
          collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
        }`}
      >
        <SidebarContent
          pathname={pathname}
          adminName={adminName}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          showCollapseToggle
        />
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
          depende de que ningún ancestro tenga overflow visible. Siempre
          expandido (collapsed=false fijo): ver nota arriba de por qué el
          drawer no colapsa. */}
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
              collapsed={false}
              showCollapseToggle={false}
              onNavigate={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      )}

      <main
        className={`p-4 transition-[padding] duration-200 motion-reduce:transition-none sm:p-6 lg:p-8 ${
          collapsed ? COLLAPSED_PADDING : EXPANDED_PADDING
        }`}
      >
        {children}
      </main>
    </div>
  );
}

// Posición calculada desde el propio ícono (getBoundingClientRect) en vez
// de un position:absolute anclado al link: SidebarContent vive dentro de
// un contenedor "overflow-y-auto" (para cuando el menú crezca más que el
// alto de pantalla) y CSS no permite overflow-x visible + overflow-y auto
// al mismo tiempo — cualquier tooltip absoluto que "se saliera" del
// sidebar hacia la derecha quedaría recortado. Un portal a document.body
// con position:fixed no tiene ese problema, sin importar qué overflow
// tenga cualquier ancestro.
interface TooltipState {
  label: string;
  top: number;
  left: number;
}

function SidebarContent({
  pathname,
  adminName,
  collapsed,
  showCollapseToggle,
  onToggleCollapsed,
  onNavigate,
}: {
  pathname: string;
  adminName: string;
  collapsed: boolean;
  showCollapseToggle: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  function showTooltip(label: string, target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 8 });
  }

  function hideTooltip() {
    setTooltip(null);
  }

  // Mantener presionado en móvil/tablet: un timer corto (no el long-press
  // "de sistema", que en un <a> dispara el menú contextual del navegador)
  // — soltar antes de que vaya a mostrarse simplemente no llega a
  // mostrarlo, y soltar después lo cierra pero deja que el toque siga
  // navegando normal (mantener presionado es para "espiar" el nombre de
  // la sección, no un gesto que deba bloquear la navegación normal).
  function handleTouchStart(label: string, target: HTMLElement) {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => showTooltip(label, target), 500);
  }

  function handleTouchEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    hideTooltip();
  }

  const toggleLabel = collapsed ? "Expandir menú" : "Colapsar menú";

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className={`flex items-center px-5 py-5 ${collapsed ? "justify-center px-3" : ""}`}>
        {collapsed ? (
          <Image
            src="/brand/isotipo.png"
            alt="Ferretería 57"
            width={983}
            height={983}
            className="size-8"
          />
        ) : (
          <Image
            src="/brand/logo-blanco.png"
            alt="Ferretería 57"
            width={983}
            height={302}
            className="h-9 w-auto"
          />
        )}
      </div>

      {showCollapseToggle && (
        <div className={`px-3 pb-2 ${collapsed ? "flex justify-center px-2" : ""}`}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-pressed={collapsed}
            aria-label={toggleLabel}
            onMouseEnter={(event) => collapsed && showTooltip(toggleLabel, event.currentTarget)}
            onMouseLeave={hideTooltip}
            onFocus={(event) => collapsed && showTooltip(toggleLabel, event.currentTarget)}
            onBlur={hideTooltip}
            onTouchStart={(event) =>
              collapsed && handleTouchStart(toggleLabel, event.currentTarget)
            }
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`flex min-h-11 w-full items-center gap-3 rounded-md font-sans text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              collapsed ? "justify-center px-2" : "px-3"
            }`}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="size-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
            )}
            {!collapsed && toggleLabel}
          </button>
        </div>
      )}

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
                  aria-label={item.label}
                  onMouseEnter={(event) => collapsed && showTooltip(item.label, event.currentTarget)}
                  onMouseLeave={hideTooltip}
                  onFocus={(event) => collapsed && showTooltip(item.label, event.currentTarget)}
                  onBlur={hideTooltip}
                  onTouchStart={(event) =>
                    collapsed && handleTouchStart(item.label, event.currentTarget)
                  }
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  className={`flex min-h-11 items-center gap-3 rounded-md border-l-4 font-sans text-sm font-medium transition-colors ${
                    collapsed ? "justify-center px-2" : "px-3"
                  } ${
                    isActive
                      ? "border-brand-orange bg-white/10 text-white"
                      : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
                  {!collapsed && item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={`border-t border-white/10 px-5 py-4 ${collapsed ? "px-2" : ""}`}>
        {!collapsed && (
          <p className="truncate font-sans text-sm font-semibold text-white">{adminName}</p>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          aria-label="Cerrar sesión"
          onMouseEnter={(event) => collapsed && showTooltip("Cerrar sesión", event.currentTarget)}
          onMouseLeave={hideTooltip}
          onFocus={(event) => collapsed && showTooltip("Cerrar sesión", event.currentTarget)}
          onBlur={hideTooltip}
          onTouchStart={(event) => collapsed && handleTouchStart("Cerrar sesión", event.currentTarget)}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className={`flex min-h-9 items-center gap-2 font-sans text-sm text-white/70 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-50 ${
            collapsed ? "mt-0 w-full justify-center" : "mt-2"
          }`}
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
          {!collapsed && (isSigningOut ? "Cerrando sesión…" : "Cerrar sesión")}
        </button>
      </div>

      {tooltip &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[100] -translate-y-1/2 whitespace-nowrap rounded-md bg-brand-black px-2.5 py-1.5 font-sans text-xs font-medium text-white shadow-lg"
            style={{ top: tooltip.top, left: tooltip.left }}
          >
            {tooltip.label}
          </div>,
          document.body
        )}
    </div>
  );
}
