import Link from "next/link";
import { buttonClassName } from "@/components/ui";

interface PromoBanner {
  id: string;
  gradientClassName: string;
  eyebrow: string;
  href: string;
}

// Arte de campaña pendiente: estos dos bloques son marcadores de posición
// con gradiente (tokens de marca) hasta que llegue la fotografía real.
// Reemplazar cuando exista: quitar gradientClassName y usar una imagen de
// fondo real, el resto del layout (texto, botón) no debería tener que
// cambiar.
const banners: PromoBanner[] = [
  {
    id: "campana-1",
    gradientClassName: "bg-gradient-to-r from-brand-slate to-brand-black",
    eyebrow: "Banner de campaña — arte pendiente",
    href: "/promociones",
  },
  {
    id: "campana-2",
    // Naranja con moderación: solo el extremo del gradiente, nunca la
    // mayoría del área del banner (regla de marca: naranja no es fondo
    // extenso).
    gradientClassName:
      "bg-gradient-to-r from-brand-slate via-brand-slate to-brand-orange/40",
    eyebrow: "Banner de campaña — arte pendiente",
    href: "/promociones",
  },
];

export function PromoBanners() {
  return (
    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
      {banners.map((banner) => (
        <div
          key={banner.id}
          className={`flex w-[85%] shrink-0 snap-center flex-col justify-center gap-3 rounded-xl p-6 sm:w-auto sm:shrink sm:p-8 ${banner.gradientClassName}`}
          style={{ minHeight: "12rem" }}
        >
          <p className="max-w-[70%] font-display text-lg uppercase text-white sm:text-xl">
            {banner.eyebrow}
          </p>
          <div>
            <Link href={banner.href} className={buttonClassName("primary")}>
              Ver más
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
