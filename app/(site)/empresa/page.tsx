import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CodigoEmpresaCard } from "@/components/empresa/CodigoEmpresaCard";
import { NominaForm } from "@/components/empresa/NominaForm";
import { getPortalEmpresa, mapPortalEmpleado, mapPortalPedido } from "@/lib/club57/empresas/portal";
import { diaCorteLabel } from "@/lib/club57/empresas/datos";
import { appUrl } from "@/lib/club57/empresas/notificaciones";
import { agruparNominas, fechaNominaLabel, mapPortalDescuento } from "@/lib/club57/empresas/nomina";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";

const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

// Portal Empresa · Inicio: resumen, código para compartir, convenio y nómina.
export default async function PortalEmpresaInicio() {
  const { supabase, empresa } = await getPortalEmpresa();
  if (!empresa) return null;
  const [{ data }, { data: pedidosData }, { data: descuentosData }] = await Promise.all([
    supabase.rpc("club57_portal_empleados"),
    supabase.rpc("club57_portal_pedidos"),
    supabase.rpc("club57_portal_descuentos"),
  ]);
  const nominas = agruparNominas(
    ((descuentosData ?? []) as Record<string, unknown>[]).map(mapPortalDescuento),
    todayInStoreTimezone()
  );
  const proximaNomina = nominas.proximas[0] ?? null;
  const empleados = ((data ?? []) as Record<string, unknown>[]).map(mapPortalEmpleado);
  const pedidos = ((pedidosData ?? []) as Record<string, unknown>[]).map(mapPortalPedido);
  const pedidosPorAutorizar = pedidos.filter((p) => p.status === "pendiente_autorizacion");
  // Crédito con Ferretería 57 comprometido: pedidos con cargo a la empresa
  // no cancelados (en espera o autorizados).
  const comprometido = pedidos.filter((p) => p.status !== "cancelado").reduce((sum, p) => sum + p.total, 0);
  const activos = empleados.filter((e) => e.estado === "activo");
  const pendientes = empleados.filter((e) => e.estado === "pendiente").length;
  const lineaAsignada = activos.reduce((sum, e) => sum + (e.linea_credito ?? 0), 0);

  const resumen = [
    { label: "Pedidos por autorizar", value: String(pedidosPorAutorizar.length) },
    { label: "Empleados activos", value: String(activos.length) },
    { label: "Líneas asignadas", value: pesos.format(lineaAsignada) },
    {
      label: "Crédito disponible con Ferretería 57",
      value: empresa.limite_credito === null ? "—" : pesos.format(Math.max(empresa.limite_credito - comprometido, 0)),
      nota: empresa.limite_credito === null ? null : `de ${pesos.format(empresa.limite_credito)}`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {pedidosPorAutorizar.length > 0 && (
        <Link
          href="/empresa/pedidos"
          className="flex items-center justify-between gap-3 rounded-lg border-l-4 border-brand-orange bg-white px-4 py-3 font-sans text-sm text-brand-black shadow-sm hover:bg-brand-gray/50"
        >
          <span>
            {pedidosPorAutorizar.length === 1 ? "Tienes 1 pedido" : `Tienes ${pedidosPorAutorizar.length} pedidos`} esperando tu autorización (
            {pesos.format(pedidosPorAutorizar.reduce((sum, p) => sum + p.total, 0))}).
          </span>
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      )}

      {nominas.porConfirmar.map((n) => (
        <Link
          key={n.fecha}
          href="/empresa/nomina"
          className="flex items-center justify-between gap-3 rounded-lg border-l-4 border-brand-orange bg-white px-4 py-3 font-sans text-sm text-brand-black shadow-sm hover:bg-brand-gray/50"
        >
          <span>
            Confirma los descuentos de la nómina del {fechaNominaLabel(n.fecha)} ({pesos.format(n.total)}).
          </span>
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      ))}

      {pendientes > 0 && (
        <Link
          href="/empresa/empleados"
          className="flex items-center justify-between gap-3 rounded-lg border-l-4 border-brand-orange bg-white px-4 py-3 font-sans text-sm text-brand-black shadow-sm hover:bg-brand-gray/50"
        >
          <span>
            {pendientes === 1 ? "Tienes 1 solicitud" : `Tienes ${pendientes} solicitudes`} de empleados por revisar.
          </span>
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      )}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {resumen.map((item) => (
          <div key={item.label} className="rounded-lg bg-white px-4 py-3 shadow-sm">
            <dt className="font-sans text-xs text-brand-slate/70">{item.label}</dt>
            <dd className="mt-1 font-display text-xl text-brand-black sm:text-2xl">{item.value}</dd>
            {"nota" in item && item.nota && <dd className="font-sans text-xs text-brand-slate/70">{item.nota}</dd>}
          </div>
        ))}
      </dl>

      {empresa.codigo && (
        <CodigoEmpresaCard codigo={empresa.codigo} empresa={empresa.nombre_comercial} registroUrl={appUrl("/cuenta?registro=1")} />
      )}

      {proximaNomina && (
        <Link
          href="/empresa/nomina"
          className="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 font-sans text-sm text-brand-black shadow-sm hover:bg-brand-gray/50"
        >
          <span>
            Próxima nómina: <strong>{fechaNominaLabel(proximaNomina.fecha)}</strong> · {pesos.format(proximaNomina.total)} a descontar
            a {proximaNomina.empleados.length} {proximaNomina.empleados.length === 1 ? "colaborador" : "colaboradores"}.
          </span>
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      )}

      <NominaForm
        initial={{
          frecuencia: empresa.nomina_frecuencia ?? "",
          diaSemana: String(empresa.nomina_dia_semana ?? 5),
          diaMes: String(empresa.nomina_dia_mes ?? 0),
          descuentos: String(empresa.descuentos_por_compra),
          politica: empresa.politica_porcentaje === null ? "" : String(empresa.politica_porcentaje),
        }}
      />

      <section className="rounded-lg bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-base uppercase text-brand-slate">Tu convenio con Ferretería 57</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 font-sans text-sm sm:grid-cols-3">
          <div>
            <dt className="text-brand-slate/70">Corte</dt>
            <dd className="font-semibold text-brand-black">{diaCorteLabel(empresa.dia_corte)}</dd>
          </div>
          <div>
            <dt className="text-brand-slate/70">Plazo de pago</dt>
            <dd className="font-semibold text-brand-black">
              {empresa.plazo_pago_dias === null ? "—" : `${empresa.plazo_pago_dias} días después de recibir la factura`}
            </dd>
          </div>
          <div>
            <dt className="text-brand-slate/70">Plazo para autorizar pedidos</dt>
            <dd className="font-semibold text-brand-black">{empresa.plazo_autorizacion_dias} días hábiles</dd>
          </div>
        </dl>
        <p className="mt-3 font-sans text-xs text-brand-slate/70">Para cambiar estas condiciones, escríbenos.</p>
      </section>
    </div>
  );
}
