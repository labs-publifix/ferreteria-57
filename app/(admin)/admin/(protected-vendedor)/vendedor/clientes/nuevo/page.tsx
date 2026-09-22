import type { Metadata } from "next";
import Link from "next/link";
import { Club57NewMemberWizard } from "@/components/admin/Club57NewMemberWizard";

export const metadata: Metadata = { title: "Nuevo cliente — Club 57" };

export default function VendedorNuevoClientePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/vendedor/clientes"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Mis clientes
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">Nuevo cliente</h1>
      </div>

      <Club57NewMemberWizard basePath="/admin/vendedor/clientes" />
    </div>
  );
}
