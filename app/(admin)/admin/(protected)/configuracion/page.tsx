import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CreditCard } from "lucide-react";
import { buttonClassName } from "@/components/ui";
import { getMercadoPagoConnectionStatus } from "@/lib/mercadopago/connectionStatus";

export const metadata: Metadata = { title: "Configuración — Panel de administración" };

// mp_message viaja como texto simple del propio servidor (armado en
// app/api/mercadopago/callback/route.ts, nunca eco de un input externo),
// así que mostrarlo tal cual en la página es seguro.
export default async function AdminConfiguracionPage({
  searchParams,
}: {
  searchParams: { mp?: string; mp_message?: string };
}) {
  const status = await getMercadoPagoConnectionStatus();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">
          Configuración
        </h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
          Ajustes generales de la tienda y conexiones con servicios externos.
        </p>
      </div>

      {searchParams.mp === "success" && (
        <p
          role="status"
          className="rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800"
        >
          Mercado Pago se conectó correctamente.
        </p>
      )}
      {searchParams.mp === "error" && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {searchParams.mp_message ?? "No se pudo conectar con Mercado Pago. Intenta de nuevo."}
        </p>
      )}

      <section
        aria-labelledby="mercadopago-heading"
        className="rounded-lg border border-brand-slate/15 bg-white p-5 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-slate/10">
            <CreditCard className="size-5 text-brand-slate" aria-hidden="true" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="mercadopago-heading" className="font-display text-base uppercase text-brand-black sm:text-lg">
                Mercado Pago
              </h2>
              {status.connected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 font-sans text-xs font-bold text-green-800">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Conectado
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 font-sans text-xs font-bold text-amber-800">
                  No conectado
                </span>
              )}
            </div>

            <p className="mt-1.5 max-w-prose font-sans text-sm text-brand-slate/70">
              {status.connected
                ? "Los pagos de checkout se cobran directo a la cuenta de Mercado Pago de la tienda."
                : "Conecta la cuenta de Mercado Pago de la tienda para que los pagos de checkout le lleguen directo a ella."}
            </p>

            <div className="mt-4">
              <Link
                href="/api/admin/mercadopago/connect"
                className={buttonClassName(status.connected ? "secondary" : "primary")}
              >
                {status.connected ? "Reconectar con Mercado Pago" : "Conectar con Mercado Pago"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
