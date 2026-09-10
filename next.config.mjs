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
  },
};

export default nextConfig;
