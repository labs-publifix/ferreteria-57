import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories } from "@/lib/navigation/categories";
import { getCategoryProducts } from "@/lib/catalog/queries";
import { CategoryProductBrowser } from "@/components/category/CategoryProductBrowser";

interface CategoriaPageProps {
  params: { slug: string };
}

export function generateMetadata({ params }: CategoriaPageProps): Metadata {
  const category = categories.find((item) => item.slug === params.slug);
  if (!category) return {};
  return {
    title: `${category.label} — Ferretería 57`,
    description: `Productos de ${category.label} en Ferretería 57, distribuidor autorizado Truper en Querétaro.`,
  };
}

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx. getCategoryProducts (lib/catalog/queries.ts) ya está
// pensada como si fuera una consulta real (async, misma firma) para que
// conectar Supabase más adelante solo cambie su cuerpo, no esta página.
export default async function CategoriaPage({ params }: CategoriaPageProps) {
  const category = categories.find((item) => item.slug === params.slug);
  if (!category) notFound();

  const products = await getCategoryProducts(category.slug);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <nav aria-label="Ruta de navegación" className="mb-4 font-sans text-sm text-brand-slate">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-brand-black hover:underline">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-brand-black">
            {category.label}
          </li>
        </ol>
      </nav>

      <h1 className="mb-6 font-display text-2xl uppercase text-brand-slate sm:mb-8 sm:text-3xl">
        {category.label}
      </h1>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-brand-gray px-6 py-16 text-center">
          <p className="font-sans text-base text-brand-black">
            Próximamente más productos en esta categoría.
          </p>
          <Link
            href="/"
            className="font-sans text-sm font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
          >
            Volver al inicio
          </Link>
        </div>
      ) : (
        <CategoryProductBrowser products={products} />
      )}
    </main>
  );
}
