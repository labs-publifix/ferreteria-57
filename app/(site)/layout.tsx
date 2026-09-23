import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { ProductCatalogProvider } from "@/components/cart/ProductCatalogProvider";
import { ToastProvider } from "@/components/ui";
import { inter, russoOne } from "@/lib/fonts";
import { getVisibleTopBanner } from "@/lib/marketing/queries";
import { getActiveCategories } from "@/lib/navigation/categories";
import { buildLocalBusinessJsonLd, OG_IMAGE_HEIGHT, OG_IMAGE_PATH, OG_IMAGE_WIDTH, SITE_URL } from "@/lib/seo";
import "../globals.css";

const title =
  "Ferretería 57 — Herramienta y ferretería en Querétaro | Distribuidor autorizado Truper";
// 147 caracteres, dentro del límite de 160.
const description =
  "Ferretería 57, distribuidor autorizado Truper en Querétaro. Herramienta y ferretería con asesoría experta y precio de mayoreo sin mínimo de compra.";

export const metadata: Metadata = {
  // SITE_URL lee NEXT_PUBLIC_SITE_URL (ver lib/seo.ts) — mientras
  // ferreteria57.com no resuelva, cae solo al dominio que Vercel ya
  // asigna a cada deployment. Sin metadataBase, Next.js resolvería las
  // imágenes Open Graph y los canonical contra localhost en vez del
  // sitio real.
  metadataBase: new URL(SITE_URL),
  title,
  description,
  // Página por página se agrega alternates.canonical (ver cada
  // generateMetadata) — este objeto solo cubre lo que de verdad es igual
  // en todo el sitio: título/descripción por default, y la imagen Open
  // Graph/Twitter que toda página hereda salvo que la reemplace (como
  // hace /producto/[slug] con la foto real del producto).
  openGraph: {
    title,
    description,
    url: SITE_URL,
    siteName: "Ferretería 57",
    locale: "es_MX",
    type: "website",
    images: [{ url: OG_IMAGE_PATH, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: "Ferretería 57" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [OG_IMAGE_PATH],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Categorías activas del catálogo real, resueltas una sola vez aquí y
  // pasadas como prop a Header (Client Component: no puede hacer su
  // propio await) — mismo dato que necesita el mega-menú y el menú móvil.
  const categories = await getActiveCategories();
  const topBanner = await getVisibleTopBanner();

  // HardwareStore: el mismo negocio en todas las páginas, así que vive
  // aquí (layout raíz) en vez de repetirse página por página — ver
  // lib/seo.ts para por qué HardwareStore y no un LocalBusiness genérico.
  const localBusinessJsonLd = buildLocalBusinessJsonLd();

  return (
    <html lang="es" className={`${inter.variable} ${russoOne.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        {/* ToastProvider por fuera de CartProvider: el carrito dispara el
            toast de confirmación (useToast) al agregar un producto, así
            que necesita que el provider de toasts ya exista por encima.
            AuthProvider por fuera de ambos: Header lee el estado de sesión
            para el ícono de cuenta, sin depender de carrito ni toasts.
            ProductCatalogProvider por fuera de CartProvider: el carrito
            necesita resolver producto/variante de forma síncrona (ver ese
            archivo) contra el catálogo real, no contra datos de prueba. */}
        <ToastProvider>
          <AuthProvider>
            <ProductCatalogProvider>
              <CartProvider>
                <Header categories={categories} topBanner={topBanner} />
                {children}
                <Footer />
                <WhatsAppButton />
              </CartProvider>
            </ProductCatalogProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
