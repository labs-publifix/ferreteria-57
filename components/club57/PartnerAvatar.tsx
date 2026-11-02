import Image from "next/image";
import { partnerAvatarColor, partnerInitials } from "@/lib/club57/socios/avatar";

const SIZES = {
  sm: { box: "size-10", text: "text-sm", px: 40 },
  md: { box: "size-14", text: "text-lg", px: 56 },
  lg: { box: "size-20", text: "text-2xl", px: 80 },
} as const;

// Logo del socio si lo tiene; si no, círculo con sus iniciales en un color
// de la marca que sale siempre igual para el mismo nombre (ver
// lib/club57/socios/avatar.ts). El logo se guarda cuadrado al subirlo y aquí
// se ajusta dentro del círculo (object-contain) sobre blanco, para que un
// logo con fondo transparente o ancho nunca quede recortado.
// unoptimized: los logos ya llegan chicos y en su formato final (incluido
// SVG, que el optimizador de Next no sirve).
export function PartnerAvatar({
  nombre,
  logoUrl,
  size = "md",
}: {
  nombre: string;
  logoUrl: string | null;
  size?: keyof typeof SIZES;
}) {
  const dims = SIZES[size];
  if (logoUrl) {
    return (
      <span
        className={`relative inline-flex ${dims.box} shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-brand-slate/15`}
      >
        <Image
          src={logoUrl}
          alt={`Logotipo de ${nombre}`}
          width={dims.px * 2}
          height={dims.px * 2}
          unoptimized
          className="size-full object-contain p-1"
        />
      </span>
    );
  }
  const color = partnerAvatarColor(nombre);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex ${dims.box} shrink-0 select-none items-center justify-center rounded-full font-display ${dims.text} leading-none tracking-wide ${color.bg} ${color.text}`}
    >
      {partnerInitials(nombre)}
    </span>
  );
}
