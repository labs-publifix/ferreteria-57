import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getActiveCategories } from "@/lib/navigation/categories";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog/queries";
import { getApprovedReviews } from "@/lib/reviews/queries";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductGrid } from "@/components/product/ProductGrid";
import { buildBreadcrumbJsonLd, SITE_URL } from "@/lib/seo";

interface ProductoPageProps {
  params: { slug: string };
}

// Trunca en un espacio, no a la mitad de una palabra — 155 caracteres es
// el límite práctico antes de que Google empiece a cortar la meta
// description en el snippet de resultados.
function truncateDescription(text: string, maxLength = 155): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

export async function generateMetadata({ params }: ProductoPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};
  const title = `${product.name} — ${product.brand} | Ferretería 57`;
  const description = truncateDescription(product.shortDescription);
  const canonicalUrl = `${SITE_URL}/producto/${product.slug}`;
  // product.images ya son URLs absolutas de Supabase Storage (no rutas
  // relativas de /public), así que sirven tal cual como og:image sin
  // pasar por metadataBase — si el producto todavía no tiene fotos, se
  // omite y el sitio cae al og-image.jpg default del layout raíz.
  const primaryImage = product.images[0];
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      ...(primaryImage ? { images: [{ url: primaryImage, alt: `${product.name} — ${product.brand}` }] } : {}),
    },
    twitter: primaryImage
      ? { card: "summary_large_image", title, description, images: [primaryImage] }
      : undefined,
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
  const approvedReviews = await getApprovedReviews(product.id);
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
    ...(firstVariant?.sku ? { sku: firstVariant.sku } : {}),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/producto/${product.slug}`,
      price: firstVariant?.price ?? 0,
      priceCurrency: "MXN",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  // Misma ruta que el <nav> de abajo (Inicio > Categoría > Producto) —
  // sin categoría resuelta (no debería pasar, pero product.categoryId
  // podría no matchear ninguna activa) el breadcrumb se acorta a
  // Inicio > Producto en vez de inventar un tramo intermedio.
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", url: SITE_URL },
    ...(category ? [{ name: category.label, url: `${SITE_URL}${category.href}` }] : []),
    { name: product.name, url: `${SITE_URL}/producto/${product.slug}` },
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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
        <ProductGallery images={product.images} productName={product.name} brand={product.brand} />
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

      <ProductReviews
        productSlug={product.slug}
        rating={product.rating}
        reviewCount={product.reviewCount}
        reviews={approvedReviews}
      />

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
