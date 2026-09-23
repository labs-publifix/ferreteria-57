import Image from "next/image";
import Link from "next/link";
import {
  STORE_ADDRESS,
  STORE_FACEBOOK_URL,
  STORE_HORARIO,
  STORE_INSTAGRAM_URL,
  STORE_PHONE_DISPLAY,
  STORE_PHONE_TEL,
} from "@/lib/store-info";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function FacebookIcon() {
  return (
    <svg {...ICON_PROPS} className="size-5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M14 8.5h-1.5A1.5 1.5 0 0011 10v2m0 0H9.5m1.5 0v6.5M9.5 12H11" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg {...ICON_PROPS} className="size-5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-brand-slate text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start">
          <Image
            src="/brand/logo-blanco.png"
            alt="Ferretería 57"
            width={983}
            height={302}
            className="h-10 w-auto sm:h-12"
          />
          <p className="mt-3 font-sans text-sm text-white/85">
            {STORE_ADDRESS}
          </p>
          <a
            href={`tel:${STORE_PHONE_TEL}`}
            className="mt-2 inline-block font-sans text-sm text-white underline underline-offset-2"
          >
            {STORE_PHONE_DISPLAY}
          </a>
        </div>

        <div>
          <h2 className="font-display text-sm uppercase text-white">
            Horario de atención
          </h2>
          <ul className="mt-3 flex flex-col gap-1 font-sans text-sm text-white/85">
            {STORE_HORARIO.map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm uppercase text-white">
            Síguenos
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <a
              href={STORE_FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ferretería 57 en Facebook"
              className="flex size-11 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <FacebookIcon />
            </a>
            <a
              href={STORE_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ferretería 57 en Instagram"
              className="flex size-11 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <InstagramIcon />
            </a>
          </div>
        </div>
      </div>

      {/* Barra legal aparte de la grilla de 3 columnas de arriba: agregar
          una 4a columna ahí habría apretado ese layout ya verificado en
          tablet (sm:grid-cols-3); una franja inferior es el patrón más
          común para links legales y no toca nada existente. */}
      <div className="border-t border-white/15 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-2 font-sans text-xs text-white/70">
          <span className="uppercase tracking-wide">Legal:</span>
          <Link
            href="/aviso-privacidad"
            className="text-white underline underline-offset-2 hover:text-white/80"
          >
            Aviso de Privacidad
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/terminos"
            className="text-white underline underline-offset-2 hover:text-white/80"
          >
            Términos y Condiciones
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/politica-de-envios"
            className="text-white underline underline-offset-2 hover:text-white/80"
          >
            Política de Envíos
          </Link>
        </div>
      </div>
    </footer>
  );
}
