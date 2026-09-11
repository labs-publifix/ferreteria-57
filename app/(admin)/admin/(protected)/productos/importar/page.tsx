import type { Metadata } from "next";
import Link from "next/link";
import { ImportWizard } from "@/components/admin/ImportWizard";

export const metadata: Metadata = { title: "Importar productos — Panel de administración" };

export default function ImportarProductosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/productos"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Volver a productos
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">
          Importar productos desde Excel
        </h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
          Alta masiva a partir de un archivo con Categoria, Codigo, Nombre, Precio y URL de ficha
          técnica. Los productos se crean inactivos y sin imagen — súbelas después, uno por uno, desde
          el formulario manual.
        </p>
      </div>

      <ImportWizard />
    </div>
  );
}
