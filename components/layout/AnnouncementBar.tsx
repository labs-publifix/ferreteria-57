import Link from "next/link";
import { TOP_BANNER_THEME_CLASSES } from "@/lib/marketing/theme";
import type { TopBannerConfig } from "@/types/marketing";

// config ya viene resuelto (activo + dentro de vigencia) desde
// getVisibleTopBanner() — este componente solo decide cómo pintarlo, o no
// pintar nada en absoluto (null, sin dejar un hueco vacío) si no hay
// ninguna configuración vigente ahora mismo.
export function AnnouncementBar({ config }: { config: TopBannerConfig | null }) {
  if (!config) return null;

  const text = (
    <p className="px-4 py-1.5 text-center font-sans text-xs leading-snug sm:text-sm">
      {config.message}
    </p>
  );

  return (
    <div className={TOP_BANNER_THEME_CLASSES[config.colorTheme]}>
      {config.href ? (
        <Link href={config.href} className="block underline-offset-2 hover:underline">
          {text}
        </Link>
      ) : (
        text
      )}
    </div>
  );
}
