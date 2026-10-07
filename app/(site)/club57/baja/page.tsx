import type { Metadata } from "next";
import Link from "next/link";
import { NO_INDEX_NO_FOLLOW } from "@/lib/seo";
import { estadoSuscripcionAvisos } from "@/lib/club57/avisos/baja";
import { BajaAvisosForm } from "@/components/club57/BajaAvisosForm";

export const metadata: Metadata = {
  title: "Avisos de promociones — Club 57",
  robots: NO_INDEX_NO_FOLLOW,
};

export const dynamic = "force-dynamic";

// Enlace "Dejar de recibir avisos de promociones" de los correos de Club
// 57. No requiere sesión. Abrir la página no cambia nada: la baja se
// confirma con un clic (los escáneres de enlaces no dan de baja a nadie).
export default async function BajaAvisosPage({ searchParams }: { searchParams: { m?: string; t?: string } }) {
  const m = typeof searchParams.m === "string" ? searchParams.m : "";
  const t = typeof searchParams.t === "string" ? searchParams.t : "";
  const estado = await estadoSuscripcionAvisos(m, t);

  return (
    <main className="px-4 py-14 sm:py-20">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-brand-slate">Club 57</p>
        {estado.valido ? (
          <BajaAvisosForm m={m} t={t} optoutInicial={estado.optout} />
        ) : (
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-xl uppercase text-brand-black">Enlace no válido</h1>
            <p className="font-sans text-sm text-brand-slate">
              Este enlace está incompleto o ya no es válido. Usa el enlace del correo más reciente que recibiste, o
              escríbenos y con gusto te ayudamos.
            </p>
            <Link href="/" className="font-sans text-sm font-semibold text-brand-black underline underline-offset-2">
              Ir a la tienda
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
