"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { Button, buttonClassName, Modal, Select } from "@/components/ui";
import { darConformidadCorte, observarPedidoCorte } from "@/app/(site)/empresa/actions";
import {
  ESTADO_CICLO_CLASS,
  ESTADO_CICLO_LABEL,
  fechaCorta,
  periodoLabel,
  type Ciclo,
  type CicloLinea,
} from "@/lib/club57/empresas/cortes";
import { ultimoDiaPlazo } from "@/lib/club57/empresas/pedidos";

const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const inputClass =
  "min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2.5 font-sans text-base text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:text-sm";

export interface ObservacionCorte {
  id: string;
  ciclo_id: string;
  order_id: string;
  comentario: string;
  estado: "abierta" | "resuelta";
  respuesta: string | null;
  created_at: string;
}

export function DocumentosCorte({ ciclo }: { ciclo: Ciclo }) {
  const base = `/api/empresa/cortes/${ciclo.id}`;
  const link = (href: string, label: string, Icon = Download) => (
    <a href={href} className={buttonClassName("secondary", "min-h-10 px-3 text-sm")}>
      <Icon className="size-4" aria-hidden="true" strokeWidth={2} />
      {label}
    </a>
  );
  return (
    <div className="flex flex-wrap gap-2">
      {link(`${base}/pdf`, "Estado de cuenta (PDF)", FileText)}
      {link(`${base}/nomina`, "Excel para nómina")}
      {link(`${base}/detalle`, "Excel de detalle")}
      {ciclo.tiene_pdf && link(`${base}/factura-pdf`, "Factura PDF", FileText)}
      {ciclo.tiene_xml && link(`${base}/factura-xml`, "Factura XML")}
    </div>
  );
}

/** Resumen del estado del ciclo (factura, pago, conformidad), común al portal y al panel. */
export function EstadoCorteTexto({ ciclo }: { ciclo: Ciclo }) {
  if (ciclo.estado === "revision") {
    return (
      <p className="font-sans text-sm text-brand-black">
        En revisión: conformidad u observaciones a más tardar el{" "}
        <strong>{ciclo.revision_vence_at ? ultimoDiaPlazo(ciclo.revision_vence_at) : "—"}</strong>. Sin observaciones, se toma como
        conforme.
      </p>
    );
  }
  if (ciclo.estado === "conciliado") {
    return (
      <p className="font-sans text-sm text-brand-black">
        Conforme{ciclo.conformidad_tacita ? " (sin observaciones en el plazo)" : ""}. Ferretería 57 emitirá la factura.
      </p>
    );
  }
  if (ciclo.estado === "facturado" || ciclo.estado === "vencido") {
    return (
      <p className={`font-sans text-sm ${ciclo.estado === "vencido" ? "font-semibold text-red-700" : "text-brand-black"}`}>
        Factura <strong>{ciclo.factura_folio}</strong>
        {ciclo.factura_fecha ? ` del ${fechaCorta(ciclo.factura_fecha)}` : ""} por {pesos.format(ciclo.factura_monto ?? 0)}.{" "}
        {ciclo.estado === "vencido"
          ? `El pago venció el ${ciclo.pago_vence ? fechaCorta(ciclo.pago_vence) : "—"}: las compras con cargo a la empresa están pausadas.`
          : `Fecha límite de pago: ${ciclo.pago_vence ? fechaCorta(ciclo.pago_vence) : "—"}.`}
      </p>
    );
  }
  if (ciclo.estado === "pagado") {
    return (
      <p className="font-sans text-sm text-brand-black">
        {ciclo.pago_fecha
          ? `Pagado el ${fechaCorta(ciclo.pago_fecha)} · ${pesos.format(ciclo.pago_monto ?? 0)}${ciclo.pago_referencia ? ` · ${ciclo.pago_referencia}` : ""}.`
          : ciclo.nota ?? "Pagado."}
        {ciclo.factura_folio ? ` Factura ${ciclo.factura_folio}.` : ""}
      </p>
    );
  }
  return null;
}

// Portal Empresa · Estados de cuenta: el corte en curso y los cerrados, con
// sus documentos, la conformidad u observaciones, la factura y el pago.
export function CortesManager({
  ciclos,
  detalles,
  observaciones,
  credito,
}: {
  ciclos: Ciclo[];
  detalles: Record<string, CicloLinea[]>;
  observaciones: ObservacionCorte[];
  credito: { limite: number | null; comprometido: number; disponible: number } | null;
}) {
  const abierto = ciclos.find((c) => c.estado === "abierto") ?? null;
  const cerrados = ciclos.filter((c) => c.estado !== "abierto");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-white px-5 py-4 shadow-sm">
          <p className="font-sans text-xs text-brand-slate/70">Crédito disponible con Ferretería 57</p>
          <p className="mt-1 font-display text-2xl text-brand-black">{credito ? pesos.format(credito.disponible) : "—"}</p>
          {credito?.limite !== null && credito?.limite !== undefined && (
            <p className="font-sans text-xs text-brand-slate">
              de {pesos.format(credito.limite)} · se libera al pagar cada corte
            </p>
          )}
        </div>
        <div className="rounded-lg bg-white px-5 py-4 shadow-sm">
          <p className="font-sans text-xs text-brand-slate/70">Corte en curso</p>
          {abierto ? (
            <>
              <p className="mt-1 font-display text-2xl text-brand-black">{pesos.format(abierto.total)}</p>
              <p className="font-sans text-xs text-brand-slate">
                {abierto.pedidos} {abierto.pedidos === 1 ? "pedido autorizado" : "pedidos autorizados"} · cierra el {fechaCorta(abierto.periodo_fin)}
              </p>
            </>
          ) : (
            <p className="mt-1 font-sans text-sm text-brand-slate">Sin compras autorizadas en el periodo actual.</p>
          )}
        </div>
      </div>

      {cerrados.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/80 shadow-sm">
          Aún no hay estados de cuenta. Al pasar tu día de corte, aquí verás el de cada periodo con su PDF y sus Excel.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {cerrados.map((ciclo) => (
            <CorteCard
              key={ciclo.id}
              ciclo={ciclo}
              lineas={detalles[ciclo.id] ?? []}
              observaciones={observaciones.filter((o) => o.ciclo_id === ciclo.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CorteCard({ ciclo, lineas, observaciones }: { ciclo: Ciclo; lineas: CicloLinea[]; observaciones: ObservacionCorte[] }) {
  const router = useRouter();
  const [observar, setObservar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const folio = (orderId: string) => lineas.find((l) => l.order_id === orderId)?.order_number ?? "Pedido";
  const abiertas = observaciones.filter((o) => o.estado === "abierta").length;

  async function conformidad() {
    setGuardando(true);
    setError(null);
    const result = await darConformidadCorte(ciclo.id);
    setGuardando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <li
      className={`rounded-lg bg-white p-4 shadow-sm sm:p-5 ${
        ciclo.estado === "revision" ? "border-l-4 border-brand-orange" : ciclo.estado === "vencido" ? "border-l-4 border-red-600" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-sans text-base font-semibold text-brand-black">Corte {periodoLabel(ciclo.periodo_inicio, ciclo.periodo_fin)}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-2 font-sans text-sm text-brand-slate">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_CICLO_CLASS[ciclo.estado]}`}>
              {ESTADO_CICLO_LABEL[ciclo.estado]}
            </span>
            {ciclo.pedidos} {ciclo.pedidos === 1 ? "pedido" : "pedidos"}
          </p>
        </div>
        <p className="font-display text-2xl text-brand-black">{pesos.format(ciclo.total)}</p>
      </div>

      <div className="mt-3">
        <EstadoCorteTexto ciclo={ciclo} />
      </div>
      <div className="mt-3">
        <DocumentosCorte ciclo={ciclo} />
      </div>

      {observaciones.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {observaciones.map((o) => (
            <li key={o.id} className="rounded-md bg-brand-gray/60 px-4 py-3 font-sans text-sm">
              <p className="text-brand-black">
                <span className="font-semibold">{folio(o.order_id)}</span> · {o.comentario}
              </p>
              <p className="mt-1 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${o.estado === "abierta" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}
                >
                  {o.estado === "abierta" ? "En revisión por Ferretería 57" : "Resuelta"}
                </span>
                {o.respuesta && <span className="ml-2 text-brand-slate">{o.respuesta}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      {ciclo.estado === "revision" && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setObservar(true)} className={buttonClassName("secondary", "w-full sm:w-auto")}>
            Observar un pedido
          </button>
          <Button type="button" onClick={conformidad} disabled={guardando || abiertas > 0} className="w-full sm:w-auto">
            {guardando ? "Guardando…" : "Dar conformidad"}
          </Button>
        </div>
      )}
      {ciclo.estado === "revision" && abiertas > 0 && (
        <p className="mt-2 text-right font-sans text-xs text-brand-slate">Podrás dar tu conformidad cuando Ferretería 57 resuelva tus observaciones.</p>
      )}

      {observar && <ObservarModal ciclo={ciclo} lineas={lineas} onClose={() => setObservar(false)} />}
    </li>
  );
}

function ObservarModal({ ciclo, lineas, onClose }: { ciclo: Ciclo; lineas: CicloLinea[]; onClose: () => void }) {
  const router = useRouter();
  const baseId = useId();
  const pedidos = lineas.filter((l) => l.tipo === "pedido" && l.order_id);
  const [orderId, setOrderId] = useState(pedidos[0]?.order_id ?? "");
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    const result = await observarPedidoCorte(ciclo.id, orderId, comentario);
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
            Observar un pedido
          </h2>
          <p className="mt-1 font-sans text-sm text-brand-slate/80">Corte {periodoLabel(ciclo.periodo_inicio, ciclo.periodo_fin)}</p>
        </div>
        <div>
          <span className="mb-1.5 block font-sans text-sm font-medium text-brand-black">Pedido</span>
          <Select
            value={orderId}
            onChange={setOrderId}
            label="Pedido"
            options={pedidos.map((p) => ({ value: p.order_id as string, label: `${p.order_number} · ${pesos.format(p.total)}` }))}
          />
          {orderId && (
            <p className="mt-1 font-sans text-xs text-brand-slate/70">{pedidos.find((p) => p.order_id === orderId)?.empleado_nombre}</p>
          )}
        </div>
        <div>
          <label htmlFor={`${baseId}-c`} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            ¿Qué hay que revisar?
          </label>
          <textarea
            id={`${baseId}-c`}
            rows={3}
            maxLength={500}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className={inputClass}
          />
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
          <Button type="button" onClick={guardar} disabled={guardando || !orderId || comentario.trim().length < 3} className="w-full sm:w-auto">
            {guardando ? "Guardando…" : "Enviar observación"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
