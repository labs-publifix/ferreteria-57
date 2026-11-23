import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ESTADO_CICLO_CLASS, ESTADO_CICLO_LABEL, fechaCorta, mapCiclo, periodoLabel, type EstadoCiclo } from "@/lib/club57/empresas/cortes";
import { ultimoDiaPlazo } from "@/lib/club57/empresas/pedidos";

export const metadata: Metadata = { title: "Cortes · Club 57 Empresarial — Panel de administración" };

const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const FILTROS: { id: string; label: string; estados: EstadoCiclo[] }[] = [
  { id: "pendientes", label: "Por atender", estados: ["revision", "conciliado", "facturado", "vencido"] },
  { id: "revision", label: "En revisión", estados: ["revision"] },
  { id: "conciliado", label: "Por facturar", estados: ["conciliado"] },
  { id: "facturado", label: "Por cobrar", estados: ["facturado"] },
  { id: "vencido", label: "Vencidos", estados: ["vencido"] },
  { id: "abierto", label: "En curso", estados: ["abierto"] },
  { id: "pagado", label: "Pagados", estados: ["pagado"] },
];

// Panel · todos los cortes de Club 57 Empresarial: qué revisar, facturar y cobrar.
export default async function CortesAdminPage({ searchParams }: { searchParams: { estado?: string } }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("club57_admin_ciclos", { p_empresa_id: null });
  const ciclos = ((data ?? []) as Record<string, unknown>[]).map(mapCiclo);
  const filtro = FILTROS.find((f) => f.id === searchParams.estado) ?? FILTROS[0];
  const lista = ciclos.filter((c) => filtro.estados.includes(c.estado));
  const conteo = (f: (typeof FILTROS)[number]) => ciclos.filter((c) => f.estados.includes(c.estado)).length;

  const siguientePaso = (c: (typeof ciclos)[number]) => {
    switch (c.estado) {
      case "abierto":
        return `Cierra el ${fechaCorta(c.periodo_fin)}`;
      case "revision":
        return c.observaciones_abiertas > 0
          ? `${c.observaciones_abiertas} observaciones por resolver`
          : `Revisión de la empresa hasta el ${c.revision_vence_at ? ultimoDiaPlazo(c.revision_vence_at) : "—"}`;
      case "conciliado":
        return "Registrar factura";
      case "facturado":
        return `Cobrar · vence el ${c.pago_vence ? fechaCorta(c.pago_vence) : "—"}`;
      case "vencido":
        return `Pago vencido desde el ${c.pago_vence ? fechaCorta(c.pago_vence) : "—"} · empresa suspendida`;
      default:
        return c.pago_fecha ? `Pagado el ${fechaCorta(c.pago_fecha)}` : c.nota ?? "Pagado";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/lealtad/empresas" className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black">
          ← Empresas
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">Cortes y facturación</h1>
        <p className="mt-1 max-w-prose font-sans text-sm text-brand-slate/70">
          Cada empresa cierra su corte el día de su convenio. La empresa revisa su estado de cuenta, se registra la factura y luego el
          pago; si el pago vence, la empresa se suspende sola.
        </p>
      </div>

      <nav aria-label="Filtrar cortes" className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f.id}
            href={`/admin/lealtad/empresas/cortes?estado=${f.id}`}
            aria-current={f.id === filtro.id ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-full border px-4 font-sans text-sm font-semibold ${
              f.id === filtro.id ? "border-brand-slate bg-brand-slate text-white" : "border-brand-slate/30 bg-white text-brand-black hover:border-brand-slate"
            }`}
          >
            {f.label} ({conteo(f)})
          </Link>
        ))}
      </nav>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudieron cargar los cortes.
        </p>
      ) : lista.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">Nada en esta lista.</p>
      ) : (
        <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Siguiente paso</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id} className="border-b border-brand-slate/10 last:border-0 hover:bg-brand-gray/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/lealtad/empresas/${c.empresa_id}#cortes`} className="font-semibold text-brand-slate underline underline-offset-2">
                      {c.empresa_nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-brand-slate">{periodoLabel(c.periodo_inicio, c.periodo_fin)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_CICLO_CLASS[c.estado]}`}>{ESTADO_CICLO_LABEL[c.estado]}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-brand-black">{pesos.format(c.total)}</td>
                  <td className="px-4 py-3 text-brand-slate">{siguientePaso(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
