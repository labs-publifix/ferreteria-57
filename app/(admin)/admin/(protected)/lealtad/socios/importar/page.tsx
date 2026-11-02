import type { Metadata } from "next";
import Link from "next/link";
import { Club57PartnersImportWizard } from "@/components/admin/Club57PartnersImportWizard";

export const metadata: Metadata = { title: "Carga masiva de socios — Club 57" };

export default function ImportarSociosPage() {
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div>
        <Link
          href="/admin/lealtad/socios"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Directorio de socios
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">Carga masiva de socios</h1>
        <p className="mt-1 max-w-prose font-sans text-sm text-brand-slate/70">
          Sube un Excel o CSV. Antes de guardar verás cada fila revisada, con el motivo de cualquier error o advertencia,
          y decides qué hacer con los socios que ya existen.
        </p>
      </div>
      <Club57PartnersImportWizard />
    </div>
  );
}
