import type { Metadata } from "next";
import Link from "next/link";
import { Lock, SearchX } from "lucide-react";
import { FilterSelectField } from "@/components/admin/FilterSelectField";
import {
  PartnerPublicCard,
  SOCIOS_CUENTA_PATH,
  SOCIOS_JOIN_HREF,
  SOCIOS_LOGIN_HREF,
} from "@/components/club57/PartnerPublicCard";
import { buttonClassName } from "@/components/ui";
import { SITE_URL } from "@/lib/seo";
import {
  DIRECTORIO_PAGE_SIZE,
  filtrarSocios,
  getDirectorioAcceso,
  getPublicPartners,
  girosDe,
} from "@/lib/club57/socios/public";
import {
  buildDirectorioJsonLd,
  DIRECTORIO_DESCRIPTION,
  DIRECTORIO_PATH,
  DIRECTORIO_TITLE,
} from "@/lib/club57/socios/seo";

// Por request: la vista cambia en cuanto el admin publica o edita un socio,
// y lo que se muestra en cada tarjeta depende de la sesión.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: DIRECTORIO_TITLE },
  description: DIRECTORIO_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${DIRECTORIO_PATH}` },
  openGraph: {
    type: "website",
    title: DIRECTORIO_TITLE,
    description: DIRECTORIO_DESCRIPTION,
    url: `${SITE_URL}${DIRECTORIO_PATH}`,
    siteName: "Ferretería 57",
    locale: "es_MX",
  },
  twitter: { card: "summary_large_image", title: DIRECTORIO_TITLE, description: DIRECTORIO_DESCRIPTION },
};

const inputClass =
  "min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2.5 font-sans text-base text-brand-black placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:text-sm";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

function hrefDirectorio(q: string, giro: string, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (giro) params.set("giro", giro);
  if (page > 1) params.set("pagina", String(page));
  const qs = params.toString();
  return `${DIRECTORIO_PATH}${qs ? `?${qs}` : ""}`;
}

export default async function DirectorioPage({
  searchParams,
}: {
  searchParams: { q?: string; giro?: string; pagina?: string };
}) {
  const q = (searchParams.q ?? "").trim().slice(0, 60);
  const [{ partners, error }, acceso] = await Promise.all([getPublicPartners(), getDirectorioAcceso()]);
  const giros = girosDe(partners);
  const giro = giros.some((option) => option.id === searchParams.giro) ? searchParams.giro! : "";
  const filtrados = filtrarSocios(partners, q, giro);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / DIRECTORIO_PAGE_SIZE));
  const pagina = Math.min(Math.max(1, Number.parseInt(searchParams.pagina ?? "1", 10) || 1), totalPaginas);
  const visibles = filtrados.slice((pagina - 1) * DIRECTORIO_PAGE_SIZE, pagina * DIRECTORIO_PAGE_SIZE);
  const hayFiltros = Boolean(q || giro);
  const giroNombre = giros.find((option) => option.id === giro)?.nombre;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12 lg:px-8">
      {partners.length > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildDirectorioJsonLd(partners)) }}
        />
      )}

      <header className="max-w-3xl">
        <h1 className="text-balance font-display text-2xl uppercase text-brand-slate sm:text-4xl">
          Directorio de socios comerciales
        </h1>
        <p className="mt-3 max-w-prose font-sans text-base text-brand-black/80">
          Talleres, refaccionarias y comercios de Querétaro que trabajan de la mano con Ferretería 57. Encuentra quién
          te resuelve el siguiente trabajo, cerca de ti.
        </p>
      </header>

      {acceso !== "miembro" ? (
        <section
          aria-labelledby="directorio-acceso"
          className="mt-6 flex flex-col gap-4 rounded-xl bg-brand-black p-5 text-white sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Lock className="size-4 text-brand-orange" aria-hidden="true" strokeWidth={2} />
            </span>
            <div>
              <h2 id="directorio-acceso" className="font-sans text-base font-semibold">
                Teléfonos, correos y direcciones: exclusivos para miembros de Club 57
              </h2>
              <p className="mt-1 font-sans text-sm text-white/75">
                {acceso === "visitante"
                  ? "Registrarte es gratis y con tu cuenta ves los datos de contacto de cada socio."
                  : "Tu cuenta todavía no está activa en Club 57. En Mi cuenta te decimos cómo activarla."}
              </p>
            </div>
          </div>
          {acceso === "visitante" ? (
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
              <Link
                href={SOCIOS_LOGIN_HREF}
                className={buttonClassName(
                  "secondary",
                  "!border-white !text-white hover:!bg-white hover:!text-brand-black focus-visible:ring-white"
                )}
              >
                Inicia sesión
              </Link>
              <Link href={SOCIOS_JOIN_HREF} className={buttonClassName("primary", "focus-visible:ring-white")}>
                Únete a Club 57
              </Link>
            </div>
          ) : (
            <Link href={SOCIOS_CUENTA_PATH} className={buttonClassName("primary", "shrink-0 focus-visible:ring-white")}>
              Ir a Mi cuenta
            </Link>
          )}
        </section>
      ) : (
        <p className="mt-6 rounded-xl bg-white p-4 font-sans text-sm text-brand-black shadow-sm ring-1 ring-brand-slate/10 sm:mt-8">
          Como miembro de Club 57 ves los datos de contacto completos en{" "}
          <Link href={SOCIOS_CUENTA_PATH} className="font-semibold text-brand-slate underline underline-offset-2">
            Mi cuenta › Socios Comerciales
          </Link>
          .
        </p>
      )}

      <form
        method="get"
        role="search"
        aria-label="Buscar en el directorio"
        className="mt-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-brand-slate/10 sm:mt-8 sm:grid-cols-[1fr_16rem_auto] sm:items-end"
      >
        <div>
          <label htmlFor="directorio-q" className={labelClass}>
            Buscar por nombre
          </label>
          <input
            id="directorio-q"
            name="q"
            type="search"
            defaultValue={q}
            maxLength={60}
            placeholder="Ej. taller, vidrio, refaccionaria"
            className={inputClass}
          />
        </div>
        <div>
          <span className={labelClass}>Giro</span>
          <FilterSelectField
            name="giro"
            defaultValue={giro}
            label="Giro"
            options={[
              { value: "", label: "Todos los giros" },
              ...giros.map((option) => ({ value: option.id, label: `${option.nombre} (${option.total})` })),
            ]}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className={buttonClassName("primary", "w-full sm:w-auto")}>
            Buscar
          </button>
          {hayFiltros && (
            <Link href={DIRECTORIO_PATH} className={buttonClassName("secondary", "w-full sm:w-auto")}>
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <section aria-labelledby="directorio-resultados" className="mt-8">
        <h2 id="directorio-resultados" className="sr-only">
          Socios comerciales
        </h2>
        {error ? (
          <div role="alert" className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-brand-slate/10">
            <p className="font-sans text-base font-semibold text-brand-black">No pudimos cargar el directorio.</p>
            <p className="mt-1 font-sans text-sm text-brand-slate">Revisa tu conexión e inténtalo de nuevo en un momento.</p>
            <Link href={hrefDirectorio(q, giro, pagina)} className={buttonClassName("secondary", "mt-4")}>
              Reintentar
            </Link>
          </div>
        ) : visibles.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-brand-slate/10">
            <SearchX className="mx-auto size-8 text-brand-slate/60" aria-hidden="true" strokeWidth={1.5} />
            <p className="mt-3 font-sans text-base font-semibold text-brand-black">
              {partners.length === 0
                ? "Muy pronto verás aquí a nuestros socios comerciales."
                : q
                  ? `No encontramos socios con «${q}»${giroNombre ? ` en ${giroNombre}` : ""}.`
                  : "No hay socios con ese giro por ahora."}
            </p>
            {partners.length > 0 && (
              <p className="mt-1 font-sans text-sm text-brand-slate">
                Prueba con una sola palabra del nombre, o{" "}
                <Link href={DIRECTORIO_PATH} className="font-semibold underline underline-offset-2">
                  ve todo el directorio
                </Link>
                .
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="mb-4 font-sans text-sm text-brand-slate" aria-live="polite">
              {filtrados.length} {filtrados.length === 1 ? "socio" : "socios"}
              {giroNombre ? ` en ${giroNombre}` : ""}
              {q ? ` que coinciden con «${q}»` : ""}
            </p>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((partner) => (
                <li key={partner.id} id={partner.slug}>
                  <PartnerPublicCard partner={partner} acceso={acceso} />
                </li>
              ))}
            </ul>
            {totalPaginas > 1 && (
              <nav aria-label="Paginación del directorio" className="mt-8 flex items-center justify-between gap-3">
                {pagina > 1 ? (
                  <Link href={hrefDirectorio(q, giro, pagina - 1)} className={buttonClassName("secondary")} rel="prev">
                    Anterior
                  </Link>
                ) : (
                  <span />
                )}
                <span className="font-sans text-sm text-brand-slate">
                  Página {pagina} de {totalPaginas}
                </span>
                {pagina < totalPaginas ? (
                  <Link href={hrefDirectorio(q, giro, pagina + 1)} className={buttonClassName("secondary")} rel="next">
                    Siguiente
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
