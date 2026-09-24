import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/navigation/categories";
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

// categories: mismo arreglo que ya resuelve SiteChrome para el Header (ver
// ese archivo) — se reusa aquí en vez de hardcodear los 10 links, para que
// la columna de categorías nunca pueda desincronizarse de lo que el admin
// tiene activo/renombrado/reordenado en Supabase (sería una tercera fuente
// de verdad además de Header y CategoryGrid).
export function Footer({ categories }: { categories: Category[] }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-slate text-white">
      {/* 4 columnas en desktop, 2 en tablet, 1 en móvil — el orden en el
          markup ya es el orden de lectura deseado (Marca, Categorías,
          Horario+Síguenos, Club 57), así que no hace falta reordenar nada
          por breakpoint. */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {/* 1. Marca */}
        <div className="flex flex-col items-start">
          <Image
            src="/brand/logo-blanco.png"
            alt="Ferretería 57"
            width={983}
            height={302}
            className="h-10 w-auto sm:h-12"
          />
          <p className="mt-3 font-sans text-sm text-white/85">{STORE_ADDRESS}</p>
          <a
            href={`tel:${STORE_PHONE_TEL}`}
            className="mt-2 inline-block font-sans text-sm text-white underline underline-offset-2"
          >
            {STORE_PHONE_DISPLAY}
          </a>
        </div>

        {/* 2. Categorías — texto ancla real (nombre de categoría), nunca
            "ver más": son los links con más valor de SEO interno de todo
            el footer, uno por cada página de categoría indexable. */}
        {categories.length > 0 && (
          <div>
            <h2 className="font-display text-sm uppercase text-white">Categorías</h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-sans text-sm text-white/85">
              {categories.map((category) => (
                <li key={category.href}>
                  <Link
                    href={category.href}
                    className="transition-colors hover:text-white hover:underline underline-offset-2"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Horario + Síguenos — mismo contenido/markup que ya existía,
            solo se agrupan en un único div para caber en un solo slot del
            grid de 4 columnas (antes eran 2 columnas separadas de una
            grilla de 3). */}
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-display text-sm uppercase text-white">Horario de atención</h2>
            <ul className="mt-3 flex flex-col gap-1 font-sans text-sm text-white/85">
              {STORE_HORARIO.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm uppercase text-white">Síguenos</h2>
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

        {/* 4. Club 57 */}
        <div>
          <h2 className="font-display text-sm uppercase text-white">Club 57</h2>
          <p className="mt-3 font-sans text-sm text-white/85">Gana puntos en cada compra.</p>
          <Link
            href="/cuenta"
            className="mt-2 inline-block font-sans text-sm font-semibold text-brand-orange underline underline-offset-2 hover:text-[#ffb066]"
          >
            Conoce Club 57
          </Link>
        </div>
      </div>

      {/* Barra inferior: copyright + legal a la izquierda (mismos 3 links
          de siempre, mismos hrefs/labels/estilos — solo se agregó el
          copyright, que antes no existía), crédito de desarrollo a la
          derecha. Separada del grid de arriba con un borde sutil, mismo
          patrón que ya tenía la franja legal. Se queda apilada (flex-col)
          hasta lg: en vez de sm: — en el rango intermedio (~640-1024px) no
          cabe "Sitio desarrollado por LABS by Publifix" en una sola línea
          junto a los links legales sin partirse en dos, y partido choca con
          el botón flotante de WhatsApp (fixed bottom-6 right-4/6, size-14 —
          ver WhatsAppButton) aunque haya padding de sobra. lg:pr-24 reserva
          el espacio real de ese botón para cuando sí va en fila: antes esta
          franja no tenía nada del lado derecho, así que nunca chocaba; el
          crédito nuevo sí cae justo en esa esquina si no se le hace
          espacio. */}
      <div className="border-t border-white/15 px-4 py-4 sm:px-6 lg:px-8 lg:pr-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 font-sans text-xs text-white/70 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <span>© {currentYear} Ferretería 57. Todos los derechos reservados.</span>
            <span aria-hidden="true">·</span>
            <Link
              href="/aviso-privacidad"
              className="text-white underline underline-offset-2 hover:text-white/80"
            >
              Aviso de Privacidad
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/terminos" className="text-white underline underline-offset-2 hover:text-white/80">
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

          {/* Dofollow a propósito (sin rel="nofollow"/"sponsored"/"ugc") y
              sin "noreferrer" (a diferencia de Facebook/Instagram arriba):
              el desarrollador quiere que el referrer sí pase, para poder
              atribuir el tráfico que llega desde este crédito. */}
          <a
            href="https://labs.publifix.net"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 text-white/60 transition-colors hover:text-white/90"
          >
            Sitio desarrollado por
            {/* TODO: reemplazar por el <Image> del logo de LABS by
                Publifix en cuanto se reciba el archivo (~20-24px de alto,
                en /public) — ver conversación, el adjunto no llegó. */}
            <span className="font-semibold text-white/80">LABS by Publifix</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
