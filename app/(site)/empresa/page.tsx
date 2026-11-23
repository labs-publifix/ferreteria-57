import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CodigoEmpresaCard } from "@/components/empresa/CodigoEmpresaCard";
import { NominaForm } from "@/components/empresa/NominaForm";
import { getPortalEmpresa, mapPortalEmpleado } from "@/lib/club57/empresas/portal";
import { diaCorteLabel } from "@/lib/club57/empresas/datos";
import { appUrl } from "@/lib/club57/empresas/notificaciones";

const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

// Portal Empresa · Inicio: resumen, código para compartir, convenio y nómina.
export default async function PortalEmpresaInicio() {
  const { supabase, empresa } = await getPortalEmpresa();
  if (!empresa) return null;
  const { data } = await supabase.rpc("club57_portal_empleados");
  const empleados = ((data ?? []) as Record<string, unknown>[]).map(mapPortalEmpleado);
  const activos = empleados.filter((e) => e.estado === "activo");
  const pendientes = empleados.filter((e) => e.estado === "pendiente").length;
  const lineaAsignada = activos.reduce((sum, e) => sum + (e.linea_credito ?? 0), 0);

  const resumen = [
    { label: "Empleados activos", value: String(activos.length) },
    { label: "Solicitudes por revisar", value: String(pendientes) },
    { label: "Líneas asignadas", value: pesos.format(lineaAsignada) },
    { label: "Límite de crédito con Ferretería 57", value: empresa.limite_credito === null ? "—" : pesos.format(empresa.limite_credito) },
  ];

  return (
    <div className="flex flex-col gap-6">
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
          </div>
        ))}
      </dl>

      {empresa.codigo && (
        <CodigoEmpresaCard codigo={empresa.codigo} empresa={empresa.nombre_comercial} registroUrl={appUrl("/cuenta?registro=1")} />
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
