"use client";

import Image from "next/image";
import Link from "next/link";
import { Gift } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { categories } from "@/lib/navigation/categories";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function SearchIcon() {
  return (
    <svg {...ICON_PROPS} className="size-5" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg {...ICON_PROPS} className="size-5" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.4 4.4-5.5 7.5-5.5s6.1 2.1 7.5 5.5" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg {...ICON_PROPS} className="size-5" aria-hidden="true">
      <path d="M4 6h2l1.2 10.4a2 2 0 002 1.6h7.6a2 2 0 002-1.85L20 9H6.2" />
      <circle cx="10" cy="21" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="17" cy="21" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg {...ICON_PROPS} className="size-5" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg {...ICON_PROPS} className="size-5" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// Botón de icono base: 44x44 mínimo (target táctil), foco visible.
// Todos son <Link> a rutas reales del sitio, aunque la página de destino
// todavía no exista (mismo criterio que las categorías).
// badgeCount es estático por ahora (sin lógica de carrito todavía): un solo
// aria-label coherente en el Link en vez de que el badge visual compita con
// su propio anuncio de lector de pantalla.
function IconLink({
  href,
  label,
  badgeCount,
  children,
}: {
  href: string;
  label: string;
  badgeCount?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={
        typeof badgeCount === "number" ? `${label} (${badgeCount})` : label
      }
      className="flex size-11 items-center justify-center rounded-md text-brand-slate transition-colors hover:bg-brand-gray hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2"
    >
      <span className="relative flex items-center justify-center">
        {children}
        {typeof badgeCount === "number" && (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold leading-none text-brand-black"
          >
            {badgeCount}
          </span>
        )}
      </span>
    </Link>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputId = useId();
  const mobileMenuId = useId();

  // Cerrar el menú móvil con Escape: toda acción debe poder hacerse sin
  // apuntador (guía de navegación por teclado consultada en ui-ux-pro-max).
  useEffect(() => {
    if (!menuOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <header className="bg-brand-white">
      {/* Announcement bar */}
      <div className="bg-brand-slate px-4 py-1.5 text-center font-sans text-xs leading-snug text-white sm:text-sm">
        Envío gratis en compras mayores a $950 MXN — Atención a clientes:{" "}
        <a href="tel:+524427782708" className="underline underline-offset-2">
          442 778 2708
        </a>
      </div>

      {/* Header principal */}
      <div className="border-b border-brand-slate/10 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-2 sm:gap-4">
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 md:hidden"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls={mobileMenuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          <Link href="/" className="shrink-0" aria-label="Ferretería 57 — inicio">
            <Image
              src="/brand/logo-naranja.png"
              alt="Ferretería 57"
              width={983}
              height={302}
              priority
              className="h-8 w-auto sm:h-10"
            />
          </Link>

          {/* Búsqueda: visible siempre desde sm, icono expandible antes de sm */}
          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="hidden flex-1 sm:block"
          >
            <label htmlFor={searchInputId} className="sr-only">
              Buscar productos
            </label>
            <input
              id={searchInputId}
              type="search"
              placeholder="Buscar productos..."
              className="w-full rounded-md border border-brand-slate/30 bg-brand-white px-4 py-2 font-sans text-sm text-brand-black placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            />
          </form>

          <div className="ml-auto flex items-center gap-1 sm:ml-0 sm:gap-2">
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 sm:hidden"
              aria-label={searchOpen ? "Cerrar búsqueda" : "Buscar"}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((open) => !open)}
            >
              <SearchIcon />
            </button>
            <IconLink href="/cuenta" label="Cuenta">
              <UserIcon />
            </IconLink>
            <IconLink href="/carrito" label="Carrito de compras" badgeCount={0}>
              <CartIcon />
            </IconLink>
          </div>
        </div>

        {/* Búsqueda colapsada: solo antes de sm, cuando el ícono se activa */}
        {searchOpen && (
          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-3 max-w-6xl sm:hidden"
          >
            <label htmlFor={`${searchInputId}-mobile`} className="sr-only">
              Buscar productos
            </label>
            <input
              id={`${searchInputId}-mobile`}
              type="search"
              placeholder="Buscar productos..."
              autoFocus
              className="w-full rounded-md border border-brand-slate/30 bg-brand-white px-4 py-2 font-sans text-sm text-brand-black placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            />
          </form>
        )}
      </div>

      {/* Mega-menú: fila horizontal desde md, oculto en móvil */}
      <nav
        aria-label="Navegación principal"
        className="hidden border-b border-brand-slate/10 bg-brand-white md:block"
      >
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2.5 sm:px-6 lg:px-8">
          {categories.map((category) => (
            <li key={category.href}>
              <Link
                href={category.href}
                className="font-sans text-sm font-medium text-brand-slate hover:text-brand-black hover:underline underline-offset-4"
              >
                {category.label}
              </Link>
            </li>
          ))}
          {/*
            Programa de Lealtad no es una categoría de producto: se separa
            del resto con ml-auto (queda al otro extremo de la fila) y con
            una píldora de fondo naranja (como Badge), no texto naranja sobre
            blanco — ese combo da ~2.94:1 de contraste, por debajo del
            mínimo, el mismo hallazgo que ya vimos con el botón primario.
          */}
          <li className="ml-auto">
            <Link
              href="/cuenta"
              className="flex items-center gap-1.5 rounded-full bg-brand-orange px-3 py-1 font-sans text-sm font-semibold text-brand-black transition-colors hover:bg-[#E65C00]"
            >
              <Gift className="size-4" aria-hidden="true" strokeWidth={1.75} />
              Programa de Lealtad
            </Link>
          </li>
        </ul>
      </nav>

      {/* Menú móvil: overlay fijo, categorías apiladas — no depende de que
          ningún ancestro tenga overflow visible (guía de Impeccable sobre
          overlays que deben escapar su contenedor). */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-brand-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id={mobileMenuId}
            aria-label="Navegación principal"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-brand-white p-4 shadow-lg"
          >
            <div className="flex items-center justify-between pb-2">
              <span className="font-display text-sm uppercase text-brand-slate">
                Categorías
              </span>
              <button
                type="button"
                aria-label="Cerrar menú"
                className="flex size-11 items-center justify-center rounded-md text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                onClick={() => setMenuOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Mismo tratamiento que en escritorio: píldora naranja con
                ícono, separado de las categorías con su propio margen. */}
            <Link
              href="/cuenta"
              onClick={() => setMenuOpen(false)}
              className="mb-3 flex min-h-11 items-center gap-1.5 rounded-full bg-brand-orange px-3 font-sans text-sm font-semibold text-brand-black"
            >
              <Gift className="size-4" aria-hidden="true" strokeWidth={1.75} />
              Programa de Lealtad
            </Link>

            <ul className="flex flex-col">
              {categories.map((category) => (
                <li key={category.href}>
                  <Link
                    href={category.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-11 items-center border-b border-brand-slate/10 font-sans text-base text-brand-black"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
