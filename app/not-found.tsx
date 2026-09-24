import type { Metadata } from "next";
import Link from "next/link";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { SearchForm } from "@/components/layout/SearchForm";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { buttonClassName } from "@/components/ui";
import { inter, russoOne } from "@/lib/fonts";
import { getActiveCategories } from "@/lib/navigation/categories";
import { NO_INDEX } from "@/lib/seo";
import "./globals.css";

// 404 real a nivel de raíz de la app (fuera de app/(site) y app/(admin)):
// con "múltiples layouts raíz" vía route groups (ver esos dos layout.tsx),
// Next.js necesita este archivo explícito para cualquier URL que no
// matchee NADA del sitio — sin él, cae al 404 genérico interno de Next,
// sin <html>/<body>/CSS/fuentes propios (el "fondo en blanco" que se
// reportó). Sigue siendo un 404 HTTP real: Next.js App Router responde
// con status 404 automáticamente para cualquier not-found.tsx, sin nada
// que configurar aparte de que el archivo exista en el lugar correcto.
export const metadata: Metadata = {
  title: "Página no encontrada — Ferretería 57",
  description: "La página que buscas ya no existe o cambió de dirección.",
  robots: NO_INDEX,
};

export default async function NotFound() {
  const categories = await getActiveCategories();

  return (
    <html lang="es" className={`${inter.variable} ${russoOne.variable}`}>
      <body>
        <SiteChrome>
          <main className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-16 text-center sm:py-24">
            <div className="flex flex-col items-center gap-3">
              <span className="font-display text-5xl text-brand-orange sm:text-6xl">404</span>
              <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
                Esta página ya no existe o se movió
              </h1>
              <p className="max-w-prose font-sans text-sm text-brand-black sm:text-base">
                Es posible que el enlace esté desactualizado o que la página haya cambiado de
                dirección. Prueba buscando el producto que necesitas o entra a una categoría desde
                aquí abajo.
              </p>
            </div>

            <SearchForm className="w-full max-w-md" autoFocus />

            <Link href="/" className={buttonClassName("primary")}>
              Volver al inicio
            </Link>

            {categories.length > 0 && (
              <div className="w-full">
                <h2 className="mb-4 font-display text-lg uppercase text-brand-slate">
                  Categorías
                </h2>
                <CategoryGrid categories={categories} />
              </div>
            )}
          </main>
        </SiteChrome>
      </body>
    </html>
  );
}
