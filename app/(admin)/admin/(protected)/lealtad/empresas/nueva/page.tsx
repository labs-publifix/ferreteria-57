import type { Metadata } from "next";
import Link from "next/link";
import { EmpresaForm } from "@/components/admin/empresas/EmpresaForm";

export const metadata: Metadata = { title: "Nueva empresa — Club 57 Empresarial" };

export default function AdminNuevaEmpresaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/lealtad/empresas" className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black">
          ← Empresas
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">Nueva empresa</h1>
        <p className="mt-1 max-w-prose font-sans text-sm text-brand-slate/70">
          Alta directa de una empresa con convenio, sin pasar por la solicitud del sitio.
        </p>
      </div>
      <EmpresaForm mode="create" />
    </div>
  );
}
