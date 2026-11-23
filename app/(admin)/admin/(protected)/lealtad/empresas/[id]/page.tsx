import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmpresaForm, type EmpresaFormValues } from "@/components/admin/empresas/EmpresaForm";
import { EmpresaEstadoAcciones } from "@/components/admin/empresas/EmpresaEstadoAcciones";
import { EstadoEmpresaBadge } from "@/components/admin/empresas/EstadoEmpresaBadge";
import { createClient } from "@/lib/supabase/server";
import { CONVENIO_SUGERIDO, diaCorteLabel, nominaLabel, type EstadoEmpresa, type FrecuenciaNomina } from "@/lib/club57/empresas/datos";

export const metadata: Metadata = { title: "Empresa — Club 57 Empresarial" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
  const [{ data: e }, { data: bitacora }, { data: personal }] = await Promise.all([
    supabase.from("club57_empresas").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("club57_empresas_bitacora")
      .select("id, accion, detalle, actor_id, created_at")
      .eq("empresa_id", params.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("profiles").select("id, full_name").in("role", ["admin", "operador"]),
  ]);
  if (!e) notFound();

  // Una solicitud del sitio llega sin convenio: se proponen los valores
  // sugeridos para que el equipo solo decida el límite de crédito.
  const sugerido = (valor: unknown, porDefecto: string) =>
    valor === null || valor === undefined ? (e.estado === "solicitud" ? porDefecto : "") : String(valor);
  const d = CONVENIO_SUGERIDO;

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
        {estado === "activa" && (
          <p className="font-sans text-xs text-brand-slate/70">
            El acceso del responsable al Portal Empresa y el registro de empleados con el código llegan en la siguiente etapa.
          </p>
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
