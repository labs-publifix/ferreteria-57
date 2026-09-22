import type { Metadata } from "next";
import Image from "next/image";
import { ProductImagePlaceholder } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Catálogo de canje — Club 57" };

interface CatalogRow {
  id: string;
  nombre: string;
  codigo: string | null;
  costo_puntos: number;
  stock: number;
  image_url: string | null;
}

// Solo lectura a propósito — un vendedor ve el catálogo para saber qué hay
// disponible y su stock, pero editarlo sigue siendo exclusivo de
// /admin/lealtad/catalogo. La política "Cualquiera lee el catálogo de
// canje activo" ya deja pasar esta consulta sin cambios de RLS.
export default async function VendedorCatalogoPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club57_redemption_catalog")
    .select("id, nombre, codigo, costo_puntos, stock, image_url")
    .eq("active", true)
    .order("costo_puntos", { ascending: true });

  const items = (data ?? []) as CatalogRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Catálogo de canje</h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
          Artículos disponibles para canje y su stock — solo lectura.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudo cargar el catálogo: {error.message}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
          Todavía no hay artículos activos en el catálogo.
        </p>
      ) : (
        <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full min-w-[480px] text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                <th className="px-4 py-3">Artículo</th>
                <th className="px-4 py-3">Puntos</th>
                <th className="px-4 py-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-brand-slate/10 last:border-0">
                  <td className="max-w-[300px] px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <ProductImagePlaceholder className="size-10 shrink-0 text-[10px]" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-brand-black">{item.nombre}</p>
                        {item.codigo && (
                          <p className="truncate text-xs text-brand-slate/60">Cód. {item.codigo}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-brand-slate">{item.costo_puntos} pts</td>
                  <td className="px-4 py-3 text-brand-slate">
                    {item.stock > 0 ? item.stock : <span className="text-red-700">Sin stock</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
