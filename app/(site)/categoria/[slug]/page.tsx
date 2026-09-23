import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveCategories } from "@/lib/navigation/categories";
import { getCategoryProducts } from "@/lib/catalog/queries";
import { CategoryProductBrowser } from "@/components/category/CategoryProductBrowser";
import { buildBreadcrumbJsonLd, SITE_URL } from "@/lib/seo";

interface CategoriaPageProps {
  params: { slug: string };
}

// Async porque getActiveCategories ya consulta Supabase (antes leía el
// arreglo estático de forma síncrona).
export async function generateMetadata({ params }: CategoriaPageProps): Promise<Metadata> {
  const categories = await getActiveCategories();
  const category = categories.find((item) => item.slug === params.slug);
  if (!category) return {};
  const title = `${category.label} — Ferretería 57`;
  const description = `Productos de ${category.label} en Ferretería 57, distribuidor autorizado Truper en Querétaro.`;
  // Canonical siempre a la URL limpia de la categoría — CategoryProductBrowser
  // filtra/ordena/pagina con estado de React, nunca con query params en la
  // URL (ver ese componente), así que hoy no hay variantes reales que
  // deduplicar; esto es la capa defensiva para cuando sí las haya.
  const canonicalUrl = `${SITE_URL}/categoria/${category.slug}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl },
  };
}

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx. Una categoría inactiva ya no aparece en
// getActiveCategories(), así que su página cae directo a notFound() —
// mismo resultado que si nunca hubiera existido.
export default async function CategoriaPage({ params }: CategoriaPageProps) {
  const categories = await getActiveCategories();
  const category = categories.find((item) => item.slug === params.slug);
  if (!category) notFound();

  const products = await getCategoryProducts(category.slug);

  // Refleja exactamente la misma ruta del <nav> de abajo (Inicio >
  // Categoría) — nunca una jerarquía distinta a la que el usuario ve y
  // puede navegar de verdad.
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", url: SITE_URL },
    { name: category.label, url: `${SITE_URL}/categoria/${category.slug}` },
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

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
