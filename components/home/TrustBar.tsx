import { Award, BadgeCheck, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TrustPoint {
  icon: LucideIcon;
  text: string;
}

const points: TrustPoint[] = [
  { icon: BadgeCheck, text: "Distribuidor autorizado Truper" },
  { icon: Award, text: "Garantía real, no solo la del fabricante" },
  { icon: Tag, text: "Precio de mayoreo sin mínimo de compra" },
];

// Textos cortos (3-6 palabras): apilados en móvil alcanzan sin necesitar
// un carrusel adicional. Iconos en pizarra, no naranja — el naranja queda
// reservado a botones, badges de descuento y precios activos.
export function TrustBar() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
      {points.map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-gray text-brand-slate">
            <Icon className="size-5" aria-hidden="true" strokeWidth={1.75} />
          </span>
          <p className="font-sans text-sm text-brand-black">{text}</p>
        </div>
      ))}
    </div>
  );
}
