import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { Club57CatalogTable, type Club57CatalogRow } from "@/components/admin/Club57CatalogTable";
import { buttonClassName } from "@/components/ui";
import { normalizeText } from "@/lib/normalizeText";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Catálogo de canje — Club 57" };

type Orden = "puntos_asc" | "puntos_desc" | "nombre";

// #7 filtros del catálogo de canje (vista admin) — esta pantalla no tenía
// NINGÚN filtro/búsqueda/orden hasta ahora (a diferencia de la vista del
// cliente en /cuenta, que ya traía búsqueda de texto y paginación desde
// una ronda anterior — ver Club57MemberPanel.tsx). No existen columnas de
// categoría/marca en club57_redemption_catalog, así que ese filtro no
// aplica aquí (ver migraciones — solo nombre/descripcion/clave/codigo/
// costo_puntos/stock/active).
//
// El rango de puntos y el orden sí se resuelven en la propia consulta
// (.gte/.lte/.order) — la búsqueda de texto libre se resuelve en memoria
// sobre ese resultado ya acotado, mismo criterio ya establecido en
// admin/pedidos/page.tsx: un .or() con ilike sobre texto del usuario es
// frágil de escapar bien (comas/paréntesis rompen la sintaxis), y este
// catálogo no es tan grande como para que el filtrado en memoria pese.
export default async function AdminClub57CatalogoPage({
  searchParams,
}: {
  searchParams: { q?: string; puntosMin?: string; puntosMax?: string; orden?: string };
}) {
  const supabase = await createClient();

  const filters = {
    q: searchParams.q ?? "",
    puntosMin: searchParams.puntosMin ?? "",
    puntosMax: searchParams.puntosMax ?? "",
    orden: (searchParams.orden as Orden) || "puntos_asc",
  };

  let query = supabase
    .from("club57_redemption_catalog")
    .select("id, nombre, clave, codigo, costo_puntos, stock, image_url, active");

  const puntosMinNumber = filters.puntosMin ? Number.parseInt(filters.puntosMin, 10) : null;
  const puntosMaxNumber = filters.puntosMax ? Number.parseInt(filters.puntosMax, 10) : null;
  if (puntosMinNumber !== null && !Number.isNaN(puntosMinNumber)) query = query.gte("costo_puntos", puntosMinNumber);
  if (puntosMaxNumber !== null && !Number.isNaN(puntosMaxNumber)) query = query.lte("costo_puntos", puntosMaxNumber);

  if (filters.orden === "puntos_desc") query = query.order("costo_puntos", { ascending: false });
  else if (filters.orden === "nombre") query = query.order("nombre", { ascending: true });
  else query = query.order("costo_puntos", { ascending: true });

  const { data, error } = await query;

  let items = (data ?? []) as (Club57CatalogRow & { clave: string | null })[];

  const q = normalizeText(filters.q);
  if (q) {
    items = items.filter(
      (item) =>
        normalizeText(item.nombre).includes(q) ||
        (item.clave && normalizeText(item.clave).includes(q)) ||
        (item.codigo && normalizeText(item.codigo).includes(q))
    );
  }

  const hasFilters = Boolean(filters.q || filters.puntosMin || filters.puntosMax || searchParams.orden);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/lealtad"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Club 57
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Catálogo de canje</h1>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/lealtad/catalogo/importar" className={buttonClassName("secondary")}>
              <Upload className="size-4" aria-hidden="true" strokeWidth={1.75} />
              Importar desde Excel
            </Link>
            <Link href="/admin/lealtad/catalogo/nuevo" className={buttonClassName("primary")}>
              <Plus className="size-4" aria-hidden="true" strokeWidth={1.75} />
              Nuevo artículo
            </Link>
          </div>
        </div>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="q" className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Buscar por nombre, clave o código
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={filters.q}
            className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          />
        </div>

        <div>
          <label htmlFor="puntosMin" className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Puntos desde
          </label>
          <input
            id="puntosMin"
            name="puntosMin"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={filters.puntosMin}
            className="w-28 rounded-md border border-brand-slate/30 px-3 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          />
        </div>

        <div>
          <label htmlFor="puntosMax" className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Puntos hasta
          </label>
          <input
            id="puntosMax"
            name="puntosMax"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={filters.puntosMax}
            className="w-28 rounded-md border border-brand-slate/30 px-3 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          />
        </div>

        <div>
          <label htmlFor="orden" className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Ordenar por
          </label>
          <select
            id="orden"
            name="orden"
            defaultValue={filters.orden}
            className="min-h-11 rounded-md border border-brand-slate/30 px-3 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          >
            <option value="puntos_asc">Puntos: menor a mayor</option>
            <option value="puntos_desc">Puntos: mayor a menor</option>
            <option value="nombre">Nombre</option>
          </select>
        </div>

        <button type="submit" className={buttonClassName("secondary")}>
          Filtrar
        </button>
        {hasFilters && (
          <Link href="/admin/lealtad/catalogo" className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black">
            Limpiar filtros
          </Link>
        )}
      </form>

      <p className="font-sans text-sm text-brand-slate/70">
        {items.length} {items.length === 1 ? "artículo" : "artículos"}
      </p>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudo cargar el catálogo: {error.message}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
          {hasFilters
            ? "Ningún artículo coincide con esos filtros."
            : "Todavía no hay artículos en el catálogo — crea el primero o impórtalo desde Excel."}
        </p>
      ) : (
        <Club57CatalogTable items={items} />
      )}
    </div>
  );
}
