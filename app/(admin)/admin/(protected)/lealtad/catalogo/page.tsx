import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { Club57CatalogTable, type Club57CatalogRow } from "@/components/admin/Club57CatalogTable";
import { buttonClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Catálogo de canje — Club 57" };

export default async function AdminClub57CatalogoPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club57_redemption_catalog")
    .select("id, nombre, codigo, costo_puntos, stock, image_url, active")
    .order("created_at", { ascending: false });

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

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudo cargar el catálogo: {error.message}
        </p>
      ) : (
        <Club57CatalogTable items={(data ?? []) as Club57CatalogRow[]} />
      )}
    </div>
  );
}
