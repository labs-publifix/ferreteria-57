"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClassName, ConfirmDialog } from "@/components/ui";
import { cerrarCorte, registrarFactura, registrarPago, resolverObservacion } from "@/app/(admin)/admin/(protected)/lealtad/empresas/actions";
import { DocumentosCorte, EstadoCorteTexto } from "@/components/empresa/CortesManager";
import { ESTADO_CICLO_CLASS, ESTADO_CICLO_LABEL, fechaCorta, periodoLabel, type Ciclo } from "@/lib/club57/empresas/cortes";

const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const inputClass =
  "min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1 block font-sans text-xs font-medium text-brand-black";

export interface ObservacionAdmin {
  id: string;
  ciclo_id: string;
  order_number: string | null;
  comentario: string;
  estado: "abierta" | "resuelta";
  respuesta: string | null;
}

const hoy = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

// Panel · ficha de la empresa → Cortes: cerrar el corte en curso, responder
// observaciones, registrar la factura (con PDF/XML) y el pago.
export function CortesAdmin({ empresaId, ciclos, observaciones }: { empresaId: string; ciclos: Ciclo[]; observaciones: ObservacionAdmin[] }) {
  if (ciclos.length === 0) {
    return <p className="font-sans text-sm text-brand-slate/70">Todavía no hay cortes: se crean al autorizarse el primer pedido con cargo a la empresa.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {ciclos.map((c) => (
        <CorteAdmin key={c.id} empresaId={empresaId} ciclo={c} observaciones={observaciones.filter((o) => o.ciclo_id === c.id)} />
      ))}
    </ul>
  );
}

function CorteAdmin({ empresaId, ciclo, observaciones }: { empresaId: string; ciclo: Ciclo; observaciones: ObservacionAdmin[] }) {
  const router = useRouter();
  const [confirmarCierre, setConfirmarCierre] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function cerrar() {
    setConfirmarCierre(false);
    setOcupado(true);
    setError(null);
    const r = await cerrarCorte(ciclo.id, empresaId);
    setOcupado(false);
    if (r.error) return setError(r.error);
    setMensaje(r.resultado === "revision" ? "Corte cerrado: avisamos a la empresa que su estado de cuenta está listo." : "Corte cerrado sin cargos.");
    router.refresh();
  }

  return (
    <li className="rounded-lg border border-brand-slate/15 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-sans text-sm font-semibold text-brand-black">Corte {periodoLabel(ciclo.periodo_inicio, ciclo.periodo_fin)}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 font-sans text-xs text-brand-slate">
            <span className={`rounded-full px-2.5 py-0.5 font-semibold ${ESTADO_CICLO_CLASS[ciclo.estado]}`}>{ESTADO_CICLO_LABEL[ciclo.estado]}</span>
            {ciclo.pedidos} {ciclo.pedidos === 1 ? "pedido" : "pedidos"}
            {ciclo.observaciones_abiertas > 0 && <span className="font-semibold text-orange-800">· {ciclo.observaciones_abiertas} observaciones por resolver</span>}
          </p>
        </div>
        <p className="font-display text-xl text-brand-black">{pesos.format(ciclo.total)}</p>
      </div>
      <div className="mt-2">
        {ciclo.estado === "abierto" ? (
          <p className="font-sans text-sm text-brand-slate">Se cierra solo el día siguiente al corte ({fechaCorta(ciclo.periodo_fin)}).</p>
        ) : (
          <EstadoCorteTexto ciclo={ciclo} />
        )}
      </div>
      {ciclo.estado !== "abierto" && (
        <div className="mt-3">
          <DocumentosCorte ciclo={ciclo} />
        </div>
      )}

      {observaciones.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {observaciones.map((o) => (
            <ObservacionItem key={o.id} observacion={o} empresaId={empresaId} />
          ))}
        </ul>
      )}

      {mensaje && (
        <p role="status" className="mt-3 rounded-md bg-green-50 px-4 py-2 font-sans text-sm text-green-800">
          {mensaje}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-4 py-2 font-sans text-sm text-red-700">
          {error}
        </p>
      )}

      {ciclo.estado === "abierto" && (
        <div className="mt-3">
          <button type="button" disabled={ocupado} onClick={() => setConfirmarCierre(true)} className={buttonClassName("secondary")}>
            Cerrar corte ahora
          </button>
        </div>
      )}
      {(ciclo.estado === "conciliado" || ciclo.estado === "facturado") && <FacturaForm ciclo={ciclo} empresaId={empresaId} />}
      {(ciclo.estado === "facturado" || ciclo.estado === "vencido") && <PagoForm ciclo={ciclo} empresaId={empresaId} />}

      <ConfirmDialog
        open={confirmarCierre}
        title="¿Cerrar el corte ahora?"
        description="El estado de cuenta queda listo para que la empresa lo revise (3 días hábiles). Las compras que se autoricen después entran al siguiente corte."
        confirmLabel="Cerrar corte"
        onConfirm={cerrar}
        onCancel={() => setConfirmarCierre(false)}
      />
    </li>
  );
}

function ObservacionItem({ observacion, empresaId }: { observacion: ObservacionAdmin; empresaId: string }) {
  const router = useRouter();
  const [respuesta, setRespuesta] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  async function responder() {
    setGuardando(true);
    setError(null);
    const r = await resolverObservacion(observacion.id, respuesta, empresaId);
    setGuardando(false);
    if (r.error) return setError(r.error);
    router.refresh();
  }

  return (
    <li className="rounded-md bg-brand-gray/60 px-3 py-2.5 font-sans text-sm">
      <p className="text-brand-black">
        <span className="font-semibold">{observacion.order_number ?? "Pedido"}</span> · {observacion.comentario}
      </p>
      {observacion.estado === "resuelta" ? (
        <p className="mt-1 text-xs text-green-800">Resuelta · {observacion.respuesta}</p>
      ) : (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor={id} className={labelClass}>
              Respuesta para la empresa
            </label>
            <input id={id} value={respuesta} onChange={(e) => setRespuesta(e.target.value)} maxLength={500} className={inputClass} />
          </div>
          <Button type="button" onClick={responder} disabled={guardando || respuesta.trim().length < 3}>
            {guardando ? "Guardando…" : "Resolver"}
          </Button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      {observacion.estado === "abierta" && (
        <p className="mt-1 text-xs text-brand-slate/70">
          Si el pedido no corresponde, cancélalo desde Pedidos: sale del estado de cuenta antes de facturar.
        </p>
      )}
    </li>
  );
}

function FacturaForm({ ciclo, empresaId }: { ciclo: Ciclo; empresaId: string }) {
  const router = useRouter();
  const id = useId();
  const [abierto, setAbierto] = useState(ciclo.estado === "conciliado");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(formData: FormData) {
    setGuardando(true);
    setError(null);
    formData.set("ciclo_id", ciclo.id);
    formData.set("empresa_id", empresaId);
    const r = await registrarFactura(formData);
    setGuardando(false);
    if (r.error) return setError(r.error);
    setAbierto(false);
    router.refresh();
  }

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="mt-3 font-sans text-sm font-semibold text-brand-slate underline underline-offset-2">
        Corregir factura
      </button>
    );
  }
  return (
    <form action={enviar} className="mt-3 rounded-md border border-brand-slate/15 p-3">
      <p className="font-sans text-sm font-semibold text-brand-black">Registrar factura</p>
      <p className="font-sans text-xs text-brand-slate">Emítela por tus medios habituales con base en el estado de cuenta y registra aquí sus datos.</p>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`${id}-f`} className={labelClass}>Folio</label>
          <input id={`${id}-f`} name="folio" required defaultValue={ciclo.factura_folio ?? ""} maxLength={60} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${id}-d`} className={labelClass}>Fecha</label>
          <input id={`${id}-d`} name="fecha" type="date" required defaultValue={ciclo.factura_fecha ?? hoy()} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${id}-m`} className={labelClass}>Monto</label>
          <input id={`${id}-m`} name="monto" inputMode="decimal" required defaultValue={String(ciclo.factura_monto ?? ciclo.total)} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${id}-p`} className={labelClass}>PDF (opcional)</label>
          <input id={`${id}-p`} name="pdf" type="file" accept="application/pdf,.pdf" className="font-sans text-xs" />
        </div>
        <div>
          <label htmlFor={`${id}-x`} className={labelClass}>XML (opcional)</label>
          <input id={`${id}-x`} name="xml" type="file" accept=".xml,application/xml,text/xml" className="font-sans text-xs" />
        </div>
      </div>
      {error && <p role="alert" className="mt-2 font-sans text-sm text-red-700">{error}</p>}
      <div className="mt-3">
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Registrar factura"}
        </Button>
      </div>
    </form>
  );
}

function PagoForm({ ciclo, empresaId }: { ciclo: Ciclo; empresaId: string }) {
  const router = useRouter();
  const id = useId();
  const [fecha, setFecha] = useState(hoy());
  const [monto, setMonto] = useState(String(ciclo.factura_monto ?? ciclo.total));
  const [referencia, setReferencia] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    const r = await registrarPago({ cicloId: ciclo.id, empresaId, fecha, monto, referencia });
    setGuardando(false);
    if (r.error) return setError(r.error);
    router.refresh();
  }

  return (
    <div className="mt-3 rounded-md border border-brand-slate/15 p-3">
      <p className="font-sans text-sm font-semibold text-brand-black">Registrar pago</p>
      <p className="font-sans text-xs text-brand-slate">
        Libera el crédito de la empresa y los puntos Club 57 de sus colaboradores. Si estaba suspendida por este pago, se reactiva.
      </p>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`${id}-d`} className={labelClass}>Fecha del pago</label>
          <input id={`${id}-d`} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${id}-m`} className={labelClass}>Monto</label>
          <input id={`${id}-m`} inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${id}-r`} className={labelClass}>Referencia (opcional)</label>
          <input id={`${id}-r`} value={referencia} onChange={(e) => setReferencia(e.target.value)} maxLength={120} className={inputClass} />
        </div>
      </div>
      {error && <p role="alert" className="mt-2 font-sans text-sm text-red-700">{error}</p>}
      <div className="mt-3">
        <Button type="button" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Registrar pago"}
        </Button>
      </div>
    </div>
  );
}
