import type { Metadata } from "next";
import Link from "next/link";
import { Club57ConfigForm } from "@/components/admin/Club57ConfigForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Configuración de Club 57 — Panel de administración" };

export default async function AdminClub57ConfiguracionPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("club57_config").select("*").maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/lealtad"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Club 57
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">
          Configuración de Club 57
        </h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
          Estos valores se usan para calcular puntos, canjes y bonos de referido — algunos cálculos
          todavía no están conectados y llegan en un prompt posterior, pero los valores ya quedan
          guardados desde aquí.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudo cargar la configuración: {error.message}
        </p>
      ) : (
        <Club57ConfigForm
          initialValues={{
            montoPorPunto: String(data?.monto_por_punto ?? 50),
            tasaCanjePct: String(data?.tasa_canje_pct ?? 10),
            diasEsperaPendiente: String(data?.dias_espera_pendiente ?? 7),
            puntosReferidor: String(data?.puntos_referidor ?? 10),
            puntosReferido: String(data?.puntos_referido ?? 10),
          }}
        />
      )}
    </div>
  );
}
