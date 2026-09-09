import type { Config } from "tailwindcss";

// Marca Ferretería 57 — valores exactos del manual de marca
// (brand/Manual de Marca Ferretería 57.pdf, sección 03 PALETA DE COLOR).
// No inventar ni ajustar estos hex: son los valores oficiales del cliente.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FF6600", // Naranja 57 — acento: CTAs, badges de descuento, precios activos. Nunca fondo extenso.
          slate: "#3F515A", // Gris pizarra — dominante institucional: encabezados, bloques, texto secundario.
          black: "#1A1A1A", // Negro suave — texto principal.
          white: "#FFFFFF", // Blanco — fondo principal.
          gray: "#F2F1EF", // Gris cálido claro — fondo secundario/dominante de pantalla.
        },
      },
      fontFamily: {
        display: ["var(--font-russo-one)", "sans-serif"], // Títulos H1/H2, siempre mayúsculas.
        sans: ["var(--font-inter)", "sans-serif"], // Cuerpo, precios, botones.
      },
    },
  },
  plugins: [],
};

export default config;
