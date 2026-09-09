import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { LoyaltySection } from "@/components/home/LoyaltySection";
import { PromoBanners } from "@/components/home/PromoBanners";
import { TrustBar } from "@/components/home/TrustBar";
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

      {/* Full-bleed: fuera del contenedor con max-width para ocupar todo el
          ancho de la pantalla, a diferencia de las secciones de abajo. */}
      <PromoBanners />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
          Después de Productos destacados, antes del Footer: primero se
          navega la tienda, y se cierra con la invitación al programa —
          el flujo habitual de "explora, luego únete" en vez de interrumpir
          la sección de compra con esto en medio.
        */}
        <section className="mt-14 sm:mt-20">
          <LoyaltySection />
        </section>
      </div>
    </main>
  );
}
