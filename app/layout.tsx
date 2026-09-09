import type { Metadata } from "next";
import { Inter, Russo_One } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Ferretería 57",
  description:
    "E-commerce de Ferretería 57, distribuidor autorizado Truper en Querétaro.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${russoOne.variable}`}>
      <body>{children}</body>
    </html>
  );
}
