import Link from "next/link";

// Iconos e IconLink compartidos entre Header (barra principal) y
// StickyRevealHeader (barra condensada que aparece al subir en desktop, ver
// ese archivo). Extraídos aquí para no duplicar la misma implementación en
// dos componentes: cualquier ajuste de estilo/accesibilidad se hace una
// sola vez.
export const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SearchIcon() {
  return (
    <svg {...ICON_PROPS} className="size-5" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg {...ICON_PROPS} className="size-5" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.4 4.4-5.5 7.5-5.5s6.1 2.1 7.5 5.5" />
    </svg>
  );
}

export function CartIcon() {
  return (
    <svg {...ICON_PROPS} className="size-5" aria-hidden="true">
      <path d="M4 6h2l1.2 10.4a2 2 0 002 1.6h7.6a2 2 0 002-1.85L20 9H6.2" />
      <circle cx="10" cy="21" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="17" cy="21" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Botón de icono base: 44x44 mínimo (target táctil), foco visible.
// Todos son <Link> a rutas reales del sitio, aunque la página de destino
// todavía no exista (mismo criterio que las categorías).
// badgeCount es estático por ahora (sin lógica de carrito todavía): un solo
// aria-label coherente en el Link en vez de que el badge visual compita con
// su propio anuncio de lector de pantalla.
// signedIn refleja el estado de sesión de Supabase (ver AuthProvider): el
// ícono pasa de pizarra a negro-suave (más "presente") y se agrega un
// punto naranja de fondo sólido — nunca naranja como color de ícono/texto
// en primer plano, ese combo no llega al contraste mínimo (mismo hallazgo
// que ya motivó el patrón de píldora en el link de Lealtad). El punto es
// un refuerzo visual, no la única señal: el aria-label también cambia.
// tabIndex es opcional: StickyRevealHeader lo pone en -1 mientras la barra
// está oculta fuera de pantalla, para que Tab no salte a controles
// invisibles.
export function IconLink({
  href,
  label,
  badgeCount,
  signedIn,
  tabIndex,
  children,
}: {
  href: string;
  label: string;
  badgeCount?: number;
  signedIn?: boolean;
  tabIndex?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      tabIndex={tabIndex}
      aria-label={
        typeof badgeCount === "number"
          ? `${label} (${badgeCount})`
          : signedIn
            ? `${label} — sesión iniciada`
            : label
      }
      className={`flex size-11 items-center justify-center rounded-md transition-colors hover:bg-brand-gray hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 ${
        signedIn ? "text-brand-black" : "text-brand-slate"
      }`}
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
        {signedIn && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-brand-orange ring-2 ring-brand-white"
          />
        )}
      </span>
    </Link>
  );
}
