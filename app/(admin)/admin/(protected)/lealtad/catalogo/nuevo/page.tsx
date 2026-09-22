import type { Metadata } from "next";
import Link from "next/link";
import { Club57CatalogForm } from "@/components/admin/Club57CatalogForm";

export const metadata: Metadata = { title: "Nuevo artículo — Catálogo de canje" };

export default function AdminClub57NuevoCatalogoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/lealtad/catalogo"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Volver al catálogo
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">Nuevo artículo</h1>
      </div>

      <Club57CatalogForm mode="create" />
    </div>
  );
}
