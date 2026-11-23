"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClassName, Modal, Select } from "@/components/ui";
import { cerrarEmpleado, guardarEmpleado } from "@/app/(site)/empresa/actions";
import { DIAS_SEMANA, FRECUENCIA_LABEL, nominaLabel, type FrecuenciaNomina } from "@/lib/club57/empresas/datos";
import { calcularLinea, ESTADO_EMPLEADO_LABEL, parseNumero, type LineaTipo } from "@/lib/club57/empresas/empleados";
import type { PortalEmpleado } from "@/lib/club57/empresas/portal";

type Vista = "solicitudes" | "activos" | "historial";

const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const fecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" });
const inputClass =
  "min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2.5 font-sans text-base text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:text-sm";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";
const dangerClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-red-700 px-4 font-sans text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700";

export interface EmpresaPortalInfo {
  exigeNumero: boolean;
  politica: number | null;
  nomina: { frecuencia: FrecuenciaNomina | null; diaSemana: number | null; diaMes: number | null };
}

export function EmpleadosManager({ empleados, empresa }: { empleados: PortalEmpleado[]; empresa: EmpresaPortalInfo }) {
  const grupos = useMemo(
    () => ({
      solicitudes: empleados.filter((e) => e.estado === "pendiente"),
      activos: empleados.filter((e) => e.estado === "activo"),
      historial: empleados.filter((e) => !["pendiente", "activo"].includes(e.estado)),
    }),
    [empleados]
  );
  const [vista, setVista] = useState<Vista>(grupos.solicitudes.length > 0 ? "solicitudes" : "activos");
  const [editar, setEditar] = useState<PortalEmpleado | null>(null);
  const [cerrar, setCerrar] = useState<PortalEmpleado | null>(null);
  const lista = grupos[vista];
  const nominaEmpresa = nominaLabel(empresa.nomina.frecuencia, empresa.nomina.diaSemana, empresa.nomina.diaMes);

  const tabs: { id: Vista; label: string }[] = [
    { id: "solicitudes", label: `Solicitudes (${grupos.solicitudes.length})` },
    { id: "activos", label: `Activos (${grupos.activos.length})` },
    { id: "historial", label: `Historial (${grupos.historial.length})` },
  ];

  return (
    <section className="flex flex-col gap-4">
      <div role="tablist" aria-label="Empleados" className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={vista === tab.id}
            onClick={() => setVista(tab.id)}
            className={`min-h-11 rounded-full border px-4 font-sans text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate ${
              vista === tab.id ? "border-brand-slate bg-brand-slate text-white" : "border-brand-slate/30 bg-white text-brand-black hover:border-brand-slate"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/80 shadow-sm">
          {vista === "solicitudes"
            ? "No hay solicitudes por revisar. Comparte el código de tu empresa para que tus colaboradores se registren."
            : vista === "activos"
              ? "Todavía no hay empleados activos."
              : "Sin movimientos."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.map((e) => (
            <li key={e.id} className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <p className="font-sans text-base font-semibold text-brand-black">{e.nombre}</p>
                <p className="break-all font-sans text-sm text-brand-slate">
                  {e.correo}
                  {e.numero_empleado ? ` · No. ${e.numero_empleado}` : ""}
                </p>
                {vista === "activos" && (
                  <p className="mt-1 font-sans text-sm text-brand-black">
                    Línea <strong>{e.linea_credito === null ? "—" : pesos.format(e.linea_credito)}</strong>
                    <span className="text-brand-slate">
                      {e.linea_tipo === "porcentaje" && e.linea_porcentaje !== null ? ` · ${e.linea_porcentaje} % del salario` : " · monto fijo"}
                      {e.salario_mensual !== null ? ` · salario ${pesos.format(e.salario_mensual)}` : ""}
                      {` · ${e.nomina_frecuencia ? `nómina ${FRECUENCIA_LABEL[e.nomina_frecuencia].toLowerCase()}` : "nómina de la empresa"}`}
                    </span>
                    {e.aprobado_automatico && <span className="text-brand-slate/70"> · aprobado por precarga</span>}
                  </p>
                )}
                <p className="mt-1 font-sans text-xs text-brand-slate/70">
                  {vista === "historial"
                    ? `${ESTADO_EMPLEADO_LABEL[e.estado]} · ${fecha.format(new Date(e.resuelto_at ?? e.solicitado_at))}${e.motivo ? ` · ${e.motivo}` : ""}`
                    : `Solicitó el ${fecha.format(new Date(e.solicitado_at))}${e.origen === "registro" ? " al registrarse" : " desde Mi cuenta"}`}
                </p>
              </div>
              {vista !== "historial" && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button type="button" onClick={() => setEditar(e)}>
                    {vista === "solicitudes" ? "Aprobar" : "Editar"}
                  </Button>
                  <button type="button" onClick={() => setCerrar(e)} className={dangerClass}>
                    {vista === "solicitudes" ? "Rechazar" : "Dar de baja"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editar && <EmpleadoModal empleado={editar} empresa={empresa} nominaEmpresa={nominaEmpresa} onClose={() => setEditar(null)} />}
      {cerrar && <CerrarModal empleado={cerrar} onClose={() => setCerrar(null)} />}
    </section>
  );
}

function EmpleadoModal({
  empleado,
  empresa,
  nominaEmpresa,
  onClose,
}: {
  empleado: PortalEmpleado;
  empresa: EmpresaPortalInfo;
  nominaEmpresa: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const baseId = useId();
  const esSolicitud = empleado.estado === "pendiente";
  const [numero, setNumero] = useState(empleado.numero_empleado ?? "");
  const [salario, setSalario] = useState(empleado.salario_mensual === null ? "" : String(empleado.salario_mensual));
  const [tipo, setTipo] = useState<LineaTipo>(
    empleado.linea_tipo ?? (empresa.politica !== null ? "porcentaje" : "monto")
  );
  const [valor, setValor] = useState(
    empleado.linea_tipo === "porcentaje"
      ? String(empleado.linea_porcentaje ?? "")
      : empleado.linea_tipo === "monto"
        ? String(empleado.linea_credito ?? "")
        : empresa.politica !== null
          ? String(empresa.politica)
          : ""
  );
  const [frecuencia, setFrecuencia] = useState<string>(empleado.nomina_frecuencia ?? "");
  const [diaSemana, setDiaSemana] = useState(String(empleado.nomina_dia_semana ?? 5));
  const [diaMes, setDiaMes] = useState(String(empleado.nomina_dia_mes ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);

  const salarioN = parseNumero(salario);
  const valorN = parseNumero(valor);
  const calculo =
    Number.isNaN(salarioN) || Number.isNaN(valorN) || valorN === null ? null : calcularLinea(tipo, valorN, salarioN);

  async function guardar() {
    if (guardandoRef.current) return;
    guardandoRef.current = true;
    setGuardando(true);
    setError(null);
    const result = await guardarEmpleado({
      empleadoId: empleado.id,
      salario,
      lineaTipo: tipo,
      lineaValor: valor,
      numero,
      nominaFrecuencia: frecuencia,
      nominaDiaSemana: diaSemana,
      nominaDiaMes: diaMes,
    });
    guardandoRef.current = false;
    setGuardando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal titleId={`${baseId}-t`} onClose={onClose} maxWidthClassName="max-w-lg">
      <div className="flex flex-col gap-4 text-left">
        <div className="pr-10">
          <h2 id={`${baseId}-t`} className="font-display text-lg uppercase text-brand-slate">
            {esSolicitud ? "Aprobar empleado" : "Editar empleado"}
          </h2>
          <p className="mt-1 font-sans text-sm text-brand-slate/80">
            {empleado.nombre} · {empleado.correo}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${baseId}-num`} className={labelClass}>
              Número de empleado{empresa.exigeNumero ? "" : " (opcional)"}
            </label>
            <input id={`${baseId}-num`} value={numero} onChange={(e) => setNumero(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor={`${baseId}-sal`} className={labelClass}>
              Salario mensual neto{tipo === "monto" ? " (opcional)" : ""}
            </label>
            <input id={`${baseId}-sal`} inputMode="decimal" value={salario} onChange={(e) => setSalario(e.target.value)} className={inputClass} />
            <p className="mt-1 font-sans text-xs text-brand-slate/70">Solo lo ve tu empresa.</p>
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>Línea de crédito</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {(
              [
                { id: "porcentaje", label: "% del salario" },
                { id: "monto", label: "Monto fijo" },
              ] as const
            ).map((opcion) => (
              <label
                key={opcion.id}
                className={`inline-flex min-h-11 cursor-pointer items-center rounded-md border-2 px-4 font-sans text-sm font-semibold focus-within:ring-2 focus-within:ring-brand-slate ${
                  tipo === opcion.id ? "border-brand-orange bg-brand-orange/10 text-brand-black" : "border-brand-slate/30 text-brand-black"
                }`}
              >
                <input type="radio" name={`${baseId}-tipo`} value={opcion.id} checked={tipo === opcion.id} onChange={() => setTipo(opcion.id)} className="sr-only" />
                {opcion.label}
              </label>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
            <div>
              <label htmlFor={`${baseId}-val`} className={labelClass}>
                {tipo === "porcentaje" ? "Porcentaje" : "Monto (MXN)"}
              </label>
              <input id={`${baseId}-val`} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className={inputClass} />
            </div>
            <div className="rounded-md bg-brand-gray px-4 py-2.5" aria-live="polite">
              <p className="font-sans text-xs text-brand-slate/70">Línea resultante</p>
              <p className={`font-display text-xl ${calculo && "error" in calculo ? "text-red-700" : "text-brand-black"}`}>
                {calculo && "linea" in calculo ? pesos.format(calculo.linea) : "—"}
              </p>
            </div>
          </div>
          {calculo && "error" in calculo && <p className="mt-1 font-sans text-xs text-red-700">{calculo.error}</p>}
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className={labelClass}>Nómina</span>
            <Select
              value={frecuencia}
              onChange={setFrecuencia}
              label="Nómina"
              options={[
                { value: "", label: `Igual que la empresa (${nominaEmpresa})` },
                { value: "semanal", label: "Semanal" },
                { value: "quincenal", label: "Quincenal (días 15 y último)" },
                { value: "mensual", label: "Mensual" },
              ]}
            />
          </div>
          {frecuencia === "semanal" && (
            <div>
              <span className={labelClass}>Día de pago</span>
              <Select
                value={diaSemana}
                onChange={setDiaSemana}
                label="Día de pago"
                options={DIAS_SEMANA.map((dia, i) => ({ value: String(i + 1), label: dia }))}
              />
            </div>
          )}
          {frecuencia === "mensual" && (
            <div>
              <span className={labelClass}>Día de pago</span>
              <Select
                value={diaMes}
                onChange={setDiaMes}
                label="Día de pago"
                options={[{ value: "0", label: "Último día del mes" }, ...Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `Día ${i + 1}` }))]}
              />
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={buttonClassName("secondary", "w-full sm:w-auto")}>
            Volver
          </button>
          <Button type="button" onClick={guardar} disabled={guardando || !calculo || "error" in calculo} className="w-full sm:w-auto">
            {guardando ? "Guardando…" : esSolicitud ? "Aprobar" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CerrarModal({ empleado, onClose }: { empleado: PortalEmpleado; onClose: () => void }) {
  const router = useRouter();
  const baseId = useId();
  const esSolicitud = empleado.estado === "pendiente";
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function confirmar() {
    setGuardando(true);
    setError(null);
    const result = await cerrarEmpleado(empleado.id, motivo);
    setGuardando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal titleId={`${baseId}-t`} onClose={onClose} maxWidthClassName="max-w-md">
      <div className="flex flex-col gap-4 text-left">
        <div className="pr-10">
          <h2 id={`${baseId}-t`} className="font-display text-lg uppercase text-brand-slate">
            {esSolicitud ? "Rechazar solicitud" : "Dar de baja"}
          </h2>
          <p className="mt-1 font-sans text-sm text-brand-slate/80">{empleado.nombre}</p>
        </div>
        <p className="font-sans text-sm text-brand-slate">
          {esSolicitud
            ? "El colaborador recibirá un aviso con el motivo. Puede volver a solicitarlo más adelante."
            : "Deja de poder comprar con cargo a tu empresa de inmediato. Su cuenta de Club 57 sigue activa como cliente."}
        </p>
        <div>
          <label htmlFor={`${baseId}-m`} className={labelClass}>
            Motivo
          </label>
          <textarea id={`${baseId}-m`} rows={3} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={inputClass} />
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={buttonClassName("secondary", "w-full sm:w-auto")}>
            Volver
          </button>
          <Button type="button" onClick={confirmar} disabled={guardando || motivo.trim().length < 3} className="w-full sm:w-auto">
            {guardando ? "Guardando…" : esSolicitud ? "Rechazar" : "Dar de baja"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
