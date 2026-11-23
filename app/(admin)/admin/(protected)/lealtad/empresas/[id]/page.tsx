import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmpresaForm, type EmpresaFormValues } from "@/components/admin/empresas/EmpresaForm";
import { EmpresaEstadoAcciones } from "@/components/admin/empresas/EmpresaEstadoAcciones";
import { EstadoEmpresaBadge } from "@/components/admin/empresas/EstadoEmpresaBadge";
import { AccesoResponsable } from "@/components/admin/empresas/AccesoResponsable";
import { ESTADO_EMPLEADO_LABEL, type EstadoEmpleado } from "@/lib/club57/empresas/empleados";
import { createClient } from "@/lib/supabase/server";
import { CONVENIO_SUGERIDO, diaCorteLabel, nominaLabel, type EstadoEmpresa, type FrecuenciaNomina } from "@/lib/club57/empresas/datos";

export const metadata: Metadata = { title: "Empresa — Club 57 Empresarial" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const fechaHora = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" });

const ACCION_LABEL: Record<string, string> = {
  solicitud: "Solicitud recibida",
  alta: "Alta",
  aprobada: "Aprobada y activada",
  rechazada: "Rechazada",
  suspendida: "Suspendida",
  reactivada: "Reactivada",
  baja: "Baja",
  datos: "Datos actualizados",
  convenio: "Convenio actualizado",
  codigo: "Código cambiado",
  responsable: "Responsable",
  nomina: "Nómina",
};

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export default async function AdminEmpresaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { aviso?: string };
}) {
  if (!UUID_RE.test(params.id)) notFound();
  const supabase = await createClient();
  const [{ data: e }, { data: bitacora }, { data: personal }, { data: empleadosData }, { data: pedidosData }] = await Promise.all([
    supabase.from("club57_empresas").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("club57_empresas_bitacora")
      .select("id, accion, detalle, actor_id, created_at")
      .eq("empresa_id", params.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("profiles").select("id, full_name").in("role", ["admin", "operador"]),
    // Empleados de la empresa: línea, nunca el salario (no es visible para el personal).
    supabase
      .from("club57_empresa_empleados")
      .select("id, estado, numero_empleado, linea_credito, solicitado_at, motivo, club57_members(full_name, email)")
      .eq("empresa_id", params.id)
      .order("solicitado_at", { ascending: false }),
    // Pedidos con cargo a la empresa (para el crédito comprometido).
    supabase.from("orders").select("status, total").eq("empresa_id", params.id).eq("metodo_pago", "empresa"),
  ]);
  if (!e) notFound();

  // Una solicitud del sitio llega sin convenio: se proponen los valores
  // sugeridos para que el equipo solo decida el límite de crédito.
  const sugerido = (valor: unknown, porDefecto: string) =>
    valor === null || valor === undefined ? (e.estado === "solicitud" ? porDefecto : "") : String(valor);
  const d = CONVENIO_SUGERIDO;

  const pedidosEmpresa = (pedidosData ?? []) as { status: string; total: number | string }[];
  const enEspera = pedidosEmpresa.filter((p) => p.status === "pendiente_autorizacion");
  const comprometido = pedidosEmpresa.filter((p) => p.status !== "cancelado").reduce((sum, p) => sum + Number(p.total), 0);

  const empleados = (empleadosData ?? []).map((row) => {
    const m = (Array.isArray(row.club57_members) ? row.club57_members[0] : row.club57_members) as
      | { full_name: string; email: string }
      | null;
    return {
      id: row.id as string,
      estado: row.estado as EstadoEmpleado,
      numero: row.numero_empleado as string | null,
      linea: row.linea_credito === null ? null : Number(row.linea_credito),
      solicitado_at: row.solicitado_at as string,
      motivo: row.motivo as string | null,
      nombre: m?.full_name ?? "—",
      correo: m?.email ?? "",
    };
  });

  const nombres = new Map((personal ?? []).map((p) => [p.id as string, (p.full_name as string | null)?.trim() || "Personal"]));
  const estado = e.estado as EstadoEmpresa;

  const initialValues: EmpresaFormValues = {
    datos: {
      razon_social: s(e.razon_social),
      nombre_comercial: s(e.nombre_comercial),
      rfc: s(e.rfc),
      giro: s(e.giro),
      num_empleados: s(e.num_empleados),
      regimen_fiscal: s(e.regimen_fiscal),
      cp_fiscal: s(e.cp_fiscal),
      uso_cfdi: s(e.uso_cfdi),
      correo_facturas: s(e.correo_facturas),
      domicilio_entrega: s(e.domicilio_entrega),
      responsable_nombre: s(e.responsable_nombre),
      responsable_puesto: s(e.responsable_puesto),
      responsable_correo: s(e.responsable_correo),
      responsable_telefono: s(e.responsable_telefono),
    },
    convenio: {
      limite_credito: e.limite_credito === null ? "" : String(Number(e.limite_credito)),
      dia_corte: sugerido(e.dia_corte, d.dia_corte),
      plazo_pago_dias: sugerido(e.plazo_pago_dias, d.plazo_pago_dias),
      plazo_autorizacion_dias: s(e.plazo_autorizacion_dias),
      exige_numero_empleado: Boolean(e.exige_numero_empleado),
      nomina_frecuencia: sugerido(e.nomina_frecuencia, d.nomina_frecuencia),
      nomina_dia_semana: s(e.nomina_dia_semana ?? 5),
      nomina_dia_mes: s(e.nomina_dia_mes ?? 0),
      descuentos_por_compra: s(e.descuentos_por_compra),
      politica_porcentaje: e.politica_porcentaje === null ? "" : String(Number(e.politica_porcentaje)),
    },
    notas_internas: s(e.notas_internas),
  };

  const resumen = [
    { label: "Límite de crédito", value: e.limite_credito === null ? "Sin definir" : `$${Number(e.limite_credito).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` },
    { label: "Corte", value: diaCorteLabel(e.dia_corte) },
    { label: "Plazo de pago", value: e.plazo_pago_dias === null ? "Sin definir" : `${e.plazo_pago_dias} días` },
    { label: "Nómina", value: nominaLabel(e.nomina_frecuencia as FrecuenciaNomina | null, e.nomina_dia_semana, e.nomina_dia_mes) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/lealtad/empresas" className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black">
          ← Empresas
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">{e.nombre_comercial}</h1>
          <EstadoEmpresaBadge estado={estado} />
        </div>
        <p className="mt-1 font-sans text-sm text-brand-slate/70">
          {e.razon_social}
          {e.rfc ? ` · ${e.rfc}` : ""} · {e.origen === "solicitud" ? "Solicitud del sitio" : "Alta desde el panel"} ·{" "}
          {fechaHora.format(new Date(e.created_at))}
        </p>
      </div>

      {searchParams.aviso === "convenio" && estado === "solicitud" && (
        <p role="status" className="rounded-md bg-amber-50 px-4 py-2.5 font-sans text-sm text-amber-900">
          La empresa se guardó como solicitud porque el convenio está incompleto. Completa límite de crédito, día de corte y
          plazo de pago y después usa «Aprobar y activar».
        </p>
      )}
      {e.motivo_estado && (estado === "suspendida" || estado === "baja" || estado === "rechazada") && (
        <p className="rounded-md border-l-4 border-red-600 bg-red-50 px-4 py-2.5 font-sans text-sm text-red-800">
          <strong>Motivo:</strong> {e.motivo_estado}
        </p>
      )}

      <section className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {resumen.map((item) => (
            <div key={item.label} className="rounded-md border border-brand-slate/15 px-3 py-2.5">
              <dt className="font-sans text-xs text-brand-slate/70">{item.label}</dt>
              <dd className="font-sans text-sm font-semibold text-brand-black">{item.value}</dd>
            </div>
          ))}
        </dl>
        <EmpresaEstadoAcciones empresaId={e.id} nombre={e.nombre_comercial} estado={estado} codigo={e.codigo} />
        <AccesoResponsable
          empresaId={e.id}
          correo={e.responsable_correo}
          tieneAcceso={Boolean(e.responsable_user_id)}
          habilitado={estado === "activa" || estado === "suspendida"}
        />
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base uppercase text-brand-slate">Pedidos con cargo a la empresa</h2>
          <a
            href="/admin/pedidos?pago=empresa"
            className="font-sans text-sm font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
          >
            Ver en Pedidos
          </a>
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-3 font-sans text-sm sm:grid-cols-3">
          <div className="rounded-md bg-brand-gray/60 px-4 py-3">
            <dt className="text-brand-slate/70">Crédito comprometido</dt>
            <dd className="font-semibold text-brand-black">
              {pesos.format(comprometido)}
              {e.limite_credito !== null && <span className="font-normal text-brand-slate"> de {pesos.format(Number(e.limite_credito))}</span>}
            </dd>
          </div>
          <div className="rounded-md bg-brand-gray/60 px-4 py-3">
            <dt className="text-brand-slate/70">En espera de autorización</dt>
            <dd className="font-semibold text-brand-black">
              {enEspera.length} · {pesos.format(enEspera.reduce((sum, p) => sum + Number(p.total), 0))}
            </dd>
          </div>
          <div className="rounded-md bg-brand-gray/60 px-4 py-3">
            <dt className="text-brand-slate/70">Autorizados</dt>
            <dd className="font-semibold text-brand-black">
              {pedidosEmpresa.filter((p) => !["pendiente_autorizacion", "cancelado"].includes(p.status)).length}
            </dd>
          </div>
        </dl>
        <p className="mt-2 font-sans text-xs text-brand-slate/70">
          Comprometido: pedidos con cargo a la empresa en espera o autorizados, sin contar los cancelados.
        </p>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base uppercase text-brand-slate">Empleados</h2>
          <p className="font-sans text-sm text-brand-slate/70">
            {empleados.filter((x) => x.estado === "activo").length} activos ·{" "}
            {empleados.filter((x) => x.estado === "pendiente").length} en revisión · líneas asignadas{" "}
            {pesos.format(empleados.filter((x) => x.estado === "activo").reduce((sum, x) => sum + (x.linea ?? 0), 0))}
          </p>
        </div>
        <p className="mt-1 font-sans text-xs text-brand-slate/70">
          La empresa aprueba a sus empleados y define su línea desde su portal. El salario solo lo ve la empresa.
        </p>
        {empleados.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-brand-slate/70">Todavía no hay empleados vinculados.</p>
        ) : (
          <div className="mt-3 min-w-0 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                  <th className="py-2 pr-3">Empleado</th>
                  <th className="py-2 pr-3">Número</th>
                  <th className="py-2 pr-3 text-right">Línea</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2">Solicitud</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map((x) => (
                  <tr key={x.id} className="border-b border-brand-slate/10 last:border-0">
                    <td className="py-2 pr-3">
                      <p className="text-brand-black">{x.nombre}</p>
                      <p className="text-xs text-brand-slate/70">{x.correo}</p>
                    </td>
                    <td className="py-2 pr-3 text-brand-slate">{x.numero ?? "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-brand-black">{x.linea === null ? "—" : pesos.format(x.linea)}</td>
                    <td className="py-2 pr-3 text-brand-slate">
                      {ESTADO_EMPLEADO_LABEL[x.estado]}
                      {x.motivo && x.estado !== "activo" ? <span className="block text-xs text-brand-slate/70">{x.motivo}</span> : null}
                    </td>
                    <td className="py-2 text-brand-slate">{fechaHora.format(new Date(x.solicitado_at))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <EmpresaForm mode="edit" empresaId={e.id} initialValues={initialValues} />

      <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-display text-base uppercase text-brand-slate">Bitácora</h2>
        {(bitacora ?? []).length === 0 ? (
          <p className="mt-2 font-sans text-sm text-brand-slate/70">Sin movimientos.</p>
        ) : (
          <ol className="mt-3 flex flex-col divide-y divide-brand-slate/10">
            {(bitacora ?? []).map((item) => (
              <li key={item.id} className="flex flex-col gap-0.5 py-2.5 font-sans text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <span className="font-semibold text-brand-black">{ACCION_LABEL[item.accion] ?? item.accion}</span>
                  {item.detalle && <span className="text-brand-slate"> · {item.detalle}</span>}
                </div>
                <span className="shrink-0 text-xs text-brand-slate/70">
                  {fechaHora.format(new Date(item.created_at))}
                  {item.actor_id ? ` · ${nombres.get(item.actor_id) ?? "Personal"}` : " · Sitio"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
