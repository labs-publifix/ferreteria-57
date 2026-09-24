import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { ProductCatalogProvider } from "@/components/cart/ProductCatalogProvider";
import { ToastProvider } from "@/components/ui";
import { getVisibleTopBanner } from "@/lib/marketing/queries";
import { getActiveCategories } from "@/lib/navigation/categories";

// Envoltura compartida entre app/(site)/layout.tsx y app/not-found.tsx (el
// 404 real para rutas que no matchean nada del sitio, ver ese archivo) —
// mismo Header/Footer/providers/categorías, para que un visitante que cae
// en un 404 vea exactamente el mismo sitio que cualquier otra página, en
// vez de una versión reducida sin carrito/cuenta/mega-menú. Cada uno de los
// dos sigue trayendo su propio <html>/<body> (Next.js no permite
// compartirlo entre "root layouts" paralelos vía route groups), esto solo
// factoriza lo de adentro.
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const categories = await getActiveCategories();
  const topBanner = await getVisibleTopBanner();

  return (
    // ToastProvider por fuera de CartProvider: el carrito dispara el toast
    // de confirmación (useToast) al agregar un producto, así que necesita
    // que el provider de toasts ya exista por encima. AuthProvider por
    // fuera de ambos: Header lee el estado de sesión para el ícono de
    // cuenta, sin depender de carrito ni toasts. ProductCatalogProvider por
    // fuera de CartProvider: el carrito necesita resolver producto/variante
    // de forma síncrona (ver ese archivo) contra el catálogo real, no
    // contra datos de prueba.
    <ToastProvider>
      <AuthProvider>
        <ProductCatalogProvider>
          <CartProvider>
            <Header categories={categories} topBanner={topBanner} />
            {children}
            <Footer categories={categories} />
            <WhatsAppButton />
          </CartProvider>
        </ProductCatalogProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
