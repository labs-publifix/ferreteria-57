import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getActiveCategories } from "@/lib/navigation/categories";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog/queries";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import { ProductGrid } from "@/components/product/ProductGrid";

interface ProductoPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ProductoPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};
  return {
    title: `${product.name} — Ferretería 57`,
    description: product.shortDescription,
  };
}

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx. Misma capa de datos que /categoria/[slug] y /buscar
// (lib/catalog/queries.ts): cuando conectemos Supabase, getProductBySlug /
// getRelatedProducts cambian de cuerpo, no esta página.
export default async function ProductoPage({ params }: ProductoPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const categories = await getActiveCategories();
  const category = categories.find((item) => item.slug === product.categoryId);
  const relatedProducts = await getRelatedProducts(product.categoryId, product.id);
  const firstVariant = product.variants[0];
  const inStock = (firstVariant?.stock ?? 0) > 0;

  // JSON-LD Product: dangerouslySetInnerHTML es el patrón recomendado por
  // Next.js para esto. JSON.stringify ya escapa comillas/backslashes —
  // el contenido ahora lo captura un admin real (antes salía de
  // mockProducts, dato propio del proyecto), pero sigue siendo texto
  // dentro de un <script type="application/ld+json">, no HTML/JS
  // ejecutable, así que no hay inyección posible por esta vía.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.images.length > 0 ? { image: product.images } : {}),
    description: product.shortDescription,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      price: firstVariant?.price ?? 0,
      priceCurrency: "MXN",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        aria-label="Ruta de navegación"
        className="mb-4 flex flex-wrap items-center gap-1 font-sans text-sm text-brand-slate"
      >
        <Link href="/" className="hover:text-brand-black hover:underline">
          Inicio
        </Link>
        <span aria-hidden="true">/</span>
        {category && (
          <>
            <Link href={category.href} className="hover:text-brand-black hover:underline">
              {category.label}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        {/* Sin line-clamp: el nombre completo del producto va en el
            breadcrumb aunque el resto de sus segmentos queden en la línea
            de arriba (flex-wrap), a diferencia del truncado de ProductCard. */}
        <span aria-current="page" className="text-brand-black">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} productName={product.name} />
        <ProductPurchasePanel product={product} />
      </div>

      <section className="mt-14 sm:mt-20" aria-labelledby="ficha-tecnica-heading">
        <h2
          id="ficha-tecnica-heading"
          className="mb-4 font-display text-lg uppercase text-brand-slate sm:mb-6 sm:text-xl"
        >
          Ficha técnica
        </h2>
        <p className="mb-6 max-w-prose font-sans text-sm text-brand-black sm:text-base">
          {product.shortDescription}
        </p>
        {product.technicalSpecs.length > 0 && (
          <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {product.technicalSpecs.map((spec) => (
              <div
                key={spec.label}
                className="flex justify-between gap-4 border-b border-brand-slate/10 py-2.5"
              >
                <dt className="font-sans text-sm font-semibold text-brand-black">
                  {spec.label}
                </dt>
                <dd className="font-sans text-sm text-brand-slate">{spec.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {product.specSheetUrl && (
          <a
            href={product.specSheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
          >
            Ver ficha técnica completa en Truper
            <ArrowUpRight className="size-4" aria-hidden="true" strokeWidth={2} />
          </a>
        )}
      </section>

      {relatedProducts.length > 0 && (
        <section className="mt-14 sm:mt-20" aria-labelledby="relacionados-heading">
          <h2
            id="relacionados-heading"
            className="mb-4 font-display text-lg uppercase text-brand-slate sm:mb-6 sm:text-xl"
          >
            Productos relacionados
          </h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </main>
  );
}
