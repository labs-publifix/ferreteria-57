import { Star } from "lucide-react";
import { Badge } from "@/components/ui";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { LoyaltySection } from "@/components/home/LoyaltySection";
import { PromoRail } from "@/components/home/PromoRail";
import { StatsSection } from "@/components/home/StatsSection";
import { Testimonials } from "@/components/home/Testimonials";
import { TrustBar } from "@/components/home/TrustBar";
import { VisitUs } from "@/components/home/VisitUs";
import { StickyRevealHeader } from "@/components/layout/StickyRevealHeader";

// Home real del e-commerce. Header y Footer no se repiten aquí: ya envuelven
// esta página desde app/layout.tsx (layout global). Mobile-first: cada
// sección se pensó primero para ~375-425px y se expande con sm:/md:/lg:.
export default function HomePage() {
  return (
    <main className="pb-14 sm:pb-20">
      {/* Solo en Home (por eso se monta aquí y no en el layout global) y
          solo desktop: barra condensada que aparece al hacer scroll hacia
          arriba, para no perder acceso rápido a búsqueda y categorías sin
          volver hasta el tope de la página (ver ese archivo). */}
      <StickyRevealHeader />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Riel de tarjetas de promoción: reemplaza el carrusel de portada
            única. A diferencia de aquel (una sola imagen a pantalla
            completa), esto es un grupo de tarjetas más pequeñas — encaja
            mejor dentro del contenedor con max-width, como el resto de
            las secciones, que full-bleed. */}
        <section className="mt-6 sm:mt-8">
          <PromoRail />
        </section>

        <section className="mt-10 sm:mt-14" aria-label="Por qué comprar con nosotros">
          <TrustBar />
        </section>

        <section className="mt-14 sm:mt-20" aria-labelledby="categorias-heading">
          <h2
            id="categorias-heading"
            className="mb-4 font-display text-lg uppercase text-brand-slate sm:mb-6 sm:text-xl"
          >
            Categorías
          </h2>
          <CategoryGrid />
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

        <section className="mt-14 sm:mt-20">
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
