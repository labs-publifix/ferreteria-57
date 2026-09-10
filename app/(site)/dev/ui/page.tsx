import { Badge, Button, PriceTag, RatingStars } from "@/components/ui";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/catalog";

// Fijos aquí mismo (nunca desde Supabase): esta página es un preview
// estático del kit de componentes, no una pantalla real — no debe
// depender de que haya productos reales cargados para poder verificar
// visualmente ProductCard.
const previewProducts: Product[] = [
  {
    id: "preview-martillo",
    slug: "preview-martillo",
    name: "Martillo Truper 16 oz",
    brand: "Truper",
    categoryId: "herramienta",
    shortDescription: "Martillo de uña con mango de fibra de vidrio.",
    technicalSpecs: [],
    images: [],
    variants: [{ id: "v1", sku: "PREV-1", label: "Único", price: 299, stock: 24 }],
    rating: 4.3,
  },
  {
    id: "preview-taladro",
    slug: "preview-taladro",
    name: "Taladro/destornillador 1/2 pulgada, 20V, Truper",
    brand: "Truper",
    categoryId: "herramienta",
    shortDescription: "Taladro inalámbrico con mandril de 1/2 pulgada.",
    technicalSpecs: [],
    images: [],
    variants: [
      { id: "v2", sku: "PREV-2", label: "1 batería 2Ah", price: 1299, compareAtPrice: 1799, stock: 7 },
    ],
    rating: 4.7,
  },
  {
    id: "preview-candado",
    slug: "preview-candado",
    name: "Candado de seguridad 50mm con llave, Truper",
    brand: "Truper",
    categoryId: "cerrajeria",
    shortDescription: "Candado de seguridad con llave, cuerpo de acero.",
    technicalSpecs: [],
    images: [],
    variants: [{ id: "v3", sku: "PREV-3", label: "Único", price: 129, stock: 0 }],
  },
];

// Página de solo desarrollo: no es una pantalla real del e-commerce.
// Muestra todas las variantes del kit atómico juntas para verificarlas
// en un preview de Vercel antes de construir pantallas reales.
// Mobile-first: cada bloque se diseñó primero para ~375-425px y luego
// se expande con sm:/md:/lg: — nunca al revés.
// Header y Footer ya envuelven esta página desde app/layout.tsx (layout
// global), así que se ven junto con el kit en el mismo preview.

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 sm:mt-20">
      <h2 className="mb-4 font-display text-lg uppercase text-brand-slate sm:mb-6 sm:text-xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DevUiPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <header>
        <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
          Kit de componentes UI
        </h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-black sm:text-base">
          Vista de desarrollo — no es una pantalla real del sitio. Aquí se
          verifican Button, Badge, PriceTag, RatingStars y ProductCard antes
          de usarlos en pantallas reales.
        </p>
      </header>

      <Section title="Button">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button variant="primary">Agregar al carrito</Button>
          <Button variant="secondary">Ver detalles</Button>
          <Button variant="primary" disabled>
            Sin stock
          </Button>
          <Button variant="secondary" disabled>
            No disponible
          </Button>
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Ahorra 18%</Badge>
          <Badge>Ahorra 40%</Badge>
          <Badge>Nuevo</Badge>
        </div>
      </Section>

      <Section title="PriceTag">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-8">
          <PriceTag price={850} />
          <PriceTag price={850} previousPrice={1035} />
          <PriceTag price={1299} previousPrice={2599} />
        </div>
      </Section>

      <Section title="RatingStars">
        <div className="flex flex-col gap-3">
          {[0, 1, 2.5, 3.7, 5].map((value) => (
            <div key={value} className="flex items-center gap-3">
              <RatingStars value={value} />
              <span className="font-sans text-sm text-brand-slate">
                value={value}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="ProductCard">
        {/*
          Fila horizontal en todo ancho: en móvil es una franja con scroll
          horizontal (snap-x) — patrón intencional de "carrusel", no el
          overflow accidental que se evita en el resto del sitio. Desde sm
          se convierte en una fila normal que ya no necesita scroll.
        */}
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {previewProducts.map((product) => (
            <div
              key={product.id}
              className="flex w-64 shrink-0 snap-start sm:w-auto sm:shrink"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
