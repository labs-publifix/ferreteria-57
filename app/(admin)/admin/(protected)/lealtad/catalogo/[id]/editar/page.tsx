import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Club57CatalogForm } from "@/components/admin/Club57CatalogForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar artículo — Catálogo de canje" };

export default async function AdminClub57EditarCatalogoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("club57_redemption_catalog")
    .select("id, nombre, descripcion, clave, costo_puntos, stock, image_url, active")
    .eq("id", params.id)
    .maybeSingle();

  if (!item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/lealtad/catalogo"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Volver al catálogo
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">Editar artículo</h1>
      </div>

      <Club57CatalogForm
        mode="edit"
        itemId={item.id}
        initialValues={{
          nombre: item.nombre,
          descripcion: item.descripcion ?? "",
          clave: item.clave ?? "",
          costoPuntos: String(item.costo_puntos),
          stock: String(item.stock),
          imageUrl: item.image_url,
          active: item.active,
        }}
      />
    </div>
  );
}
