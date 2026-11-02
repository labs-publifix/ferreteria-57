import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, FileSpreadsheet, Plus, Tags } from "lucide-react";
import { FilterSelectField } from "@/components/admin/FilterSelectField";
import { Club57PartnersTable } from "@/components/admin/Club57PartnersTable";
import { buttonClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getAdminProfile } from "@/lib/supabase/adminProfile";
import {
  ESTATUS_OPCIONES,
  ORDEN_OPCIONES,
  estaPendiente,
  filtrarAdmin,
  ordenarAdmin,
  type AdminPartnerRow,
  type Estatus,
  type Orden,
} from "@/lib/club57/socios/adminList";

export const metadata: Metadata = { title: "Directorio de socios comerciales — Club 57" };

const PAGE_SIZE = 25;

const fieldClass =
  "min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

interface SearchParams {
  q?: string;
  giro?: string;
  estatus?: string;
  orden?: string;
  page?: string;
}

function hrefCon(params: { q: string; giro: string; estatus: string; orden: string }, page: number): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return `/admin/lealtad/socios${qs ? `?${qs}` : ""}`;
}

// Listado del directorio de socios comerciales (admin y operador): búsqueda,
// filtros por giro y estatus, orden y acciones por fila. Los socios son
// decenas o cientos: se traen todos y se filtran aquí, sin acentos ni
// mayúsculas (lib/club57/socios/adminList.ts).
export default async function AdminSociosPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const [{ data, error }, { data: girosData }, admin] = await Promise.all([
    supabase
      .from("club57_partners")
      .select(
        "id, nombre_comercial, slug, giro_id, contacto, telefono, correo, municipio, colonia, logo_url, activo, eliminado_at, consentimiento_datos, consentimiento_medio, origen, updated_at, club57_partner_giros(nombre, activo)"
      )
      .limit(5000),
    supabase.from("club57_partner_giros").select("id, nombre, activo").order("nombre"),
    getAdminProfile(),
  ]);

  const rows: AdminPartnerRow[] = (data ?? []).map((row) => {
    const giro = row.club57_partner_giros as { nombre: string; activo: boolean } | { nombre: string; activo: boolean }[] | null;
    const g = Array.isArray(giro) ? giro[0] : giro;
    return {
      id: row.id as string,
      nombre_comercial: row.nombre_comercial as string,
      slug: row.slug as string,
      giro_id: (row.giro_id as string | null) ?? null,
      giro: g?.nombre ?? null,
      giro_activo: g?.activo ?? false,
      contacto: row.contacto as string | null,
      telefono: row.telefono as string | null,
      correo: row.correo as string | null,
      municipio: row.municipio as string | null,
      colonia: row.colonia as string | null,
      logo_url: row.logo_url as string | null,
      activo: row.activo as boolean,
      eliminado_at: row.eliminado_at as string | null,
      consentimiento_datos: row.consentimiento_datos as boolean,
      consentimiento_medio: (row.consentimiento_medio as string | null) ?? null,
      origen: row.origen as AdminPartnerRow["origen"],
      updated_at: row.updated_at as string,
    };
  });
  const giros = (girosData ?? []) as { id: string; nombre: string; activo: boolean }[];

  const q = (searchParams.q ?? "").trim().slice(0, 80);
  const estatus = (ESTATUS_OPCIONES.some((o) => o.value === searchParams.estatus) ? searchParams.estatus : "") as Estatus;
  const orden = (ORDEN_OPCIONES.some((o) => o.value === searchParams.orden) ? searchParams.orden : "nombre") as Orden;
  const giro =
    searchParams.giro === "sin_giro" || giros.some((g) => g.id === searchParams.giro) ? searchParams.giro! : "";

  const filtrados = ordenarAdmin(filtrarAdmin(rows, q, giro, estatus), orden);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1), totalPaginas);
  const visibles = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const params = { q, giro, estatus, orden: orden === "nombre" ? "" : orden };
  const hayFiltros = Boolean(q || giro || estatus);

  const vigentes = rows.filter((row) => !row.eliminado_at);
  const pendientes = vigentes.filter(estaPendiente).length;
  const sinConsentimiento = vigentes.filter((row) => !row.consentimiento_datos).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/admin/lealtad"
            className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
          >
            ← Club 57
          </Link>
          <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">
            Directorio de socios comerciales
          </h1>
          <p className="mt-1 max-w-prose font-sans text-sm text-brand-slate/70">
            Lo que se publica en /directorio y en Mi cuenta. El público ve nombre, giro, logo y municipio; los miembros
            de Club 57 ven el contacto de los socios con consentimiento. Las notas internas nunca salen del panel.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:shrink-0">
          <Link href="/admin/lealtad/socios/nuevo" className={buttonClassName("primary")}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo socio
          </Link>
          <Link href="/admin/lealtad/socios/importar" className={buttonClassName("secondary")}>
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Carga masiva
          </Link>
          <Link href="/admin/lealtad/socios/giros" className={buttonClassName("secondary")}>
            <Tags className="size-4" aria-hidden="true" />
            Giros
          </Link>
        </div>
      </div>

      {(pendientes > 0 || sinConsentimiento > 0) && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 font-sans text-sm text-amber-900">
          {pendientes > 0 && (
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                <strong>{pendientes}</strong> {pendientes === 1 ? "socio pendiente" : "socios pendientes"} de completar: sin
                giro, no se publican.{" "}
                <Link href={hrefCon({ q: "", giro: "", estatus: "pendientes", orden: "" }, 1)} className="font-semibold underline">
                  Ver pendientes
                </Link>
              </span>
            </p>
          )}
          {sinConsentimiento > 0 && (
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                <strong>{sinConsentimiento}</strong> sin consentimiento de datos: los miembros ven el socio pero no su
                contacto hasta que se registre la autorización.{" "}
                <Link
                  href={hrefCon({ q: "", giro: "", estatus: "sin_consentimiento", orden: "" }, 1)}
                  className="font-semibold underline"
                >
                  Ver cuáles
                </Link>
              </span>
            </p>
          )}
        </div>
      )}

      <form method="get" className="grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label htmlFor="socios-q" className={labelClass}>
            Buscar
          </label>
          <input
            id="socios-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Nombre, contacto, teléfono, correo o colonia"
            className={fieldClass}
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
              { value: "sin_giro", label: "Sin giro (por definir)" },
              ...giros.map((g) => ({ value: g.id, label: g.activo ? g.nombre : `${g.nombre} (inactivo)` })),
            ]}
          />
        </div>
        <div>
          <span className={labelClass}>Estatus</span>
          <FilterSelectField
            name="estatus"
            defaultValue={estatus}
            label="Estatus"
            options={ESTATUS_OPCIONES.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
        <div>
          <span className={labelClass}>Ordenar por</span>
          <FilterSelectField
            name="orden"
            defaultValue={orden}
            label="Ordenar por"
            options={ORDEN_OPCIONES.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <button type="submit" className={buttonClassName("secondary")}>
            Filtrar
          </button>
          {hayFiltros && (
            <Link
              href="/admin/lealtad/socios"
              className="px-2 py-2.5 font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
            >
              Quitar filtros
            </Link>
          )}
        </div>
      </form>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudo cargar el directorio: {error.message}
        </p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="font-sans text-base font-semibold text-brand-black">Todavía no hay socios en el directorio.</p>
          <p className="mt-1 font-sans text-sm text-brand-slate">
            Da de alta el primero o sube tu Excel con la carga masiva.
          </p>
        </div>
      ) : (
        <>
          <p className="font-sans text-sm text-brand-slate/70">
            {filtrados.length} {filtrados.length === 1 ? "socio" : "socios"}
            {hayFiltros ? " con esos filtros" : ""}
          </p>
          <Club57PartnersTable
            key={hrefCon(params, page)}
            rows={visibles}
            seleccionablesDelFiltro={filtrados.filter((row) => !row.eliminado_at).map((row) => row.id)}
            canHardDelete={admin?.role === "admin"}
          />
          {totalPaginas > 1 && (
            <nav aria-label="Paginación de socios" className="flex items-center justify-between gap-3">
              {page > 1 ? (
                <Link href={hrefCon(params, page - 1)} className={buttonClassName("secondary")}>
                  Anterior
                </Link>
              ) : (
                <span />
              )}
              <span className="font-sans text-sm text-brand-slate/70">
                Página {page} de {totalPaginas}
              </span>
              {page < totalPaginas ? (
                <Link href={hrefCon(params, page + 1)} className={buttonClassName("secondary")}>
                  Siguiente
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
