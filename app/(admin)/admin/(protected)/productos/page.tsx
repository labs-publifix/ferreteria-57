import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonClassName, ProductImagePlaceholder } from "@/components/ui";
import { formatPrice } from "@/lib/formatPrice";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Productos — Panel de administración" };

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string;
  active: boolean;
  images: string[];
  categories: { name: string } | null;
  product_variants: { sku: string; price: number; stock: number }[];
}

// Categoría y estado se filtran en la propia consulta; el buscador (por
// código o nombre) se resuelve en memoria sobre ese resultado ya
// acotado — evita construir un filtro .or() a mano con texto del usuario
// interpolado (PostgREST lo soporta, pero es un patrón frágil de escapar
// bien) y el catálogo de una ferretería no es tan grande como para que
// esto pese.
async function getAdminProducts(filters: { q: string; categoria: string; estado: string }) {
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

  return rows;
}

export default async function AdminProductosPage({
  searchParams,
}: {
  searchParams: { q?: string; categoria?: string; estado?: string };
}) {
  const supabase = await createClient();
  const filters = {
    q: searchParams.q ?? "",
    categoria: searchParams.categoria ?? "",
    estado: searchParams.estado ?? "",
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
        <Link href="/admin/productos/nuevo" className={buttonClassName("primary", "shrink-0")}>
          <Plus className="size-4" aria-hidden="true" strokeWidth={2} />
          Nuevo producto
        </Link>
      </div>

      {/* Navegación GET nativa: sin JS, el navegador recarga la página con
          los filtros como query params — el propio Server Component los
          lee de searchParams. */}
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
          <label
            htmlFor="categoria"
            className="mb-1.5 block font-sans text-sm font-medium text-brand-black"
          >
            Categoría
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={filters.categoria}
            className="rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          >
            <option value="">Todas</option>
            {(categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="estado" className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            defaultValue={filters.estado}
            className="rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          >
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        <button type="submit" className={buttonClassName("secondary")}>
          Filtrar
        </button>
      </form>

      {loadError ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {loadError}
        </p>
      ) : products.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
          No hay productos que coincidan con esos filtros.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const firstVariant = product.product_variants[0];
                return (
                  <tr key={product.id} className="border-b border-brand-slate/10 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt=""
                            width={40}
                            height={40}
                            className="size-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <ProductImagePlaceholder className="size-10 shrink-0 text-[10px]" />
                        )}
                        <div>
                          <p className="font-medium text-brand-black">{product.name}</p>
                          <p className="text-xs text-brand-slate/70">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-slate">
                      {firstVariant?.sku}
                      {product.product_variants.length > 1 && (
                        <span className="text-brand-slate/60"> +{product.product_variants.length - 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-brand-slate">{product.categories?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-brand-slate">
                      {firstVariant ? formatPrice(firstVariant.price) : "—"}
                    </td>
                    <td className="px-4 py-3 text-brand-slate">{firstVariant?.stock ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          product.active ? "bg-green-100 text-green-800" : "bg-brand-gray text-brand-slate"
                        }`}
                      >
                        {product.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/productos/${product.id}/editar`}
                        className="font-sans text-sm font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
