"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { categories } from "@/lib/navigation/categories";
import { useCart } from "@/components/cart/CartProvider";
import { SearchIcon, UserIcon, CartIcon, IconLink } from "./header-icons";

// Umbral en px: aproxima la altura total del Header original (barra de
// aviso + fila principal + fila de categorías). Por debajo de este punto el
// Header ya está a la vista de forma normal, así que esta barra condensada
// no tiene por qué aparecer todavía.
const REVEAL_THRESHOLD = 180;

// Patrón "estilo Amazon", solo para desktop y solo en Home (se monta desde
// app/page.tsx, no desde el layout global — así queda acotado al Home sin
// depender de usePathname). El Header original (components/layout/Header)
// no es sticky: al bajar simplemente se pierde de vista, sin cambios. Esta
// barra es un componente aparte, fixed y oculto (-translate-y-full) que
// solo se revela al detectar scroll hacia ARRIBA más allá de ese umbral,
// dando acceso rápido a búsqueda y categorías sin tener que volver al tope
// de la página. Vuelve a ocultarse si el scroll continúa hacia abajo o si
// se llega de nuevo cerca del tope (ahí ya se ve el Header real).
export function StickyRevealHeader() {
  const router = useRouter();
  const { totalQuantity } = useCart();
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const lastScrollY = useRef(0);
  const searchInputId = useId();

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`);
  }

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    function handleScroll() {
      const currentY = window.scrollY;
      const previousY = lastScrollY.current;

      if (currentY < REVEAL_THRESHOLD) {
        setVisible(false);
      } else if (currentY < previousY) {
        setVisible(true);
      } else if (currentY > previousY) {
        setVisible(false);
      }

      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // aria-hidden + tabIndex=-1 en cada control mientras está oculta: la barra
  // sigue existiendo en el DOM (fixed, fuera de pantalla) para poder
  // animarla, pero no debe ser alcanzable por teclado ni por lectores de
  // pantalla hasta que sea visible. motion-reduce:transition-none respeta
  // prefers-reduced-motion (guía de ui-ux-pro-max sobre sensibilidad al
  // movimiento): sin la transición, el cambio de estado sigue funcionando,
  // solo que sin animación.
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 top-0 z-40 hidden bg-brand-white shadow-md transition-transform duration-300 ease-out motion-reduce:transition-none md:block ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="border-b border-brand-slate/10 px-6 py-2.5 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link
            href="/"
            className="shrink-0"
            aria-label="Ferretería 57 — inicio"
            tabIndex={visible ? 0 : -1}
          >
            <Image
              src="/brand/logo-naranja.png"
              alt="Ferretería 57"
              width={983}
              height={302}
              className="h-9 w-auto"
            />
          </Link>

          <form
            role="search"
            onSubmit={handleSearchSubmit}
            className="relative flex-1"
          >
            <label htmlFor={searchInputId} className="sr-only">
              Buscar productos
            </label>
            <input
              id={searchInputId}
              type="search"
              placeholder="Buscar productos..."
              tabIndex={visible ? 0 : -1}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-brand-slate/30 bg-brand-white py-2 pl-4 pr-11 font-sans text-sm text-brand-black placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            />
            <button
              type="submit"
              aria-label="Buscar"
              tabIndex={visible ? 0 : -1}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-brand-slate hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            >
              <SearchIcon />
            </button>
          </form>

          <div className="flex items-center gap-2">
            <IconLink href="/cuenta" label="Cuenta" tabIndex={visible ? 0 : -1}>
              <UserIcon />
            </IconLink>
            <IconLink
              href="/carrito"
              label="Carrito de compras"
              badgeCount={totalQuantity > 0 ? totalQuantity : undefined}
              tabIndex={visible ? 0 : -1}
            >
              <CartIcon />
            </IconLink>
          </div>
        </div>
      </div>

      <nav aria-label="Navegación principal" className="bg-brand-white">
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-6 py-2 lg:px-8">
          {categories.map((category) => (
            <li key={category.href}>
              <Link
                href={category.href}
                tabIndex={visible ? 0 : -1}
                className="font-sans text-sm font-medium text-brand-slate hover:text-brand-black hover:underline underline-offset-4"
              >
                {category.label}
              </Link>
            </li>
          ))}
          <li className="ml-auto">
            <Link
              href="/cuenta"
              tabIndex={visible ? 0 : -1}
              className="flex items-center gap-1.5 rounded-full bg-brand-orange px-3 py-1 font-sans text-sm font-semibold text-brand-black transition-colors hover:bg-[#E65C00]"
            >
              <Gift className="size-4" aria-hidden="true" strokeWidth={1.75} />
              Programa de Lealtad
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
