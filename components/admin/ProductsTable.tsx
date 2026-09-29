"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star } from "lucide-react";
import { ProductImagePlaceholder } from "@/components/ui";
import {
  bulkSetProductsActive,
  bulkSetProductsFeatured,
  toggleProductFeatured,
} from "@/app/(admin)/admin/(protected)/productos/actions";
import { formatPrice } from "@/lib/formatPrice";

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string;
  active: boolean;
  featured: boolean;
  images: string[];
  categories: { name: string } | null;
  product_variants: { sku: string; price: number; stock: number }[];
}

// Tabla completa como Client Component (mismo criterio que
// CategoriesTable/ReviewsTable): selección de filas + barra de acciones en
// lote necesitan estado compartido entre todas las filas, más simple que
// repartirlo en islas de cliente por fila.
export function ProductsTable({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  // Toggle individual (#11): id del producto cuyo checkbox de destacado
  // está en vuelo — deshabilita solo esa fila, no la tabla entera, mientras
  // se confirma.
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  const allSelected = products.length > 0 && selectedIds.size === products.length;
  const someSelected = selectedIds.size > 0;

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(products.map((product) => product.id)) : new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleBulkActivate(active: boolean) {
    setIsProcessing(true);
    setError(null);
    setSummary(null);

    const result = await bulkSetProductsActive([...selectedIds], active);
    setIsProcessing(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (active) {
      const parts = [`${result.activated} ${result.activated === 1 ? "producto activado" : "productos activados"}`];
      if (result.skipped) {
        parts.push(`${result.skipped} ${result.skipped === 1 ? "omitido" : "omitidos"} por no tener imagen todavía`);
      }
      setSummary(parts.join(", "));
    } else {
      setSummary(
        `${result.deactivated} ${result.deactivated === 1 ? "producto desactivado" : "productos desactivados"}`
      );
    }

    setSelectedIds(new Set());
    router.refresh();
  }

  async function handleBulkFeatured(featured: boolean) {
    setIsProcessing(true);
    setError(null);
    setSummary(null);

    const result = await bulkSetProductsFeatured([...selectedIds], featured);
    setIsProcessing(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (featured) {
      const parts = [`${result.featured} ${result.featured === 1 ? "producto destacado" : "productos destacados"}`];
      if (result.skipped) {
        parts.push(
          `${result.skipped} ${result.skipped === 1 ? "omitido" : "omitidos"} por estar inactivo`
        );
      }
      setSummary(parts.join(", "));
    } else {
      setSummary(
        `${result.unfeatured} ${result.unfeatured === 1 ? "producto quitado de destacados" : "productos quitados de destacados"}`
      );
    }

    setSelectedIds(new Set());
    router.refresh();
  }

  async function handleToggleFeatured(id: string, nextFeatured: boolean) {
    setTogglingFeaturedId(id);
    setError(null);

    const result = await toggleProductFeatured(id, nextFeatured);
    setTogglingFeaturedId(null);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (products.length === 0) {
    return (
      <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
        No hay productos que coincidan con esos filtros.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      {summary && (
        <p role="status" className="rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800">
          {summary}
        </p>
      )}

      {/* Barra de acciones en lote: solo ocupa espacio cuando hace falta,
          en vez de un renglón vacío permanente arriba de la tabla. */}
      {someSelected && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-brand-slate px-4 py-3">
          <span className="font-sans text-sm text-white">
            {selectedIds.size} {selectedIds.size === 1 ? "producto seleccionado" : "productos seleccionados"}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleBulkFeatured(true)}
              className="flex min-h-9 items-center rounded-full border-2 border-white px-4 font-sans text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
            >
              Marcar como destacados
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleBulkFeatured(false)}
              className="flex min-h-9 items-center rounded-full border-2 border-white px-4 font-sans text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
            >
              Quitar de destacados
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleBulkActivate(true)}
              className="flex min-h-9 items-center rounded-full bg-brand-orange px-4 font-sans text-sm font-semibold text-brand-black transition-colors hover:bg-[#E65C00] disabled:opacity-50"
            >
              Activar seleccionados
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleBulkActivate(false)}
              className="flex min-h-9 items-center rounded-full border-2 border-white px-4 font-sans text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
            >
              Desactivar seleccionados
            </button>
          </div>
        </div>
      )}

      <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[840px] text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos los productos"
                  checked={allSelected}
                  onChange={(event) => toggleAll(event.target.checked)}
                  className="size-5 rounded border-brand-slate/40 accent-brand-orange"
                />
              </th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Destacado</th>
              {/* aria-label en el propio <th> (no un <span className="sr-only">
                  anidado): ese span es position:absolute sin inset propio,
                  así que su "posición estática" cae en la columna real de
                  esta tabla ancha (~760px) — dentro de un contenedor con
                  scroll horizontal, eso extendía el scrollWidth de TODO el
                  documento más allá del viewport en móvil, aunque
                  visualmente no se viera nada fuera de lugar. */}
              <th className="px-4 py-3" aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const firstVariant = product.product_variants[0];
              return (
                <tr key={product.id} className="border-b border-brand-slate/10 last:border-0">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${product.name}`}
                      checked={selectedIds.has(product.id)}
                      onChange={(event) => toggleOne(product.id, event.target.checked)}
                      className="size-5 rounded border-brand-slate/40 accent-brand-orange"
                    />
                  </td>
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
                    {/* Solo un producto activo puede destacarse — el
                        checkbox se deshabilita en vez de esconderse, para
                        que quede claro POR QUÉ no se puede marcar en vez de
                        que la columna se vea vacía sin explicación. */}
                    <label
                      className={`flex min-h-9 items-center gap-1.5 ${
                        !product.active && !product.featured ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                      }`}
                      title={!product.active && !product.featured ? "Solo productos activos pueden destacarse" : undefined}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Destacar ${product.name}`}
                        checked={product.featured}
                        disabled={togglingFeaturedId === product.id || (!product.active && !product.featured)}
                        onChange={(event) => handleToggleFeatured(product.id, event.target.checked)}
                        className="size-5 rounded border-brand-slate/40 accent-brand-orange"
                      />
                      {product.featured && (
                        <Star className="size-4 fill-brand-orange text-brand-orange" aria-hidden="true" strokeWidth={1.75} />
                      )}
                    </label>
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
    </div>
  );
}
