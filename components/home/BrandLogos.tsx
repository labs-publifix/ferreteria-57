import Image from "next/image";

interface BrandLogo {
  slug: string;
  name: string;
  width: number;
  height: number;
}

// Ancho/alto reales de cada SVG (public/marcas) — casi idénticos entre sí
// (144-145 x 81) pero no exactamente iguales, así que se usa el propio de
// cada archivo: next/image calcula el aspect-ratio real de cada logo en
// vez de forzar la misma caja y deformar alguno. El orden es el pedido
// (Truper, Pretul, Foset, Volteck, Fiero, Hermex, Klintek), el mismo en
// que llegaron numerados desde GitHub.
const BRAND_LOGOS: BrandLogo[] = [
  { slug: "truper", name: "Truper", width: 145, height: 81 },
  { slug: "pretul", name: "Pretul", width: 144, height: 81 },
  { slug: "foset", name: "Foset", width: 144, height: 81 },
  { slug: "volteck", name: "Volteck", width: 144, height: 81 },
  { slug: "fiero", name: "Fiero", width: 145, height: 81 },
  { slug: "hermex", name: "Hermex", width: 144, height: 81 },
  { slug: "klintek", name: "Klintek", width: 144, height: 81 },
];

// Reemplaza a TrustBar (3 mensajes de texto con ícono) en el Home: Grupo
// Truper y sus 7 submarcas ya se reconocen por su propio logo/color, sin
// necesitar ningún texto de acompañamiento. Cada SVG ya es un badge
// completo (trae su propio fondo de color y diseño) — este componente NO
// le agrega ningún marco/fondo adicional, solo el espaciado uniforme entre
// ellos.
//
// Móvil: mismo patrón de fila con scroll-snap que Productos Destacados
// (FeaturedProducts.tsx) — ancho de cada logo fijo por su propio contenido
// (shrink-0), bleed -mx-4/px-4 para que el corte del siguiente logo se
// vea justo en el borde de la pantalla como pista de que hay más. Desktop
// (sm:): una sola fila centrada que envuelve a una segunda línea si no
// caben los 7 (flex-wrap, no scroll ni grid de columnas fijas — un logo no
// es una tarjeta de producto, no necesita retícula).
export function BrandLogos() {
  return (
    <div className="scrollbar-hide -mx-4 flex snap-x items-center gap-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-x-10 sm:gap-y-4 sm:overflow-visible sm:px-0 sm:pb-0">
      {BRAND_LOGOS.map((brand) => (
        <div key={brand.slug} className="flex shrink-0 snap-start sm:shrink">
          <Image
            src={`/marcas/${brand.slug}.svg`}
            alt={`Logo de ${brand.name}`}
            width={brand.width}
            height={brand.height}
            className="h-12 w-auto sm:h-14"
          />
        </div>
      ))}
    </div>
  );
}
