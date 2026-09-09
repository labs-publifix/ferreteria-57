import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { PromoBanners } from "@/components/home/PromoBanners";

// Home real del e-commerce. Header y Footer no se repiten aquí: ya envuelven
// esta página desde app/layout.tsx (layout global). Mobile-first: cada
// sección se pensó primero para ~375-425px y se expande con sm:/md:/lg:.
export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <section aria-label="Promociones">
        <PromoBanners />
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
    </main>
  );
}
