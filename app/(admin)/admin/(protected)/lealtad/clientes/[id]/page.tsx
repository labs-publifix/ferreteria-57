import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Club57AssignVendedor } from "@/components/admin/Club57AssignVendedor";
import { Club57GrantCortesia } from "@/components/admin/Club57GrantCortesia";
import { Club57RegisterPurchaseForm } from "@/components/admin/Club57RegisterPurchaseForm";
import { Club57StaffLedgerHistory, type Club57StaffLedgerRow } from "@/components/admin/Club57StaffLedgerHistory";
import { createClient } from "@/lib/supabase/server";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";
import { club57VendedorLabel } from "@/lib/club57/labels";
import { CLUB57_MAX_PUNTOS_CORTESIA_DEFAULT } from "@/lib/club57/cortesias";

export const metadata: Metadata = { title: "Detalle de cliente — Club 57" };

interface MemberDetail {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  referral_code: string;
  origen_alta: "vendedor" | "autoregistro";
  creado_por_vendedor_id: string | null;
  created_at: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

const ORIGEN_LABEL: Record<MemberDetail["origen_alta"], string> = {
  vendedor: "Alta manual",
  autoregistro: "Autoregistro",
};

export default async function AdminClub57ClienteDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("club57_members")
    .select("id, full_name, email, phone, referral_code, origen_alta, creado_por_vendedor_id, created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!member) notFound();

  // Vendedor asignado y personal para nombres (perfiles: admin y operador
  // los leen todos por RLS) + los últimos cambios de vendedor. Si alguna
  // consulta falla, los nombres caen a «Sin nombre» en vez de romper la
  // página.
  const vendedorId = (member as MemberDetail).creado_por_vendedor_id;
  const [{ data: personal }, { data: asignaciones }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").in("role", ["admin", "operador", "vendedor"]),
    supabase
      .from("club57_asignaciones_vendedor")
      .select("id, vendedor_anterior_id, vendedor_nuevo_id, actor_id, created_at")
      .eq("member_id", params.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const nombrePorId = new Map(
    (personal ?? []).map((p) => [p.id as string, (p.full_name as string | null)?.trim() || "Sin nombre"])
  );
  const vendedores = (personal ?? [])
    .filter((p) => p.role === "vendedor")
    .map((p) => ({ id: p.id as string, nombre: nombrePorId.get(p.id as string)! }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const vendedorNombre = vendedorId ? nombrePorId.get(vendedorId) ?? null : null;
  const nombreVendedor = (id: string | null) => (id ? nombrePorId.get(id) ?? "Vendedor sin nombre" : "Sin vendedor");

  // Puntos 'pendiente' de ESTE cliente cuya fecha ya llegó se pasan a
  // 'disponible' aquí — así el saldo que ve el vendedor en mostrador ya
  // está al día sin depender de que el cliente haya entrado a /cuenta
  // (que solo promueve lo propio). Se espera antes de leer el ledger para
  // que el saldo mostrado ya refleje la transición.
  await supabase.rpc("promote_due_club57_points_for_member", { p_member_id: params.id });

  const { data: ledger } = await supabase
    .from("club57_points_ledger")
    .select(
      "id, cantidad, tipo, estado, fecha_disponible, referencia, producto_nombre, producto_sku, monto, anula_a, corrige_a, motivo, motivo_nota, registrado_por, created_at"
    )
    .eq("member_id", params.id)
    .order("created_at", { ascending: false });

  const { data: config } = await supabase
    .from("club57_config")
    .select("monto_por_punto, max_puntos_cortesia")
    .maybeSingle();
  const montoPorPunto = config?.monto_por_punto ? Number(config.monto_por_punto) : 50;
  const maxPuntosCortesia = config?.max_puntos_cortesia
    ? Number(config.max_puntos_cortesia)
    : CLUB57_MAX_PUNTOS_CORTESIA_DEFAULT;

  const memberDetail = member as MemberDetail;
  const ledgerRows = ((ledger ?? []) as Club57StaffLedgerRow[]).map((row) => ({
    ...row,
    monto: row.monto === null ? null : Number(row.monto),
  }));

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
            <div className="flex justify-between gap-3 py-1">
              <dt className="shrink-0 text-brand-slate/70">Vendedor</dt>
              <Club57AssignVendedor
                memberId={memberDetail.id}
                memberName={memberDetail.full_name}
                currentVendedorId={memberDetail.creado_por_vendedor_id}
                currentLabel={club57VendedorLabel(
                  memberDetail.origen_alta,
                  memberDetail.creado_por_vendedor_id,
                  vendedorNombre
                )}
                vendedores={vendedores}
              />
            </div>
          </dl>
          {(asignaciones ?? []).length > 0 && (
            <div className="mt-4 border-t border-brand-slate/10 pt-3">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                Cambios de vendedor
              </h3>
              <ul className="mt-2 flex flex-col gap-1.5 font-sans text-xs text-brand-slate">
                {(asignaciones ?? []).map((cambio) => (
                  <li key={cambio.id as string}>
                    {dateFormatter.format(new Date(cambio.created_at as string))}:{" "}
                    {nombreVendedor(cambio.vendedor_anterior_id as string | null)} →{" "}
                    <span className="font-medium text-brand-black">
                      {nombreVendedor(cambio.vendedor_nuevo_id as string | null)}
                    </span>
                    {cambio.actor_id && <> · por {nombrePorId.get(cambio.actor_id as string) ?? "personal"}</>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Saldo de puntos</h2>
          <p className={`font-display text-3xl ${saldoDisponible < 0 ? "text-red-700" : "text-brand-black"}`}>
            {saldoDisponible} pts
          </p>
          <p className="mt-1 font-sans text-sm text-brand-slate/70">Disponibles para canje</p>
          {saldoDisponible < 0 && (
            <p className="mt-2 font-sans text-sm text-brand-slate">
              Saldo negativo por una compra cancelada o corregida, o una cortesía anulada, cuyos puntos ya estaban
              disponibles. Se compensa con sus próximas compras.
            </p>
          )}
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
        <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Otorgar puntos de cortesía</h2>
        <Club57GrantCortesia
          memberId={memberDetail.id}
          memberName={memberDetail.full_name}
          saldoDisponible={saldoDisponible}
          maxPuntos={maxPuntosCortesia}
        />
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Historial de puntos</h2>
        <Club57StaffLedgerHistory
          rows={ledgerRows}
          role="admin"
          hoy={todayInStoreTimezone()}
          montoPorPunto={montoPorPunto}
          nombrePersonal={Object.fromEntries(nombrePorId)}
        />
      </div>
    </div>
  );
}
