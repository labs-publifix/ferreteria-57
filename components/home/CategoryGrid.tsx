import Link from "next/link";
import {
  Cog,
  Droplets,
  Hammer,
  KeyRound,
  Lightbulb,
  PaintBucket,
  ShieldCheck,
  Sprout,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { categories } from "@/lib/navigation/categories";

// Un ícono por categoría en vez de fotografía (todavía no hay fotografía de
// categoría real). Mapeado por nombre exacto de lib/navigation/categories.ts
// — esa lista no se duplica aquí, solo se decora con un ícono.
const categoryIcons: Record<string, LucideIcon> = {
  Iluminación: Lightbulb,
  Eléctrico: Zap,
  Herramienta: Wrench,
  Jardinería: Sprout,
  Seguridad: ShieldCheck,
  Mecánica: Cog,
  Pintura: PaintBucket,
  Cerrajería: KeyRound,
  Herrería: Hammer,
  Plomería: Droplets,
};

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
      {categories.map((category) => {
        const Icon = categoryIcons[category.label];
        return (
          <Link
            key={category.href}
            href={category.href}
            className="flex flex-col items-center gap-2 rounded-lg p-3 text-center transition-colors hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-brand-gray text-brand-slate">
              {Icon && <Icon className="size-7" aria-hidden="true" strokeWidth={1.75} />}
            </span>
            <span className="font-sans text-sm text-brand-black">
              {category.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
