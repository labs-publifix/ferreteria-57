import type { Metadata } from "next";
import Link from "next/link";
import { Club57GirosManager, type GiroRow } from "@/components/admin/Club57GirosManager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Giros del directorio — Club 57" };

export default async function GirosPage() {
  const supabase = await createClient();
  const [{ data: giros }, { data: socios }] = await Promise.all([
    supabase.from("club57_partner_giros").select("id, nombre, activo").order("nombre"),
    supabase.from("club57_partners").select("giro_id").is("eliminado_at", null),
  ]);
  const conteo = new Map<string, number>();
  for (const socio of socios ?? []) {
    if (socio.giro_id) conteo.set(socio.giro_id as string, (conteo.get(socio.giro_id as string) ?? 0) + 1);
  }
  const rows: GiroRow[] = (giros ?? []).map((giro) => ({
    id: giro.id as string,
    nombre: giro.nombre as string,
    activo: giro.activo as boolean,
    socios: conteo.get(giro.id as string) ?? 0,
  }));

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/admin/lealtad/socios"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Directorio de socios
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">Giros del directorio</h1>
        <p className="mt-1 max-w-prose font-sans text-sm text-brand-slate/70">
          Son las opciones del filtro «Giro» en /directorio y en Mi cuenta. Solo aparecen los giros activos que tienen
          al menos un socio publicado.
        </p>
      </div>
      <Club57GirosManager giros={rows} />
    </div>
  );
}
