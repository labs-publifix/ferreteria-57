import type { Metadata } from "next";
import Link from "next/link";
import { searchProducts } from "@/lib/catalog/queries";
import { ProductGrid } from "@/components/product/ProductGrid";

interface BuscarPageProps {
  searchParams: { q?: string | string[] };
}

function normalizeQuery(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ?? "";
}

export function generateMetadata({ searchParams }: BuscarPageProps): Metadata {
  const query = normalizeQuery(searchParams.q);
  return {
    title: query
      ? `Resultados para "${query}" — Ferretería 57`
      : "Buscar productos — Ferretería 57",
  };
}

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx. Misma capa de datos que /categoria/[slug]
// (lib/catalog/queries.ts): cuando conectemos Supabase, searchProducts
// cambia de cuerpo, no esta página.
export default async function BuscarPage({ searchParams }: BuscarPageProps) {
  const query = normalizeQuery(searchParams.q);

  if (!query) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="font-sans text-base text-brand-black">
          Escribe algo en la barra de búsqueda para encontrar productos.
        </p>
      </main>
    );
  }

  const results = await searchProducts(query);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 className="mb-6 font-display text-xl uppercase text-brand-slate sm:mb-8 sm:text-2xl">
        Resultados para “{query}”
      </h1>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-brand-gray px-6 py-16 text-center">
          <p className="font-sans text-base text-brand-black">
            No encontramos resultados para “{query}”. Prueba con otro término.
          </p>
          <Link
            href="/"
            className="font-sans text-sm font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
          >
            Volver al inicio
          </Link>
        </div>
      ) : (
        <ProductGrid products={results} />
      )}
    </main>
  );
}
