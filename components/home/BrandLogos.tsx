interface BrandLogo {
  slug: string;
  name: string;
  width: number;
  height: number;
}

// Ancho/alto EXACTOS de cada PNG ya recortado a su propia caja de
// contenido (public/marcas/*-negro.png) — los archivos originales subidos
// venían los 7 en el mismo lienzo de 1160x648, pero el logo real ocupaba
// una porción de alto distinta dentro de ese lienzo en cada uno (de 102 a
// 143px). Usar el lienzo completo como aspect-ratio hubiera hecho que,
// aun con la misma altura de caja, cada logo se viera a un tamaño visual
// distinto (unos con más "aire" invisible arriba/abajo que otros). Se
// recortó cada PNG a su bounding box real (+6px de margen para no comerse
// el anti-aliasing) antes de subirlo aquí, así que este width/height ya
// es el del trazo real — mismo criterio que antes con los SVG de color,
// solo que ahora si importaba corregirlo primero. Orden pedido: Truper,
// Pretul, Foset, Volteck, Fiero, Hermex, Klintek.
const BRAND_LOGOS: BrandLogo[] = [
  { slug: "truper", name: "Truper", width: 852, height: 135 },
  { slug: "pretul", name: "Pretul", width: 730, height: 125 },
  { slug: "foset", name: "Foset", width: 777, height: 149 },
  { slug: "volteck", name: "Volteck", width: 852, height: 155 },
  { slug: "fiero", name: "Fiero", width: 729, height: 114 },
  { slug: "hermex", name: "Hermex", width: 808, height: 151 },
  { slug: "klintek", name: "Klintek", width: 725, height: 153 },
];

// Reemplaza a TrustBar (3 mensajes de texto con ícono) en el Home: Grupo
// Truper y sus 7 submarcas ya se reconocen por su propio logotipo, sin
// necesitar ningún texto de acompañamiento.
//
// Tratamiento de color vía máscara CSS (mask-image), no filtro: los 7 PNG
// son negro puro sobre transparente, así que cada logo es un <div> con
// background-color propio recortado por esa forma — el color en cada
// estado lo decidimos nosotros con un token real (bg-brand-slate /
// bg-brand-black), no lo "adivina" un filter: grayscale()/hue-rotate()
// aplicado sobre un PNG a color (que además, probado antes, resultó
// imposible de afinar bien: los filtros de Tailwind se combinan en un
// orden fijo interno sin importar el orden de las clases, así que un
// hue-rotate escrito "antes" de sepia en el className en realidad se
// aplicaba después y el tinte nunca salía correcto). Con mask-image el
// color es exacto y no depende de adivinar ningún filtro.
//
// role="img" + aria-label: un div con mask-image no tiene ningún texto
// alternativo propio (a diferencia de <img alt="...">) — sin esto, un
// lector de pantalla no anunciaría nada para cada logo.
//
// Móvil/tablet (<lg): carrusel de scroll-snap horizontal, altura cómoda
// para el dedo (h-12) — mismo patrón que Productos Destacados. Desktop
// (lg: 1024px+): los 7 SÍ caben en una sola línea, sin excepción — para
// lograrlo la altura baja a h-5 (20px). Es un cálculo, no un número al
// azar: la suma de aspect-ratio de los 7 logos es ~39.35, y en el ancho
// útil más angosto que puede dar "escritorio" (viewport de 1024px, menos
// el padding del contenedor del sitio) sobran ~960px — con el padding e
// líneas divisorias de cada logo, el máximo que cabe sin envolver es
// ~22px de alto; h-5 deja margen. Son wordmarks (no cajas de color como
// los logos SVG anteriores), bastante más anchos en proporción — por eso
// la altura tiene que ser chica para que las 7 quepan; a esa altura
// siguen siendo legibles porque son trazos gruesos (mismo criterio visual
// que cualquier franja de "distribuidor autorizado de" con varios logos).
export function BrandLogos() {
  return (
    <div>
      <p className="text-center font-sans text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
        Distribuidores autorizados de las 7 marcas de Grupo Truper
      </p>

      <div className="scrollbar-hide -mx-4 mt-4 flex snap-x items-center overflow-x-auto px-4 pb-2 lg:mx-0 lg:snap-none lg:flex-nowrap lg:justify-center lg:overflow-visible lg:px-0 lg:pb-0">
        {BRAND_LOGOS.map((brand) => (
          <div
            key={brand.slug}
            // border-r (no divide-x en el contenedor): con flex-wrap,
            // divide-x pone un borde-izquierdo a TODO menos al primer hijo
            // del DOM completo — el primer logo de una segunda línea, al
            // no ser "el primero" globalmente, heredaba una línea huérfana
            // a su izquierda que no correspondía a nada. Un borde a la
            // DERECHA de todos menos el último cae siempre al final de
            // cada fila, nunca como marca suelta al inicio de la
            // siguiente. Ya no aplica en desktop (lg:) porque ahí ya no
            // hay wrap — los 7 caben en una sola línea — pero se deja el
            // mismo mecanismo por si el viewport es MUY angosto en un
            // punto intermedio raro.
            className="flex shrink-0 snap-start items-center border-r border-brand-slate/15 px-4 last:border-r-0 lg:shrink lg:px-1.5"
          >
            <div
              role="img"
              aria-label={`Logo de ${brand.name}`}
              style={{
                aspectRatio: `${brand.width} / ${brand.height}`,
                WebkitMaskImage: `url(/marcas/${brand.slug}-negro.png)`,
                maskImage: `url(/marcas/${brand.slug}-negro.png)`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
              className="h-12 shrink-0 bg-brand-slate transition-colors duration-300 ease-out hover:bg-brand-black active:bg-brand-black lg:h-5"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
