"use client";

import { usePathname } from "next/navigation";
import { PopupBannerWidget } from "./PopupBannerWidget";
import type { PublicPopupBanner } from "@/types/popup";

// /admin nunca monta SiteChrome (layout raíz aparte, sin Header/Footer/
// WhatsAppButton — ver app/(admin)/layout.tsx) así que no hace falta
// excluirlo aquí. /carrito y /checkout (incluida /checkout/confirmacion,
// que vive bajo ese mismo prefijo) SÍ comparten app/(site)/layout.tsx con
// el resto del sitio — se excluyen por ruta para no distraer justo antes
// de pagar, durante el pago, ni en la confirmación del pedido.
const EXCLUDED_PREFIXES = ["/carrito", "/checkout"];

export function PopupBannerGate({ banner }: { banner: PublicPopupBanner | null }) {
  const pathname = usePathname();
  if (!banner) return null;
  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;
  return <PopupBannerWidget banner={banner} />;
}
