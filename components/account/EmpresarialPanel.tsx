"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MessageCircle } from "lucide-react";
import { Button, buttonClassName, ConfirmDialog } from "@/components/ui";
import {
  cancelarPedidoEmpresa,
  cancelarVinculoEmpresa,
  validarCodigoEmpresa,
  vincularEmpresa,
} from "@/app/(site)/cuenta/empresarialActions";
import { ESTADO_EMPLEADO_LABEL, textoAutorizacion, type EstadoEmpleado } from "@/lib/club57/empresas/empleados";
import { STORE_WHATSAPP_PHONE } from "@/lib/store-info";
import { estadoPedidoEmpresaLabel, RESOLUCION_PEDIDO_LABEL, ultimoDiaPlazo } from "@/lib/club57/empresas/pedidos";
import { fechaNominaCorta, fechaNominaLabel } from "@/lib/club57/empresas/nomina";

/** Crédito del vínculo activo (club57_mi_credito_empresa). */
export interface MiCreditoEmpresa {
  linea: number;
  /** Pedidos en espera + lo que falta por descontar de los autorizados. */
  comprometido: number;
  disponible: number;
  /** Pedidos que esperan la autorización de la empresa. */
  enEspera?: number;
  /** Lo que falta por descontarle vía nómina de sus pedidos autorizados. */
  porDescontar?: number;
  proximoFecha?: string | null;
  proximoMonto?: number | null;
}

/** Descuento de nómina (club57_mis_descuentos). */
export interface MiDescuento {
  id: string;
  empresa_nombre: string;
  order_number: string;
  fecha_nomina: string;
  numero: number;
  de_total: number;
  monto: number;
  monto_aplicado: number | null;
  estado: "programado" | "aplicado" | "no_aplicado" | "baja";
}

/** Pedido con cargo a la empresa, tal como lo lee Mi cuenta. */
export interface MiPedidoEmpresa {
  id: string;
  order_number: string;
  created_at: string;
  total: number;
  status: string;
  autorizacion_vence_at?: string | null;
  empresa_resolucion?: string | null;
  empresa_motivo?: string | null;
}

export interface MiVinculoEmpresa {
  id: string;
  empresa_nombre: string;
  empresa_estado: string;
  estado: EstadoEmpleado;
  numero_empleado: string | null;
  linea_credito: number | null;
  motivo: string | null;
  solicitado_at: string;
  resuelto_at: string | null;
}

const fecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" });
const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const inputClass =
  "min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2.5 font-sans text-base text-brand-black placeholder:text-brand-slate/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:text-sm";

const WHATSAPP_HREF = `https://wa.me/${STORE_WHATSAPP_PHONE}?text=${encodeURIComponent(
  "Hola, soy colaborador de una empresa de Club 57 Empresarial y busco un producto que no encuentro en la tienda en línea."
)}`;

// Pestaña «Empresarial» de Mi cuenta: el vínculo del miembro con su empresa
// (Club 57 Empresarial), su línea de crédito y su historial.
export function EmpresarialPanel({
  vinculos,
  credito = null,
  pedidos = [],
  descuentos = [],
}: {
  vinculos: MiVinculoEmpresa[];
  credito?: MiCreditoEmpresa | null;
  pedidos?: MiPedidoEmpresa[];
  descuentos?: MiDescuento[];
}) {
  const vigente = vinculos.find((v) => v.estado === "activo" || v.estado === "pendiente") ?? null;
  const anteriores = vinculos.filter((v) => v !== vigente);

  return (
    <div className="flex flex-col gap-4 text-left">
      {vigente?.estado === "activo" && <VinculoActivo vinculo={vigente} credito={credito} />}
      {descuentos.length > 0 && <DescuentosNomina descuentos={descuentos} />}
      {pedidos.length > 0 && <PedidosEmpresa pedidos={pedidos} />}
      {vigente?.estado === "pendiente" && <VinculoPendiente vinculo={vigente} />}
      {!vigente && <VincularForm />}

      {vigente?.estado === "activo" && (
        <div className="flex flex-col gap-3 rounded-lg border-l-4 border-brand-orange bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-sm text-brand-black">
            <strong>¿No encuentras un producto?</strong> Tenemos acceso a más de 15,000 productos Truper. Escríbenos y te lo
            conseguimos.
          </p>
          <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className={buttonClassName("secondary", "shrink-0")}>
            <MessageCircle className="size-4" aria-hidden="true" strokeWidth={2} />
            WhatsApp
          </a>
        </div>
      )}

      {anteriores.length > 0 && (
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="font-display text-sm uppercase text-brand-slate">Historial</h3>
          <ul className="mt-2 flex flex-col divide-y divide-brand-slate/10">
            {anteriores.map((v) => (
              <li key={v.id} className="flex flex-col gap-0.5 py-2.5 font-sans text-sm sm:flex-row sm:items-baseline sm:justify-between">
                <span className="text-brand-black">
                  {v.empresa_nombre} · <span className="text-brand-slate">{ESTADO_EMPLEADO_LABEL[v.estado]}</span>
                  {v.motivo && <span className="text-brand-slate/70"> · {v.motivo}</span>}
                </span>
                <span className="text-xs text-brand-slate/70">{fecha.format(new Date(v.resuelto_at ?? v.solicitado_at))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function VinculoActivo({ vinculo, credito }: { vinculo: MiVinculoEmpresa; credito: MiCreditoEmpresa | null }) {
  const suspendida = vinculo.empresa_estado !== "activa";
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-orange/10">
          <Building2 className="size-5 text-brand-orange" aria-hidden="true" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="font-sans text-xs font-semibold uppercase tracking-wide text-brand-slate/70">Tu empresa</p>
          <p className="font-display text-lg uppercase text-brand-black">{vinculo.empresa_nombre}</p>
          {vinculo.numero_empleado && (
            <p className="font-sans text-sm text-brand-slate">Número de empleado: {vinculo.numero_empleado}</p>
          )}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-brand-gray px-4 py-3">
          <dt className="font-sans text-xs text-brand-slate/70">Crédito disponible</dt>
          <dd className="font-display text-2xl text-brand-black">
            {credito ? pesos.format(credito.disponible) : vinculo.linea_credito === null ? "—" : pesos.format(vinculo.linea_credito)}
          </dd>
          <dd className="font-sans text-xs text-brand-slate">
            de tu línea de {vinculo.linea_credito === null ? "—" : pesos.format(vinculo.linea_credito)}
          </dd>
        </div>
        <div className="rounded-md bg-brand-gray px-4 py-3">
          <dt className="font-sans text-xs text-brand-slate/70">Por descontar vía nómina</dt>
          <dd className="font-display text-2xl text-brand-black">{pesos.format(credito?.porDescontar ?? 0)}</dd>
          {credito?.proximoFecha && credito.proximoMonto !== null && credito.proximoMonto !== undefined ? (
            <dd className="font-sans text-xs text-brand-slate">
              Próximo descuento: {pesos.format(credito.proximoMonto)} el {fechaNominaLabel(credito.proximoFecha)}
            </dd>
          ) : (
            <dd className="font-sans text-xs text-brand-slate">Sin descuentos programados</dd>
          )}
        </div>
        {credito && (credito.enEspera ?? 0) > 0 && (
          <div className="rounded-md border border-orange-200 bg-orange-50 px-4 py-3 sm:col-span-2">
            <dt className="font-sans text-xs text-orange-900">En espera de autorización de tu empresa</dt>
            <dd className="font-sans text-sm font-semibold text-brand-black">{pesos.format(credito.enEspera ?? 0)}</dd>
          </div>
        )}
      </dl>
      <p className="mt-3 font-sans text-sm text-brand-slate">
        {suspendida
          ? "Las compras con cargo a tu empresa están pausadas por el momento. Puedes seguir comprando con tarjeta."
          : "Al pagar en la tienda en línea, elige «Cargo a mi empresa». Cada compra se descuenta en tu nómina y tu crédito se libera con cada descuento aplicado."}
      </p>
    </div>
  );
}

function VinculoPendiente({ vinculo }: { vinculo: MiVinculoEmpresa }) {
  const router = useRouter();
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancelar() {
    setCancelando(true);
    setError(null);
    const result = await cancelarVinculoEmpresa();
    setCancelando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 font-sans text-xs font-semibold text-amber-900">
        En revisión
      </span>
      <p className="mt-3 font-sans text-base text-brand-black">
        <strong>{vinculo.empresa_nombre}</strong> está revisando tu solicitud desde el {fecha.format(new Date(vinculo.solicitado_at))}.
      </p>
      <p className="mt-1 font-sans text-sm text-brand-slate">
        Te avisaremos por correo cuando la aprueben y tengas tu línea de crédito.
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="button" onClick={cancelar} disabled={cancelando} className={buttonClassName("secondary", "mt-4")}>
        {cancelando ? "Retirando…" : "Retirar solicitud"}
      </button>
    </div>
  );
}

function VincularForm() {
  const router = useRouter();
  const codigoId = useId();
  const numeroId = useId();
  const [codigo, setCodigo] = useState("");
  const [numero, setNumero] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [empresa, setEmpresa] = useState<{ nombre: string; exigeNumero: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const trabajandoRef = useRef(false);

  async function revisarCodigo() {
    if (!codigo.trim()) return;
    const info = await validarCodigoEmpresa(codigo);
    if (info.error || !info.nombre) {
      setEmpresa(null);
      setError(info.error ?? "No encontramos ese código.");
      return;
    }
    setError(null);
    setEmpresa({ nombre: info.nombre, exigeNumero: Boolean(info.exigeNumero) });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trabajandoRef.current) return;
    trabajandoRef.current = true;
    setTrabajando(true);
    setError(null);
    const result = await vincularEmpresa(codigo, numero, acepta);
    trabajandoRef.current = false;
    setTrabajando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOk(result.estado === "activo" ? "¡Listo! Tu empresa ya te había registrado: tu línea de crédito está activa." : "Enviamos tu solicitud a tu empresa.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-display text-base uppercase text-brand-slate">Vincular mi empresa</h3>
        <p className="mt-1 font-sans text-sm text-brand-slate">
          Si tu empresa tiene convenio con Club 57 Empresarial, escribe el código que te compartió. Tu cuenta, tus puntos y tu
          historial no cambian.
        </p>
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      {ok && (
        <p role="status" className="rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800">
          {ok}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={codigoId} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Código de tu empresa
          </label>
          <input
            id={codigoId}
            value={codigo}
            onChange={(event) => {
              setCodigo(event.target.value.toUpperCase());
              setEmpresa(null);
            }}
            onBlur={revisarCodigo}
            placeholder="F57-XXXX-XXXX"
            autoComplete="off"
            className={inputClass}
          />
          {empresa && <p className="mt-1 font-sans text-xs text-green-800">Empresa: {empresa.nombre}</p>}
        </div>
        <div>
          <label htmlFor={numeroId} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Número de empleado{empresa?.exigeNumero ? "" : " (si tu empresa lo pide)"}
          </label>
          <input id={numeroId} value={numero} onChange={(event) => setNumero(event.target.value)} autoComplete="off" className={inputClass} />
        </div>
      </div>
      <label className="flex items-start gap-3 font-sans text-sm text-brand-black">
        <input
          type="checkbox"
          checked={acepta}
          onChange={(event) => setAcepta(event.target.checked)}
          className="mt-0.5 size-5 shrink-0 rounded border-brand-slate/40 accent-brand-orange"
        />
        <span>{textoAutorizacion(empresa?.nombre ?? "mi empresa")}</span>
      </label>
      <Button type="submit" disabled={trabajando || !codigo.trim() || !acepta} className="w-full sm:w-auto sm:self-start">
        {trabajando ? "Enviando…" : "Vincular mi empresa"}
      </Button>
    </form>
  );
}

// Pedidos con cargo a la empresa: los que esperan autorización se pueden
// cancelar; el resto muestra cómo se resolvieron.
function PedidosEmpresa({ pedidos }: { pedidos: MiPedidoEmpresa[] }) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState<MiPedidoEmpresa | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancelar() {
    if (!confirmar) return;
    const pedido = confirmar;
    setConfirmar(null);
    setCancelando(true);
    setError(null);
    const result = await cancelarPedidoEmpresa(pedido.id);
    setCancelando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <h3 className="font-display text-sm uppercase text-brand-slate">Pedidos con cargo a tu empresa</h3>
      {error && (
        <p role="alert" className="mt-2 rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      <ul className="mt-2 flex flex-col divide-y divide-brand-slate/10">
        {pedidos.map((pedido) => {
          const enEspera = pedido.status === "pendiente_autorizacion";
          const cancelado = pedido.status === "cancelado";
          return (
            <li key={pedido.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 font-sans text-sm">
                <p className="text-brand-black">
                  <span className="font-semibold">{pedido.order_number}</span> · {fecha.format(new Date(pedido.created_at))} ·{" "}
                  <span className={cancelado ? "line-through" : ""}>{pesos.format(Number(pedido.total))}</span>
                </p>
                <p className="mt-0.5 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${
                      enEspera ? "bg-orange-100 text-orange-800" : cancelado ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {cancelado && pedido.empresa_resolucion
                      ? RESOLUCION_PEDIDO_LABEL[pedido.empresa_resolucion] ?? "Cancelado"
                      : estadoPedidoEmpresaLabel(pedido.status)}
                  </span>
                  {enEspera && pedido.autorizacion_vence_at && (
                    <span className="ml-2 text-brand-slate">Tu empresa tiene hasta el {ultimoDiaPlazo(pedido.autorizacion_vence_at)}</span>
                  )}
                  {cancelado && pedido.empresa_resolucion === "rechazado" && pedido.empresa_motivo && (
                    <span className="ml-2 text-brand-slate">{pedido.empresa_motivo}</span>
                  )}
                </p>
              </div>
              {enEspera && (
                <button
                  type="button"
                  disabled={cancelando}
                  onClick={() => setConfirmar(pedido)}
                  className={buttonClassName("secondary", "shrink-0")}
                >
                  Cancelar pedido
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={Boolean(confirmar)}
        title="¿Cancelar este pedido?"
        description={
          confirmar
            ? `El pedido ${confirmar.order_number} se cancela y tu crédito disponible se ajusta. No se hace ningún cargo.`
            : undefined
        }
        confirmLabel="Cancelar pedido"
        cancelLabel="Volver"
        tone="danger"
        onConfirm={cancelar}
        onCancel={() => setConfirmar(null)}
      />
    </div>
  );
}

const DESCUENTO_ESTADO: Record<MiDescuento["estado"], { label: string; clase: string }> = {
  programado: { label: "Programado", clase: "bg-brand-gray text-brand-slate" },
  aplicado: { label: "Aplicado", clase: "bg-green-100 text-green-800" },
  no_aplicado: { label: "No se aplicó · pasó a la siguiente nómina", clase: "bg-orange-100 text-orange-800" },
  baja: { label: "Pendiente al salir de la empresa", clase: "bg-red-100 text-red-800" },
};

// Calendario de descuentos de nómina: los que vienen y los ya aplicados.
function DescuentosNomina({ descuentos }: { descuentos: MiDescuento[] }) {
  const programados = descuentos
    .filter((d) => d.estado === "programado")
    .sort((a, b) => a.fecha_nomina.localeCompare(b.fecha_nomina) || a.order_number.localeCompare(b.order_number) || a.numero - b.numero);
  const historial = descuentos.filter((d) => d.estado !== "programado");
  const fila = (d: MiDescuento) => {
    const parcial = d.estado === "aplicado" && d.monto_aplicado !== null && d.monto_aplicado < d.monto - 0.005;
    return (
      <li key={d.id} className="flex flex-col gap-1 py-2.5 font-sans text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-brand-black">
          <span className="font-semibold">{fechaNominaCorta(d.fecha_nomina)}</span> · {d.order_number}
          <span className="text-brand-slate"> · {d.numero} de {d.de_total}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DESCUENTO_ESTADO[d.estado].clase}`}>
            {parcial ? "Aplicado parcial" : DESCUENTO_ESTADO[d.estado].label}
          </span>
          <span className="tabular-nums text-brand-black">
            {d.estado === "aplicado" && d.monto_aplicado !== null ? pesos.format(d.monto_aplicado) : pesos.format(d.monto)}
          </span>
        </span>
      </li>
    );
  };
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <h3 className="font-display text-sm uppercase text-brand-slate">Descuentos de nómina</h3>
      {programados.length > 0 && (
        <>
          <p className="mt-2 font-sans text-xs font-semibold uppercase tracking-wide text-brand-slate/70">Próximos</p>
          <ul className="flex flex-col divide-y divide-brand-slate/10">{programados.map(fila)}</ul>
        </>
      )}
      {historial.length > 0 && (
        <details className="group mt-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center font-sans text-sm font-semibold text-brand-slate hover:text-brand-black [&::-webkit-details-marker]:hidden">
            Historial de descuentos ({historial.length})
          </summary>
          <ul className="flex flex-col divide-y divide-brand-slate/10">{historial.map(fila)}</ul>
        </details>
      )}
    </div>
  );
}
