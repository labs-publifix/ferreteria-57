import Link from "next/link";
import type { Category } from "@/lib/navigation/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";

// Un ícono por categoría en vez de fotografía (todavía no hay fotografía
// de categoría real). El ícono se resuelve por category.icon (nombre de
// componente lucide-react guardado en Supabase, ver lib/category-icons.ts)
// — nunca por el label en español, para que renombrar una categoría desde
// el admin no la deje sin ícono.
export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category.icon];
        return (
          <Link
            key={category.href}
            href={category.href}
            className="group flex flex-col items-center gap-2 rounded-lg p-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-brand-gray text-brand-slate transition-colors duration-200 group-hover:bg-brand-orange/15 group-hover:text-brand-orange group-active:bg-brand-orange/15 group-active:text-brand-orange">
              {Icon && <Icon className="size-7" aria-hidden="true" strokeWidth={1.75} />}
            </span>
            <span className="font-sans text-sm text-brand-black">{category.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
