"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Button, buttonClassName, Modal } from "@/components/ui";
import { autorizarPedidos, rechazarPedido } from "@/app/(site)/empresa/actions";
import type { PortalPedido } from "@/lib/club57/empresas/portal";
import { FULFILLMENT_TYPE_LABEL } from "@/lib/orders/status";
import { RESOLUCION_PEDIDO_LABEL, estadoPedidoEmpresaLabel, ultimoDiaPlazo } from "@/lib/club57/empresas/pedidos";

type Vista = "pendientes" | "historial";

const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const fecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" });
const inputClass =
  "min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2.5 font-sans text-base text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:text-sm";
const dangerClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-red-700 px-4 font-sans text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 disabled:opacity-50";

// Portal Empresa · Pedidos: los que esperan autorización (uno por uno o en
// bloque) y el historial de lo ya resuelto.
export function PedidosManager({ pedidos, suspendida }: { pedidos: PortalPedido[]; suspendida: boolean }) {
  const router = useRouter();
  const grupos = useMemo(
    () => ({
      pendientes: pedidos.filter((p) => p.status === "pendiente_autorizacion"),
      historial: pedidos.filter((p) => p.status !== "pendiente_autorizacion"),
    }),
    [pedidos]
  );
  const [vista, setVista] = useState<Vista>(grupos.pendientes.length > 0 || grupos.historial.length === 0 ? "pendientes" : "historial");
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [rechazar, setRechazar] = useState<PortalPedido | null>(null);

  const seleccionados = grupos.pendientes.filter((p) => seleccion.has(p.id));
  const totalSeleccion = seleccionados.reduce((sum, p) => sum + p.total, 0);
  const todos = grupos.pendientes.length > 0 && seleccionados.length === grupos.pendientes.length;

  function alternar(id: string, marcado: boolean) {
    setSeleccion((actual) => {
      const siguiente = new Set(actual);
      if (marcado) siguiente.add(id);
      else siguiente.delete(id);
      return siguiente;
    });
  }

  async function autorizar(ids: string[]) {
    setProcesando(true);
    setError(null);
    setMensaje(null);
    const result = await autorizarPedidos(ids);
    setProcesando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const n = result.autorizados ?? 0;
    setMensaje(
      n === 0
        ? "Esos pedidos ya no estaban en espera."
        : n === 1
          ? "Pedido autorizado. Ferretería 57 ya lo está preparando y le avisamos al colaborador."
          : `${n} pedidos autorizados. Ferretería 57 ya los está preparando y avisamos a cada colaborador.`
    );
    setSeleccion(new Set());
    router.refresh();
  }

  const tabs: { id: Vista; label: string }[] = [
    { id: "pendientes", label: `Por autorizar (${grupos.pendientes.length})` },
    { id: "historial", label: `Historial (${grupos.historial.length})` },
  ];

  return (
    <section className="flex flex-col gap-4">
      <div role="tablist" aria-label="Pedidos" className="flex flex-wrap gap-2">
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

      {mensaje && (
        <p role="status" className="rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800">
          {mensaje}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}

      {vista === "pendientes" ? (
        grupos.pendientes.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/80 shadow-sm">
            No hay pedidos esperando tu autorización. Cuando un colaborador compre con cargo a tu empresa, te avisamos por correo.
          </p>
        ) : (
          <>
            {suspendida && (
              <p className="rounded-md border-l-4 border-red-600 bg-red-50 px-4 py-3 font-sans text-sm text-red-800">
                Mientras tu empresa esté suspendida no se pueden autorizar pedidos. Los que venzan se cancelan solos.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 font-sans text-sm font-medium text-brand-black">
                <input
                  type="checkbox"
                  checked={todos}
                  onChange={(e) => setSeleccion(e.target.checked ? new Set(grupos.pendientes.map((p) => p.id)) : new Set())}
                  className="size-5 rounded border-brand-slate/40 accent-brand-orange"
                />
                Seleccionar todos
              </label>
              <div className="ml-auto flex flex-wrap items-center gap-3">
                {seleccionados.length > 0 && (
                  <span className="font-sans text-sm text-brand-slate">
                    {seleccionados.length} · <strong className="text-brand-black">{pesos.format(totalSeleccion)}</strong>
                  </span>
                )}
                <Button
                  type="button"
                  onClick={() => autorizar(seleccionados.map((p) => p.id))}
                  disabled={procesando || suspendida || seleccionados.length === 0}
                >
                  {procesando ? "Autorizando…" : "Autorizar seleccionados"}
                </Button>
              </div>
            </div>

            <ul className="flex flex-col gap-3">
              {grupos.pendientes.map((pedido) => (
                <li key={pedido.id} className="rounded-lg bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar pedido ${pedido.order_number}`}
                      checked={seleccion.has(pedido.id)}
                      onChange={(e) => alternar(pedido.id, e.target.checked)}
                      className="mt-1 size-5 shrink-0 rounded border-brand-slate/40 accent-brand-orange"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="font-sans text-base font-semibold text-brand-black">
                          {pedido.empleado_nombre}
                          {pedido.numero_empleado && (
                            <span className="ml-2 font-normal text-brand-slate">núm. {pedido.numero_empleado}</span>
                          )}
                        </p>
                        <p className="font-display text-xl text-brand-black">{pesos.format(pedido.total)}</p>
                      </div>
                      <p className="mt-0.5 font-sans text-xs text-brand-slate">
                        {pedido.order_number} · {fecha.format(new Date(pedido.created_at))} · {FULFILLMENT_TYPE_LABEL[pedido.fulfillment_type]}
                      </p>
                      {pedido.autorizacion_vence_at && (
                        <p className="mt-1 font-sans text-xs font-semibold text-orange-800">
                          Autoriza a más tardar el {ultimoDiaPlazo(pedido.autorizacion_vence_at)}
                        </p>
                      )}
                      <DetalleProductos pedido={pedido} />
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setRechazar(pedido)}
                          disabled={procesando}
                          className={`${dangerClass} w-full sm:w-auto`}
                        >
                          Rechazar
                        </button>
                        <Button
                          type="button"
                          onClick={() => autorizar([pedido.id])}
                          disabled={procesando || suspendida}
                          className="w-full sm:w-auto"
                        >
                          Autorizar
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )
      ) : grupos.historial.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/80 shadow-sm">Aún no hay pedidos resueltos.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {grupos.historial.map((pedido) => {
            const cancelado = pedido.status === "cancelado";
            return (
              <li key={pedido.id} className="rounded-lg bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-sans text-sm font-semibold text-brand-black">
                    {pedido.empleado_nombre}
                    {pedido.numero_empleado && <span className="ml-2 font-normal text-brand-slate">núm. {pedido.numero_empleado}</span>}
                  </p>
                  <p className={`font-sans text-base font-semibold ${cancelado ? "text-brand-slate line-through" : "text-brand-black"}`}>
                    {pesos.format(pedido.total)}
                  </p>
                </div>
                <p className="mt-0.5 font-sans text-xs text-brand-slate">
                  {pedido.order_number} · {fecha.format(new Date(pedido.created_at))}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-2 font-sans text-xs">
                  <span
                    className={`rounded-full px-2.5 py-1 font-semibold ${cancelado ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                  >
                    {pedido.empresa_resolucion ? RESOLUCION_PEDIDO_LABEL[pedido.empresa_resolucion] ?? "Resuelto" : "Resuelto"}
                  </span>
                  {!cancelado && <span className="text-brand-slate">Entrega: {estadoPedidoEmpresaLabel(pedido.status)}</span>}
                  {pedido.empresa_motivo && pedido.empresa_resolucion === "rechazado" && (
                    <span className="text-brand-slate">· {pedido.empresa_motivo}</span>
                  )}
                </p>
                <DetalleProductos pedido={pedido} />
              </li>
            );
          })}
        </ul>
      )}

      {rechazar && <RechazarModal pedido={rechazar} onClose={() => setRechazar(null)} />}
    </section>
  );
}

function DetalleProductos({ pedido }: { pedido: PortalPedido }) {
  const piezas = pedido.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <details className="group mt-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 font-sans text-sm font-semibold text-brand-slate hover:text-brand-black [&::-webkit-details-marker]:hidden">
        Ver productos ({piezas} {piezas === 1 ? "pieza" : "piezas"})
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <ul className="mt-1 flex flex-col gap-1 rounded-md bg-brand-gray/60 p-3 font-sans text-sm">
        {pedido.items.map((item, index) => (
          <li key={index} className="flex justify-between gap-3 text-brand-black">
            <span className="min-w-0">
              {item.quantity}× {item.product_name}
              {item.variant_label && item.variant_label !== "Único" ? ` (${item.variant_label})` : ""}
            </span>
            <span className="shrink-0 tabular-nums">{pesos.format(item.unit_price * item.quantity)}</span>
          </li>
        ))}
        {pedido.shipping_cost > 0 && (
          <li className="flex justify-between gap-3 text-brand-slate">
            <span>Envío</span>
            <span className="shrink-0 tabular-nums">{pesos.format(pedido.shipping_cost)}</span>
          </li>
        )}
      </ul>
    </details>
  );
}

function RechazarModal({ pedido, onClose }: { pedido: PortalPedido; onClose: () => void }) {
  const router = useRouter();
  const baseId = useId();
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setGuardando(true);
    setError(null);
    const result = await rechazarPedido(pedido.id, motivo);
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
            Rechazar pedido
          </h2>
          <p className="mt-1 font-sans text-sm text-brand-slate/80">
            {pedido.empleado_nombre} · {pedido.order_number} · {pesos.format(pedido.total)}
          </p>
        </div>
        <p className="font-sans text-sm text-brand-slate">
          El pedido se cancela, el producto regresa al inventario y el colaborador recibe un aviso con el motivo.
        </p>
        <div>
          <label htmlFor={`${baseId}-m`} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Motivo
          </label>
          <textarea
            id={`${baseId}-m`}
            rows={3}
            maxLength={500}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
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
          <Button type="button" onClick={confirmar} disabled={guardando || motivo.trim().length < 3} className="w-full sm:w-auto">
            {guardando ? "Rechazando…" : "Rechazar pedido"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
