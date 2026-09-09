import { Badge, Button, PriceTag, RatingStars } from "@/components/ui";

// Página de solo desarrollo: no es una pantalla real del e-commerce.
// Muestra todas las variantes del kit atómico juntas para verificarlas
// en un preview de Vercel antes de construir pantallas reales.
// Mobile-first: cada bloque se diseñó primero para ~375-425px y luego
// se expande con sm:/md:/lg: — nunca al revés.

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

function PlaceholderImage() {
  return (
    <div
      className="flex aspect-square w-full items-center justify-center rounded-lg bg-brand-gray text-sm text-brand-slate/60"
      aria-hidden="true"
    >
      IMG
    </div>
  );
}

function ProductCardDemo({
  name,
  price,
  previousPrice,
  rating,
}: {
  name: string;
  price: number;
  previousPrice?: number;
  rating: number;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm">
      <div className="relative">
        <PlaceholderImage />
        {previousPrice && (
          <Badge className="absolute right-2 top-2">
            Ahorra {Math.round(((previousPrice - price) / previousPrice) * 100)}%
          </Badge>
        )}
      </div>
      <p className="font-sans text-sm text-brand-black sm:text-base">{name}</p>
      <RatingStars value={rating} />
      <PriceTag price={price} previousPrice={previousPrice} />
      <Button variant="primary" className="w-full">
        Agregar al carrito
      </Button>
    </div>
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
          verifican Button, Badge, PriceTag y RatingStars antes de usarlos
          en pantallas reales.
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
        <div className="relative mt-4 w-40 sm:w-48">
          <PlaceholderImage />
          <Badge className="absolute right-2 top-2">Ahorra 18%</Badge>
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

      <Section title="Composición: tarjeta de producto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProductCardDemo
            name='Martillo de uña 16 oz Truper'
            price={299}
            previousPrice={365}
            rating={4.3}
          />
          <ProductCardDemo
            name="Taladro inalámbrico 20V Truper"
            price={1299}
            rating={5}
          />
          <ProductCardDemo
            name="Juego de desarmadores 6 pzas"
            price={189}
            previousPrice={315}
            rating={3.6}
          />
        </div>
      </Section>
    </main>
  );
}
