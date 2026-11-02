import type { Metadata } from "next";
import Link from "next/link";
import { Club57PartnerForm, EMPTY_PARTNER } from "@/components/admin/Club57PartnerForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nuevo socio comercial — Club 57" };

export default async function NuevoSocioPage() {
  const supabase = await createClient();
  const { data: giros } = await supabase.from("club57_partner_giros").select("id, nombre, activo").order("nombre");

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/admin/lealtad/socios"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Directorio de socios
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">Nuevo socio comercial</h1>
      </div>
      <Club57PartnerForm
        initial={EMPTY_PARTNER}
        giros={(giros ?? []) as { id: string; nombre: string; activo: boolean }[]}
        logoUrl={null}
        consentimientoFecha={null}
      />
    </div>
  );
}
