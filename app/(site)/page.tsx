import type { Metadata } from "next";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui";
import { BrandLogos } from "@/components/home/BrandLogos";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { LoyaltySection } from "@/components/home/LoyaltySection";
import { PromoRail } from "@/components/home/PromoRail";
import { StatsSection } from "@/components/home/StatsSection";
import { Testimonials } from "@/components/home/Testimonials";
import { VisitUs } from "@/components/home/VisitUs";
import { StickyRevealHeader } from "@/components/layout/StickyRevealHeader";
import { getVisiblePromoBanners } from "@/lib/marketing/queries";
import { getActiveCategories } from "@/lib/navigation/categories";
import { buildWebSiteJsonLd, SITE_URL } from "@/lib/seo";

// Solo agrega el canonical — título/descripción/Open Graph ya vienen del
// layout raíz (app/(site)/layout.tsx) ya orientados a "Ferretería 57",
// "Querétaro" y "Truper", y Next.js los conserva al fusionar metadata de
// layout con la de esta página (solo se pisa lo que se declara aquí).
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

// Home real del e-commerce. Header y Footer no se repiten aquí: ya envuelven
// esta página desde app/layout.tsx (layout global). Mobile-first: cada
// sección se pensó primero para ~375-425px y se expande con sm:/md:/lg:.
export default async function HomePage() {
  // Una sola consulta para las dos secciones que necesitan categorías
  // (StickyRevealHeader y CategoryGrid) — evita pedirlas dos veces.
  const categories = await getActiveCategories();
  const promoBanners = await getVisiblePromoBanners();
  const websiteJsonLd = buildWebSiteJsonLd();

  return (
    <main className="pb-14 sm:pb-20">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* La página no tenía ningún <h1> (todo el diseño visual arranca
          directo en las secciones, cada una con su propio h2) — este es
          el único, en sr-only para no alterar nada visual: cada página
          necesita exactamente un h1 real para SEO/accesibilidad, no solo
          un h2 como primer encabezado visible. */}
      <h1 className="sr-only">Ferretería 57 — Herramientas y materiales de ferretería en Querétaro</h1>

      {/* Solo en Home (por eso se monta aquí y no en el layout global) y
          solo desktop: barra condensada que aparece al hacer scroll hacia
          arriba, para no perder acceso rápido a búsqueda y categorías sin
          volver hasta el tope de la página (ver ese archivo). */}
      <StickyRevealHeader categories={categories} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Riel de tarjetas de promoción: reemplaza el carrusel de portada
            única. A diferencia de aquel (una sola imagen a pantalla
            completa), esto es un grupo de tarjetas más pequeñas — encaja
            mejor dentro del contenedor con max-width, como el resto de
            las secciones, que full-bleed. Sin ninguna tarjeta vigente, la
            sección entera desaparece — nunca un hueco vacío donde antes
            había contenido. */}
        {promoBanners.length > 0 && (
          <section className="mt-6 sm:mt-8">
            <PromoRail promos={promoBanners} />
          </section>
        )}

        <section className="mt-10 sm:mt-14" aria-label="Distribuidor autorizado de las submarcas de Grupo Truper">
          <BrandLogos />
        </section>

        <section className="mt-14 sm:mt-20" aria-labelledby="categorias-heading">
          <h2
            id="categorias-heading"
            className="mb-4 font-display text-lg uppercase text-brand-slate sm:mb-6 sm:text-xl"
          >
            Categorías
          </h2>
          <CategoryGrid categories={categories} />
        </section>

        <section className="mt-14 sm:mt-20" aria-labelledby="destacados-heading">
          <h2
            id="destacados-heading"
            className="mb-4 font-display text-lg uppercase text-brand-slate sm:mb-6 sm:text-xl"
          >
            Productos destacados
          </h2>
          <FeaturedProducts />
        </section>

        {/*
          Cifras de autoridad y reseñas reales van después de Productos
          destacados (el núcleo de compra ya quedó arriba, sin nada
          intercalado antes): primero se refuerza confianza con números y
          voces reales de clientes. Programa de Lealtad va antes de
          Visítanos — el acceso a Lealtad no debe quedar después del mapa,
          para que se vea antes de llegar al cierre informativo de
          ubicación/horario.
        */}
        <section className="mt-14 sm:mt-20" aria-label="Cifras de Ferretería 57">
          <StatsSection />
        </section>

        <section className="mt-14 sm:mt-20" aria-labelledby="resenas-heading">
          <div className="mb-4 flex flex-col items-center gap-2 text-center sm:mb-6">
            <Badge className="inline-flex items-center gap-1">
              5.0
              <Star className="size-3.5 fill-current" aria-hidden="true" />
              en Google
            </Badge>
            <h2
              id="resenas-heading"
              className="font-display text-lg uppercase text-brand-slate sm:text-xl"
            >
              Lo que dicen nuestros clientes
            </h2>
          </div>
          <Testimonials />
        </section>

        <section className="mt-14 sm:mt-20" aria-labelledby="club57-heading">
          <div className="mb-4 text-center sm:mb-6">
            <h2
              id="club57-heading"
              className="font-display text-lg uppercase text-brand-slate sm:text-xl"
            >
              Que cada compra te regrese algo
            </h2>
            <p className="mx-auto mt-2 max-w-prose font-sans text-sm text-brand-black/70 sm:text-base">
              Únete a Club 57 y cambia tus puntos por artículos Truper de regalo — sin costo, sin trámites.
            </p>
          </div>
          <LoyaltySection />
        </section>

        <section className="mt-14 sm:mt-20" aria-labelledby="visitanos-heading">
          <h2
            id="visitanos-heading"
            className="mb-4 font-display text-lg uppercase text-brand-slate sm:mb-6 sm:text-xl"
          >
            Visítanos
          </h2>
          <VisitUs />
        </section>
      </div>
    </main>
  );
}
