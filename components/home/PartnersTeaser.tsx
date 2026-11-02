import Link from "next/link";
import { Lock, MapPin } from "lucide-react";
import { buttonClassName } from "@/components/ui";
import { PartnerAvatar } from "@/components/club57/PartnerAvatar";
import { SOCIOS_JOIN_HREF } from "@/components/club57/PartnerPublicCard";
import { getPublicPartners, seleccionDelDia } from "@/lib/club57/socios/public";
import { buildDirectorioJsonLd, DIRECTORIO_PATH } from "@/lib/club57/socios/seo";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";

const MIN_SOCIOS = 4;
const MAX_SOCIOS = 6;

// Teaser del directorio en el home: hasta 6 socios (rotan cada día) con solo
// sus datos públicos, y la invitación a Club 57 para ver cómo contactarlos.
// Con menos de 4 socios publicados la sección no aparece (nunca un bloque a
// medias). En celular las tarjetas forman un riel que se desliza dentro del
// contenedor, sin ensanchar la página.
export async function PartnersTeaser() {
  const { partners, error } = await getPublicPartners();
  if (error || partners.length < MIN_SOCIOS) return null;
  const destacados = seleccionDelDia(partners, MAX_SOCIOS, todayInStoreTimezone());

  return (
    <section className="mt-14 sm:mt-20" aria-labelledby="socios-heading">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildDirectorioJsonLd(destacados)) }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 id="socios-heading" className="font-display text-lg uppercase text-brand-slate sm:text-xl">
            Directorio de socios comerciales
          </h2>
          <p className="mt-2 font-sans text-sm text-brand-black/70 sm:text-base">
            Talleres y comercios de Querétaro que trabajan con Ferretería 57. Únete a Club 57 para ver sus teléfonos,
            correos y direcciones.
          </p>
        </div>
        <Link href={DIRECTORIO_PATH} className={buttonClassName("primary", "hidden shrink-0 sm:inline-flex")}>
          Ver el directorio
        </Link>
      </div>

      <ul className="-mx-4 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {destacados.map((partner) => (
          <li key={partner.id} className="w-[11.5rem] shrink-0 snap-start sm:w-auto">
            <Link
              href={`${DIRECTORIO_PATH}#${partner.slug}`}
              className="flex h-full flex-col items-center rounded-xl bg-white p-4 text-center shadow-[0_8px_24px_-16px_rgba(26,26,26,0.35)] ring-1 ring-brand-slate/10 transition-shadow hover:shadow-[0_12px_28px_-14px_rgba(26,26,26,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            >
              <PartnerAvatar nombre={partner.nombre_comercial} logoUrl={partner.logo_url} />
              <span className="mt-3 line-clamp-2 text-balance font-sans text-sm font-semibold leading-snug text-brand-black">
                {partner.nombre_comercial}
              </span>
              <span className="mt-1 line-clamp-2 font-sans text-xs text-brand-slate">{partner.giro}</span>
              {partner.municipio && (
                <span className="mt-1 inline-flex items-center gap-1 font-sans text-xs text-brand-slate/80">
                  <MapPin className="size-3" aria-hidden="true" strokeWidth={1.75} />
                  {partner.municipio}
                </span>
              )}
              <span className="mt-auto inline-flex items-center gap-1 whitespace-nowrap pt-3 font-sans text-xs font-semibold text-brand-black/70">
                <Lock className="size-3 text-brand-orange" aria-hidden="true" strokeWidth={2} />
                Solo miembros
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col items-stretch gap-2 sm:hidden">
        <Link href={DIRECTORIO_PATH} className={buttonClassName("primary")}>
          Ver el directorio
        </Link>
        <Link href={SOCIOS_JOIN_HREF} className={buttonClassName("secondary")}>
          Únete a Club 57
        </Link>
      </div>
    </section>
  );
}
