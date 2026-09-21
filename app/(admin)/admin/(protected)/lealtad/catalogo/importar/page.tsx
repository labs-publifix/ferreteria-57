import type { Metadata } from "next";
import Link from "next/link";
import { Club57CatalogImportWizard } from "@/components/admin/Club57CatalogImportWizard";

export const metadata: Metadata = { title: "Importar catálogo — Club 57" };

export default function AdminClub57ImportarCatalogoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/lealtad/catalogo"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Volver al catálogo
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">
          Importar catálogo desde Excel
        </h1>
      </div>

      <Club57CatalogImportWizard />
    </div>
  );
}
