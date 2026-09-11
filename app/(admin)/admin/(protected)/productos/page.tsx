import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { FilterSelectField } from "@/components/admin/FilterSelectField";
import { ProductsTable, type ProductRow } from "@/components/admin/ProductsTable";
import { buttonClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Productos — Panel de administración" };

// Categoría y estado se filtran en la propia consulta; el buscador (por
// código o nombre) se resuelve en memoria sobre ese resultado ya
// acotado — evita construir un filtro .or() a mano con texto del usuario
// interpolado (PostgREST lo soporta, pero es un patrón frágil de escapar
// bien) y el catálogo de una ferretería no es tan grande como para que
// esto pese.
async function getAdminProducts(filters: { q: string; categoria: string; estado: string; sinImagen: boolean }) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, name, slug, brand, active, images, categories(name), product_variants(sku, price, stock)")
    .order("created_at", { ascending: false });

  if (filters.categoria) query = query.eq("category_id", filters.categoria);
  if (filters.estado === "activo") query = query.eq("active", true);
  if (filters.estado === "inactivo") query = query.eq("active", false);

  const { data, error } = await query;
  // Supabase nunca lanza una excepción por un error de la base — devuelve
  // { data: null, error }. Sin este chequeo, cualquier error se
  // convertiría en "no hay productos" en vez de mostrar el problema real.
  if (error) throw new Error(error.message);
  let rows = (data ?? []) as unknown as ProductRow[];

  const q = filters.q.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.product_variants.some((variant) => variant.sku.toLowerCase().includes(q))
    );
  }

  // Sin imagen: para dar seguimiento a lo que se acaba de importar por
  // Excel (nace sin imágenes) y todavía necesita completarse a mano.
  if (filters.sinImagen) {
    rows = rows.filter((row) => row.images.length === 0);
  }

  return rows;
}

export default async function AdminProductosPage({
  searchParams,
}: {
  searchParams: { q?: string; categoria?: string; estado?: string; sinImagen?: string };
}) {
  const supabase = await createClient();
  const filters = {
    q: searchParams.q ?? "",
    categoria: searchParams.categoria ?? "",
    estado: searchParams.estado ?? "",
    sinImagen: searchParams.sinImagen === "1",
  };

  let products: ProductRow[] = [];
  let loadError: string | null = null;
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("position");

  try {
    products = await getAdminProducts(filters);
  } catch (err) {
    loadError = `No se pudieron cargar los productos: ${err instanceof Error ? err.message : "error desconocido"}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Productos</h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/productos/importar" className={buttonClassName("secondary", "shrink-0")}>
            <Upload className="size-4" aria-hidden="true" strokeWidth={2} />
            Importar desde Excel
          </Link>
          <Link href="/admin/productos/nuevo" className={buttonClassName("primary", "shrink-0")}>
            <Plus className="size-4" aria-hidden="true" strokeWidth={2} />
            Nuevo producto
          </Link>
        </div>
      </div>

      {/* Navegación GET nativa: el navegador recarga la página con los
          filtros como query params — el propio Server Component los lee de
          searchParams. Categoría/Estado usan el listbox propio (ver
          FilterSelectField) en vez de <select> nativo: una vez abierto, el
          menú de un <select> lo dibuja el sistema operativo con su propio
          look, no el de la marca (mismo hallazgo ya resuelto para "Ordenar
          por" en CategoryProductBrowser) — el input oculto que trae el
          wrapper es lo que mantiene esos dos campos viajando en el mismo
          submit GET. */}
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="q" className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Buscar por código o nombre
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
          <span className="mb-1.5 block font-sans text-sm font-medium text-brand-black">Categoría</span>
          <FilterSelectField
            name="categoria"
            defaultValue={filters.categoria}
            label="Categoría"
            options={[
              { value: "", label: "Todas" },
              ...(categories ?? []).map((category) => ({ value: category.id, label: category.name })),
            ]}
          />
        </div>

        <div>
          <span className="mb-1.5 block font-sans text-sm font-medium text-brand-black">Estado</span>
          <FilterSelectField
            name="estado"
            defaultValue={filters.estado}
            label="Estado"
            options={[
              { value: "", label: "Todos" },
              { value: "activo", label: "Activo" },
              { value: "inactivo", label: "Inactivo" },
            ]}
          />
        </div>

        <label className="flex min-h-11 items-center gap-2 font-sans text-sm text-brand-black">
          <input
            type="checkbox"
            name="sinImagen"
            value="1"
            defaultChecked={filters.sinImagen}
            className="size-5 rounded border-brand-slate/40 accent-brand-orange"
          />
          Sin imagen
        </label>

        <button type="submit" className={buttonClassName("secondary")}>
          Filtrar
        </button>
      </form>

      {loadError ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {loadError}
        </p>
      ) : (
        <ProductsTable products={products} />
      )}
    </div>
  );
}
