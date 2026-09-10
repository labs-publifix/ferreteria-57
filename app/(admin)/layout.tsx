import type { Metadata } from "next";
import { inter, russoOne } from "@/lib/fonts";
import "../globals.css";

// Segundo layout raíz del sitio (patrón oficial de Next.js App Router:
// "multiple root layouts" vía route groups) — el panel de administración
// es una aplicación aparte de la tienda pública: no lleva el Header, el
// Footer, el carrito ni el botón de WhatsApp del sitio (ver
// app/(site)/layout.tsx), así que necesita su propio <html>/<body> en vez
// de anidarse dentro de ese layout.
export const metadata: Metadata = {
  title: "Panel de administración — Ferretería 57",
  description: "Panel de administración interno de Ferretería 57.",
  // Nunca debe indexarse: es una herramienta interna, no contenido público.
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
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
