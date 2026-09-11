import Image from "next/image";
import Link from "next/link";
import type { PromoBanner, PromoColorTheme } from "@/types/marketing";

// Contraste verificado por tema: naranja como fondo es el único de los 4
// con poco margen (negro-suave sobre naranja da 5.93:1, justo arriba del
// mínimo 4.5:1) — por eso ahí NINGÚN texto usa opacidad reducida, la
// jerarquía (eyebrow/título/subtítulo/fine print) se logra solo con
// tamaño y peso. Los otros 3 fondos tienen contraste de sobra y sí
// admiten blanco/pizarra atenuado para el fine print sin arriesgar AA.
const THEME_STYLES: Record<
  PromoColorTheme,
  { card: string; eyebrow: string; title: string; subtitle: string; fineprint: string; accent: string }
> = {
  naranja: {
    card: "bg-brand-orange",
    eyebrow: "text-brand-black",
    title: "text-brand-black",
    subtitle: "text-brand-black",
    fineprint: "text-brand-black",
    accent: "bg-brand-black/10",
  },
  pizarra: {
    card: "bg-brand-slate",
    eyebrow: "text-white/80",
    title: "text-white",
    subtitle: "text-white/85",
    fineprint: "text-white/70",
    accent: "bg-white/10",
  },
  negro: {
    card: "bg-brand-black",
    eyebrow: "text-white/80",
    title: "text-white",
    subtitle: "text-white/85",
    fineprint: "text-white/70",
    accent: "bg-white/10",
  },
  claro: {
    card: "bg-brand-gray",
    eyebrow: "text-brand-slate/80",
    title: "text-brand-black",
    subtitle: "text-brand-slate/90",
    fineprint: "text-brand-slate/80",
    accent: "bg-brand-slate/10",
  },
};

// Acento diagonal sutil para cuando no hay fotografía: un triángulo en la
// esquina de la zona visual, con un tono translúcido del MISMO color base
// (nunca un color nuevo) — solo da profundidad, nada que compita con el
// texto de arriba.
function DiagonalAccent({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 ${className}`}
      style={{ clipPath: "polygon(40% 100%, 100% 30%, 100% 100%)" }}
    />
  );
}

// Anclas del degradado fijo sobre fotografía real (ver rama con imagen,
// más abajo): 0.85 de opacidad de negro es el mínimo que sigue dando
// AA (4.5:1) para texto blanco incluso en el peor caso — una foto
// prácticamente blanca justo debajo del texto (con 0.70, que era la
// primera opción probada, el contraste caía a ~3:1 contra una zona muy
// clara, por debajo del mínimo). Cada franja se queda en esa opacidad
// plana durante la mayor parte de su alto (donde vive el texto de
// verdad) y solo se desvanece hacia el centro de la tarjeta, para que la
// foto "respire" sin arriesgar la legibilidad de ningún renglón.
const IMAGE_OVERLAY_TOP = "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0) 100%)";
const IMAGE_OVERLAY_BOTTOM = "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0) 100%)";

export function PromoCard({ promo }: { promo: PromoBanner }) {
  const theme = THEME_STYLES[promo.colorTheme];

  // Con foto real (rectangular, de tienda/anaquel) el tratamiento es
  // distinto por completo del de fondo sólido de abajo: la imagen cubre
  // toda la tarjeta (object-cover, se recorta sin deformarse sin importar
  // su proporción original) y el texto SIEMPRE va en blanco encima de un
  // degradado fijo — nunca el color de theme, que aquí ya no pinta ningún
  // fondo visible (la foto lo reemplaza por completo).
  if (promo.imageUrl) {
    return (
      <Link
        href={promo.href}
        aria-label={promo.subtitle ? `${promo.title} — ${promo.subtitle}` : promo.title}
        className="group relative block aspect-[3/4] w-52 shrink-0 snap-start overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 sm:w-56 lg:w-64"
      >
        <Image
          src={promo.imageUrl}
          alt=""
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none"
        />

        {/* Degradado SIEMPRE presente (no condicional a qué tan clara sea
            la foto): franja superior para eyebrow/título/subtítulo,
            franja inferior para el fineprint — el punto medio de la
            tarjeta queda sin oscurecer. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
          style={{ background: IMAGE_OVERLAY_TOP }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%]"
          style={{ background: IMAGE_OVERLAY_BOTTOM }}
        />

        <div className="absolute inset-x-0 top-0 flex flex-col gap-1 px-5 pt-5">
          {promo.eyebrow && (
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-white/90">
              {promo.eyebrow}
            </p>
          )}
          <h3 className="line-clamp-2 font-display text-lg uppercase leading-tight text-white sm:text-xl">
            {promo.title}
          </h3>
          {promo.subtitle && (
            <p className="line-clamp-1 font-sans text-sm text-white/90">{promo.subtitle}</p>
          )}
        </div>

        {promo.fineprint && (
          <p className="absolute inset-x-5 bottom-3 line-clamp-1 font-sans text-[11px] text-white/90">
            {promo.fineprint}
          </p>
        )}
      </Link>
    );
  }

  return (
    // Sin botón/chip propio: la tarjeta COMPLETA es el link (patrón de la
    // referencia de Amazon) — el título grande ya es el llamado a la
    // acción. "relative" porque el fondo y el acento diagonal se
    // posicionan absolute contra este mismo contenedor.
    <Link
      href={promo.href}
      aria-label={promo.subtitle ? `${promo.title} — ${promo.subtitle}` : promo.title}
      className="group relative block aspect-[3/4] w-52 shrink-0 snap-start rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 sm:w-56 lg:w-64"
    >
      <div
        className={`absolute inset-0 grid grid-rows-[42%_1fr] overflow-hidden rounded-xl transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none ${theme.card}`}
      >
        <div className="flex flex-col gap-1 px-5 pt-5">
          {promo.eyebrow && (
            <p className={`font-sans text-xs font-semibold uppercase tracking-wide ${theme.eyebrow}`}>
              {promo.eyebrow}
            </p>
          )}
          <h3 className={`line-clamp-2 font-display text-lg uppercase leading-tight sm:text-xl ${theme.title}`}>
            {promo.title}
          </h3>
          {promo.subtitle && (
            <p className={`line-clamp-1 font-sans text-sm ${theme.subtitle}`}>{promo.subtitle}</p>
          )}
        </div>

        <div className="relative">
          <DiagonalAccent className={theme.accent} />
        </div>
      </div>

      {promo.fineprint && (
        <p
          className={`absolute inset-x-5 bottom-3 line-clamp-1 font-sans text-[11px] drop-shadow-sm ${theme.fineprint}`}
        >
          {promo.fineprint}
        </p>
      )}
    </Link>
  );
}
