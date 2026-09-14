/** @type {import('next').NextConfig} */

// next/image rechaza cualquier host remoto que no esté aquí — sin esto,
// las imágenes de producto subidas a Supabase Storage (ver
// ProductThumbnail/ProductGallery) truenan en producción. Se deriva del
// mismo NEXT_PUBLIC_SUPABASE_URL que ya usan los clientes de Supabase, en
// vez de hardcodear el hostname del proyecto.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig = {
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
