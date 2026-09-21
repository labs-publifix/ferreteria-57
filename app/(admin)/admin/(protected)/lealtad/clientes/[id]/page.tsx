import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Club57RegisterPurchaseForm } from "@/components/admin/Club57RegisterPurchaseForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Detalle de cliente — Club 57" };

interface MemberDetail {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  referral_code: string;
  origen_alta: "vendedor" | "autoregistro";
  created_at: string;
}

interface LedgerRow {
  id: string;
  cantidad: number;
  tipo: string;
  estado: "pendiente" | "disponible";
  fecha_disponible: string | null;
  referencia: string | null;
  created_at: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

const TIPO_LABEL: Record<string, string> = {
  compra_online: "Compra en línea",
  compra_manual: "Compra en tienda",
  referido_bono: "Bono por referido",
  reversion_cancelacion: "Reversión por cancelación",
  canje: "Canje",
};

const ORIGEN_LABEL: Record<MemberDetail["origen_alta"], string> = {
  vendedor: "Alta manual (vendedor)",
  autoregistro: "Autoregistro",
};

export default async function AdminClub57ClienteDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("club57_members")
    .select("id, full_name, email, phone, referral_code, origen_alta, created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!member) notFound();

  const { data: ledger } = await supabase
    .from("club57_points_ledger")
    .select("id, cantidad, tipo, estado, fecha_disponible, referencia, created_at")
    .eq("member_id", params.id)
    .order("created_at", { ascending: false });

  const memberDetail = member as MemberDetail;
  const ledgerRows = (ledger ?? []) as LedgerRow[];

  const saldoDisponible = ledgerRows
    .filter((row) => row.estado === "disponible")
    .reduce((sum, row) => sum + row.cantidad, 0);
  const puntosPendientes = ledgerRows
    .filter((row) => row.estado === "pendiente")
    .reduce((sum, row) => sum + row.cantidad, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/lealtad/clientes"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Volver a clientes
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">
          {memberDetail.full_name}
        </h1>
        <p className="mt-1 font-sans text-sm text-brand-slate/70">
          Cliente desde {dateFormatter.format(new Date(memberDetail.created_at))} ·{" "}
          {ORIGEN_LABEL[memberDetail.origen_alta]}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Datos</h2>
          <dl className="font-sans text-sm text-brand-black">
            {/* min-w-0 + break-all: un correo largo sin espacios (nada que
                le dé al navegador dónde partir la línea) puede estirar el
                flex y sacar a toda la página de su ancho en 375/390px —
                min-w-0 permite que este hijo se encoja por debajo de su
                ancho de contenido, break-all le da un punto de corte. */}
            <div className="flex justify-between gap-3 py-1">
              <dt className="shrink-0 text-brand-slate/70">Correo</dt>
              <dd className="min-w-0 break-all text-right font-medium">{memberDetail.email}</dd>
            </div>
            <div className="flex justify-between gap-3 py-1">
              <dt className="shrink-0 text-brand-slate/70">Teléfono</dt>
              {/* El teléfono queda null para autoregistro/backfill (el
                  formulario de /cuenta no lo pide) — "—" en vez de un
                  espacio vacío sin explicación. */}
              <dd className="min-w-0 break-all text-right font-medium">{memberDetail.phone || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3 py-1">
              <dt className="shrink-0 text-brand-slate/70">Código de referido</dt>
              <dd className="min-w-0 break-all text-right font-medium">{memberDetail.referral_code}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Saldo de puntos</h2>
          <p className="font-display text-3xl text-brand-black">{saldoDisponible} pts</p>
          <p className="mt-1 font-sans text-sm text-brand-slate/70">Disponibles para canje</p>
          {puntosPendientes > 0 && (
            <p className="mt-3 font-sans text-sm text-brand-slate">
              + {puntosPendientes} pts pendientes (todavía no disponibles)
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Registrar compra en tienda</h2>
        <Club57RegisterPurchaseForm memberId={memberDetail.id} />
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Historial de puntos</h2>
        {ledgerRows.length === 0 ? (
          <p className="font-sans text-sm text-brand-slate/70">Sin movimientos todavía.</p>
        ) : (
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Puntos</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2">Referencia</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((row) => (
                  <tr key={row.id} className="border-b border-brand-slate/10 last:border-0">
                    <td className="py-2 text-brand-slate">{dateFormatter.format(new Date(row.created_at))}</td>
                    <td className="py-2 text-brand-black">{TIPO_LABEL[row.tipo] ?? row.tipo}</td>
                    <td className={`py-2 font-medium ${row.cantidad < 0 ? "text-red-700" : "text-brand-black"}`}>
                      {row.cantidad > 0 ? "+" : ""}
                      {row.cantidad}
                    </td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.estado === "disponible"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {row.estado === "disponible" ? "Disponible" : "Pendiente"}
                      </span>
                    </td>
                    <td className="max-w-[220px] py-2 text-brand-slate">{row.referencia ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
