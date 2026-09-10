import { Inter, Russo_One } from "next/font/google";

// Compartido entre los dos layouts raíz del sitio (app/(site)/layout.tsx y
// app/(admin)/layout.tsx — Next.js App Router permite "múltiples layouts
// raíz" vía route groups cuando dos secciones necesitan un <html>/<body>
// completamente distinto, que es el caso aquí: la tienda pública y el
// panel de administración no comparten Header/Footer/carrito). Cargadas
// con next/font/google: self-hosted en build, cero layout shift, sin
// <link> externo a Google Fonts (lineamiento de ui-ux-pro-max).
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const russoOne = Russo_One({
  subsets: ["latin"],
  weight: "400", // Russo One solo existe en un peso.
  variable: "--font-russo-one",
  display: "swap",
});
