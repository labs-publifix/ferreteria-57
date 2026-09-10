import type { Metadata } from "next";
import { Inter, Russo_One } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { CartProvider } from "@/components/cart/CartProvider";
import { ToastProvider } from "@/components/ui";
import "./globals.css";

// Cargadas con next/font/google: self-hosted en build, cero layout shift,
// sin <link> externo a Google Fonts (lineamiento de la skill ui-ux-pro-max
// para el stack Next.js).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const russoOne = Russo_One({
  subsets: ["latin"],
  weight: "400", // Russo One solo existe en un peso.
  variable: "--font-russo-one",
  display: "swap",
});

const title =
  "Ferretería 57 — Herramienta y ferretería en Querétaro | Distribuidor autorizado Truper";
// 147 caracteres, dentro del límite de 160.
const description =
  "Ferretería 57, distribuidor autorizado Truper en Querétaro. Herramienta y ferretería con asesoría experta y precio de mayoreo sin mínimo de compra.";

export const metadata: Metadata = {
  // Se asume el dominio real del cliente (ya usado en su correo de
  // contacto, contacto@ferreteria57.com). Ajustar aquí si el dominio final
  // conectado a Vercel termina siendo otro — sin esto, Next.js resuelve las
  // imágenes Open Graph contra localhost en vez del sitio real.
  metadataBase: new URL("https://ferreteria57.com"),
  title,
  description,
  openGraph: {
    title,
    description,
    locale: "es_MX",
    type: "website",
    // Sin fotografía de campaña todavía: el logotipo real hace de imagen
    // og provisional.
    images: [
      {
        url: "/brand/logo-naranja.png",
        width: 983,
        height: 302,
        alt: "Ferretería 57",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${russoOne.variable}`}>
      <body>
        {/* ToastProvider por fuera de CartProvider: el carrito dispara el
            toast de confirmación (useToast) al agregar un producto, así
            que necesita que el provider de toasts ya exista por encima. */}
        <ToastProvider>
          <CartProvider>
            <Header />
            {children}
            <Footer />
            <WhatsAppButton />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
