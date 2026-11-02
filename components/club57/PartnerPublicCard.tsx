import Link from "next/link";
import { Lock, MapPin, Mail, Phone } from "lucide-react";
import { buttonClassName } from "@/components/ui";
import { PartnerAvatar } from "@/components/club57/PartnerAvatar";
import type { DirectorioAcceso, PublicPartner } from "@/lib/club57/socios/public";

export const SOCIOS_CUENTA_PATH = "/cuenta?tab=socios";
export const SOCIOS_LOGIN_HREF = `/cuenta?next=${encodeURIComponent(SOCIOS_CUENTA_PATH)}`;
export const SOCIOS_JOIN_HREF = `/cuenta?registro=1&next=${encodeURIComponent(SOCIOS_CUENTA_PATH)}`;

export function ubicacionPublica(partner: Pick<PublicPartner, "colonia" | "municipio">): string | null {
  return [partner.colonia, partner.municipio].filter(Boolean).join(", ") || null;
}

// Tarjeta pública de un socio: solo lo que la vista pública trae (nombre,
// giro, logo, colonia y municipio). El bloque de contacto es una maqueta
// decorativa: las barras difuminadas no son datos reales, que nunca llegan
// al navegador de quien no es miembro (ver lib/club57/socios/public.ts).
export function PartnerPublicCard({ partner, acceso }: { partner: PublicPartner; acceso: DirectorioAcceso }) {
  const ubicacion = ubicacionPublica(partner);
  return (
    <article className="flex h-full flex-col rounded-xl bg-white p-4 shadow-[0_8px_24px_-16px_rgba(26,26,26,0.35)] ring-1 ring-brand-slate/10 sm:p-5">
      <div className="flex items-start gap-3">
        <PartnerAvatar nombre={partner.nombre_comercial} logoUrl={partner.logo_url} />
        <div className="min-w-0">
          <h3 className="text-balance font-sans text-base font-semibold leading-snug text-brand-black">
            {partner.nombre_comercial}
          </h3>
          <p className="mt-0.5 font-sans text-sm text-brand-slate">{partner.giro}</p>
          {ubicacion && (
            <p className="mt-1 flex items-start gap-1 font-sans text-xs text-brand-slate/80">
              <MapPin className="mt-px size-3.5 shrink-0" aria-hidden="true" strokeWidth={1.75} />
              <span>{ubicacion}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col justify-end">
        {acceso === "miembro" ? (
          <Link
            href={`${SOCIOS_CUENTA_PATH}&q=${encodeURIComponent(partner.nombre_comercial)}`}
            className={buttonClassName("secondary", "w-full !px-4 text-sm")}
          >
            Ver datos de contacto
          </Link>
        ) : (
          <ContactoProtegido acceso={acceso} />
        )}
      </div>
    </article>
  );
}

function ContactoProtegido({ acceso }: { acceso: Exclude<DirectorioAcceso, "miembro"> }) {
  return (
    <div className="rounded-lg bg-brand-gray p-3">
      <div aria-hidden="true" className="flex select-none flex-col gap-2 blur-[3px]">
        {[Phone, Mail, MapPin].map((Icon, index) => (
          <span key={index} className="flex items-center gap-2">
            <Icon className="size-3.5 text-brand-slate/60" strokeWidth={1.75} />
            <span className={`h-2.5 rounded-full bg-brand-slate/25 ${["w-24", "w-36", "w-44"][index]}`} />
          </span>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 font-sans text-xs font-semibold text-brand-black">
        <Lock className="size-3.5 shrink-0 text-brand-orange" aria-hidden="true" strokeWidth={2} />
        Exclusivo para miembros de Club 57
      </p>
      {acceso === "visitante" ? (
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <Link href={SOCIOS_LOGIN_HREF} className={buttonClassName("secondary", "!px-2 text-sm")}>
            Inicia sesión
          </Link>
          <Link href={SOCIOS_JOIN_HREF} className={buttonClassName("primary", "!px-2 text-sm")}>
            Únete a Club 57
          </Link>
        </div>
      ) : (
        <p className="mt-1.5 font-sans text-xs text-brand-slate">
          Tu cuenta todavía no está activa en Club 57.{" "}
          <Link href={SOCIOS_CUENTA_PATH} className="font-semibold underline underline-offset-2 hover:text-brand-black">
            Ver cómo activarla
          </Link>
        </p>
      )}
    </div>
  );
}
