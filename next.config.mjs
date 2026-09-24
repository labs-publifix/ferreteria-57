/** @type {import('next').NextConfig} */

// next/image rechaza cualquier host remoto que no esté aquí — sin esto,
// las imágenes de producto subidas a Supabase Storage (ver
// ProductThumbnail/ProductGallery) truenan en producción. Se deriva del
// mismo NEXT_PUBLIC_SUPABASE_URL que ya usan los clientes de Supabase, en
// vez de hardcodear el hostname del proyecto.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig = {
  // Limpieza SEO por la migración del sitio anterior (misma arquitectura
  // de dominio ferreteria57.com, URLs distintas): solo rutas de SECCIÓN
  // del sitio viejo con equivalente claro acá (siempre "/", no existe hoy
  // una landing de categorías/marcas separada) — nunca páginas de producto
  // individuales del sitio viejo (/productos/lonas, /productos/discos-de-lija,
  // etc.), esas deben seguir dando 404 real tal como se espera. Se
  // revisó la estructura real de rutas antes de escribir estos patrones
  // (ver app/(site) y app/(admin)): ninguno de estos paths colisiona con
  // una ruta válida del sitio nuevo — /producto/[slug] es singular, distinto
  // de /productos (plural, el path viejo); /categoria/[slug] es singular,
  // distinto de /categorias-de-productos.
  async redirects() {
    return [
      // Listado de categorías del sitio viejo — sin match 1:1 confiable
      // contra las categorías reales de Supabase (los slugs no son los
      // mismos), así que todas van al home en vez de arriesgar mandar a
      // una categoría equivocada.
      {
        source: "/categorias-de-productos/:path*",
        destination: "/",
        permanent: true,
      },
      // Listado de marcas del sitio viejo (dos variantes de mayúscula, las
      // dos indexadas en Google) — hoy no existe una sección de marcas en
      // el sitio nuevo.
      { source: "/marcas", destination: "/", permanent: true },
      { source: "/Marcas", destination: "/", permanent: true },
      // Raíz del catálogo del sitio viejo (dos variantes de mayúscula) —
      // SOLO el path exacto, nunca con wildcard: las páginas de producto
      // individuales que colgaban de ahí (/productos/lonas,
      // /productos/discos-de-lija) deben seguir dando 404 real, no
      // redirigir a ningún lado.
      { source: "/Productos", destination: "/", permanent: true },
      { source: "/productos", destination: "/", permanent: true },
      // Páginas de marca individual del sitio viejo — hoy no existe una
      // sección de marca dedicada en el sitio nuevo.
      { source: "/Expert", destination: "/", permanent: true },
      { source: "/Foset", destination: "/", permanent: true },
      { source: "/Truper", destination: "/", permanent: true },
      { source: "/Fiero", destination: "/", permanent: true },
      { source: "/Volteck", destination: "/", permanent: true },
      { source: "/Hermex", destination: "/", permanent: true },
      { source: "/Klintek", destination: "/", permanent: true },
      { source: "/Pretul", destination: "/", permanent: true },
    ];
  },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // Sin esto, next/image rechaza servir los SVG de public/marcas (logos
    // de las submarcas de Grupo Truper) con un 400 — Next.js bloquea SVG
    // por default porque uno subido por un usuario podría traer <script>
    // adentro. Estos son archivos estáticos del propio repo, no contenido
    // de terceros, así que el riesgo no aplica; el CSP de abajo es de
    // cualquier forma una segunda capa que impide que un SVG ejecute
    // script o cargue un frame si algún día se coló uno malicioso.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
