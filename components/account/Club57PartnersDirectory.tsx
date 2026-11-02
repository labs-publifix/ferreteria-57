"use client";

import { useId, useMemo, useState } from "react";
import { Lock, Mail, MapPin, MessageCircle, Phone, SearchX, User } from "lucide-react";
import { Select, SimplePagination } from "@/components/ui";
import { PartnerAvatar } from "@/components/club57/PartnerAvatar";
import { filtrarSocios, girosDe } from "@/lib/club57/socios/filtros";
import {
  direccionCompleta,
  mapsHref,
  telefonoHref,
  telefonoLegible,
  whatsappHref,
  type MemberPartner,
  type SociosCuenta,
} from "@/lib/club57/socios/member";
import { STORE_PHONE_DISPLAY, STORE_PHONE_TEL, STORE_WHATSAPP_PHONE } from "@/lib/store-info";

const PAGE_SIZE = 8;

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-brand-slate/25 px-3 font-sans text-sm font-semibold text-brand-slate transition-colors hover:border-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";

// Pestaña «Socios Comerciales» de /cuenta. Los datos ya llegaron filtrados
// desde el servidor: solo un miembro activo los recibe, y solo con el
// contacto de los socios que autorizaron compartirlo.
export function Club57PartnersDirectory({ data, initialQuery }: { data: SociosCuenta; initialQuery: string }) {
  if (data.acceso !== "miembro") return <SinMembresia />;
  return <Directorio socios={data.socios} error={data.error} initialQuery={initialQuery} />;
}

function Directorio({ socios, error, initialQuery }: { socios: MemberPartner[]; error: boolean; initialQuery: string }) {
  const searchId = useId();
  const [q, setQ] = useState(initialQuery);
  const [giro, setGiro] = useState("");
  const [page, setPage] = useState(1);
  const giros = useMemo(() => girosDe(socios), [socios]);
  const filtrados = useMemo(() => filtrarSocios(socios, q, giro), [socios, q, giro]);
  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const visibles = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-white p-6 text-center font-sans text-sm text-red-700 shadow-sm">
        No pudimos cargar el directorio. Recarga la página para intentarlo de nuevo.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-[1fr_16rem]">
        <div>
          <label htmlFor={searchId} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Buscar por nombre
          </label>
          <input
            id={searchId}
            type="search"
            value={q}
            maxLength={60}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            placeholder="Ej. taller, vidrio, refaccionaria"
            className="min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2.5 font-sans text-base text-brand-black placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:text-sm"
          />
        </div>
        <div>
          <span className="mb-1.5 block font-sans text-sm font-medium text-brand-black">Giro</span>
          <Select
            label="Giro"
            value={giro}
            onChange={(value) => {
              setGiro(value);
              setPage(1);
            }}
            options={[
              { value: "", label: "Todos los giros" },
              ...giros.map((option) => ({ value: option.id, label: `${option.nombre} (${option.total})` })),
            ]}
          />
        </div>
      </div>

      <p className="font-sans text-sm text-brand-slate" aria-live="polite">
        {filtrados.length} {filtrados.length === 1 ? "socio" : "socios"}
      </p>

      {visibles.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <SearchX className="mx-auto size-8 text-brand-slate/60" aria-hidden="true" strokeWidth={1.5} />
          <p className="mt-3 font-sans text-base font-semibold text-brand-black">
            {socios.length === 0 ? "Todavía no hay socios en el directorio." : "No encontramos socios con esa búsqueda."}
          </p>
          {socios.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setGiro("");
                setPage(1);
              }}
              className="mt-2 min-h-11 font-sans text-sm font-semibold text-brand-slate underline underline-offset-2"
            >
              Ver todos los socios
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibles.map((partner) => (
            <li key={partner.id}>
              <SocioCard partner={partner} />
            </li>
          ))}
        </ul>
      )}

      <SimplePagination page={page} totalPages={totalPages} onPageChange={setPage} label="Paginación de socios" />
    </div>
  );
}

function SocioCard({ partner }: { partner: MemberPartner }) {
  const direccion = direccionCompleta(partner);
  return (
    <article className="flex h-full flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-brand-slate/10 sm:p-5">
      <div className="flex items-start gap-3">
        <PartnerAvatar nombre={partner.nombre_comercial} logoUrl={partner.logo_url} />
        <div className="min-w-0">
          <h3 className="text-balance font-sans text-base font-semibold leading-snug text-brand-black">
            {partner.nombre_comercial}
          </h3>
          <p className="mt-0.5 font-sans text-sm text-brand-slate">{partner.giro}</p>
        </div>
      </div>

      {partner.datos_autorizados ? (
        <>
          <dl className="mt-4 flex flex-col gap-2 font-sans text-sm text-brand-black">
            {partner.contacto && (
              <Dato icon={User} label="Contacto">
                {partner.contacto}
              </Dato>
            )}
            {partner.telefono && (
              <Dato icon={Phone} label="Teléfono">
                <a href={telefonoHref(partner.telefono)} className="tabular-nums underline-offset-2 hover:underline">
                  {telefonoLegible(partner.telefono)}
                </a>
              </Dato>
            )}
            {[partner.correo, partner.correo_2].filter(Boolean).map((correo) => (
              <Dato key={correo} icon={Mail} label="Correo">
                <a href={`mailto:${correo}`} className="break-all underline-offset-2 hover:underline">
                  {correo}
                </a>
              </Dato>
            ))}
            {direccion && (
              <Dato icon={MapPin} label="Dirección">
                {direccion}
              </Dato>
            )}
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {partner.telefono && (
              <>
                <a href={telefonoHref(partner.telefono)} className={actionClass}>
                  <Phone className="size-4" aria-hidden="true" strokeWidth={1.75} />
                  Llamar
                </a>
                <a
                  href={whatsappHref(partner.telefono, partner.nombre_comercial)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={actionClass}
                >
                  <MessageCircle className="size-4" aria-hidden="true" strokeWidth={1.75} />
                  WhatsApp
                </a>
              </>
            )}
            {partner.correo && (
              <a href={`mailto:${partner.correo}`} className={actionClass}>
                <Mail className="size-4" aria-hidden="true" strokeWidth={1.75} />
                Correo
              </a>
            )}
            {direccion && (
              <a
                href={mapsHref(direccion, partner.nombre_comercial)}
                target="_blank"
                rel="noopener noreferrer"
                className={actionClass}
              >
                <MapPin className="size-4" aria-hidden="true" strokeWidth={1.75} />
                Cómo llegar
              </a>
            )}
          </div>
        </>
      ) : (
        <p className="mt-4 rounded-lg bg-brand-gray p-3 font-sans text-sm text-brand-slate">
          {[partner.colonia, partner.municipio].filter(Boolean).join(", ")}
          {(partner.colonia || partner.municipio) && <br />}
          Estamos confirmando con este socio la autorización para compartir sus datos de contacto. Pronto los verás aquí.
        </p>
      )}
    </article>
  );
}

function Dato({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <dt className="mt-0.5 shrink-0">
        <Icon className="size-4 text-brand-slate/70" aria-hidden="true" strokeWidth={1.75} />
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function SinMembresia() {
  return (
    <div className="rounded-xl bg-brand-black p-6 text-left text-white sm:p-8">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-white/10">
        <Lock className="size-5 text-brand-orange" aria-hidden="true" strokeWidth={2} />
      </span>
      <h3 className="mt-4 font-sans text-lg font-semibold">Exclusivo para miembros de Club 57</h3>
      <p className="mt-2 max-w-prose font-sans text-sm text-white/80">
        Tu cuenta todavía no está activa en Club 57, por eso no ves los datos de contacto de los socios comerciales.
        Escríbenos o llámanos y te ayudamos a activarla: es gratis.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-2 sm:flex">
        <a
          href={`https://wa.me/${STORE_WHATSAPP_PHONE}?text=${encodeURIComponent("Hola, quiero activar mi cuenta de Club 57.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-orange px-5 font-sans text-base font-semibold text-brand-black hover:bg-[#E65C00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <MessageCircle className="size-4" aria-hidden="true" strokeWidth={2} />
          Activar por WhatsApp
        </a>
        <a
          href={`tel:${STORE_PHONE_TEL}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-white px-5 font-sans text-base font-semibold text-white hover:bg-white hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Phone className="size-4" aria-hidden="true" strokeWidth={2} />
          {STORE_PHONE_DISPLAY}
        </a>
      </div>
    </div>
  );
}
