"use client";

import { useState } from "react";
import { Button, ConfirmDialog } from "@/components/ui";
import type { AvisoCampanaResumen, AvisoCapacidad } from "@/lib/club57/avisos/tipos";
import { cancelarAviso, reintentarFallidosAviso } from "@/app/(admin)/admin/(protected)/lealtad/promociones/avisos-actions";
import { describeActionFailure } from "@/lib/admin/describeActionFailure";
import {
  AVISO_ESTADO_CLASS,
  AVISO_ESTADO_LABEL,
  TEXTO_LIMITE_HOY,
  TEXTO_LIMITE_MES,
  TEXTO_NO_ALCANZA,
  esActiva,
  formatDia,
  formatInstante,
} from "./formato";

// Progreso de un aviso por email: barra, conteos, capacidad de hoy y fin
// estimado, con "Reintentar fallidos" y "Cancelar". Lo usa la fila de la
// lista y el paso de aviso.
export function AvisoProgreso({
  campana,
  capacidad,
  hoy,
  compacto = false,
  onCambio,
}: {
  campana: AvisoCampanaResumen;
  capacidad: AvisoCapacidad;
  hoy: string;
  compacto?: boolean;
  onCambio: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [mensaje, setMensaje] = useState<{ tono: "error" | "info"; texto: string } | null>(null);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);

  const activa = esActiva(campana);
  const procesados = campana.enviados + campana.fallidos + campana.omitidos;
  const porcentaje = campana.total > 0 ? Math.round((procesados / campana.total) * 100) : 0;
  const omitidosOtros = campana.omitidos - campana.omitidosVencida;
  const programadaFutura = campana.estado === "programada" && new Date(campana.programadoPara).getTime() > Date.now();

  async function correr(accion: () => Promise<{ error?: string; aviso?: string }>, okTexto?: string) {
    setBusy(true);
    setMensaje(null);
    try {
      const r = await accion();
      if (r.error) setMensaje({ tono: "error", texto: r.error });
      else if (r.aviso) setMensaje({ tono: "info", texto: r.aviso });
      else if (okTexto) setMensaje({ tono: "info", texto: okTexto });
    } catch (error) {
      setMensaje({ tono: "error", texto: (await describeActionFailure(error, "completar la acción")).message });
    }
    setBusy(false);
    onCambio();
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-brand-slate/15 bg-brand-gray/40 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="font-sans text-sm font-semibold text-brand-black">Aviso por email</p>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${AVISO_ESTADO_CLASS[campana.estado]}`}>
          {AVISO_ESTADO_LABEL[campana.estado]}
        </span>
        {campana.alcance === "no_recibieron" && (
          <span className="font-sans text-xs text-brand-slate">· a quienes no lo recibieron</span>
        )}
      </div>

      {programadaFutura ? (
        <p className="font-sans text-sm text-brand-black">
          Sale el {formatInstante(campana.programadoPara)} a {campana.total.toLocaleString("es-MX")}{" "}
          {campana.total === 1 ? "miembro" : "miembros"}.
        </p>
      ) : (
        <>
          <div>
            <div
              role="progressbar"
              aria-label="Avance del aviso"
              aria-valuemin={0}
              aria-valuemax={campana.total}
              aria-valuenow={procesados}
              aria-valuetext={`${campana.enviados} de ${campana.total} enviados`}
              className="h-2 w-full overflow-hidden rounded-full bg-brand-slate/15"
            >
              <div className="h-full rounded-full bg-brand-orange" style={{ width: `${porcentaje}%` }} />
            </div>
            <p className="mt-1.5 font-sans text-sm tabular-nums text-brand-black">
              <span className="font-semibold">{campana.enviados.toLocaleString("es-MX")}</span> de{" "}
              {campana.total.toLocaleString("es-MX")} enviados
            </p>
          </div>
          <dl className="flex flex-wrap gap-x-4 gap-y-0.5 font-sans text-xs tabular-nums text-brand-slate">
            {campana.pendientes > 0 && (
              <div className="flex gap-1">
                <dt>Pendientes</dt>
                <dd className="font-semibold text-brand-black">{campana.pendientes}</dd>
              </div>
            )}
            {campana.fallidos > 0 && (
              <div className="flex gap-1">
                <dt>Fallidos</dt>
                <dd className="font-semibold text-red-700">{campana.fallidos}</dd>
              </div>
            )}
            {campana.omitidosVencida > 0 && (
              <div className="flex gap-1">
                <dt>Omitidos (promoción vencida)</dt>
                <dd className="font-semibold text-brand-black">{campana.omitidosVencida}</dd>
              </div>
            )}
            {omitidosOtros > 0 && (
              <div className="flex gap-1">
                <dt>Omitidos</dt>
                <dd className="font-semibold text-brand-black">{omitidosOtros}</dd>
              </div>
            )}
          </dl>
        </>
      )}

      {activa && !compacto && (
        <p className="font-sans text-xs tabular-nums text-brand-slate">
          Hoy se enviaron {capacidad.usadosHoy.toLocaleString("es-MX")} de {capacidad.capDiario.toLocaleString("es-MX")}{" "}
          permitidos
          {campana.fechaFinEstimada && campana.pendientes > 0
            ? ` · Termina aprox. el ${formatDia(campana.fechaFinEstimada, hoy)}`
            : ""}
        </p>
      )}
      {activa && compacto && campana.fechaFinEstimada && campana.pendientes > 0 && (
        <p className="font-sans text-xs text-brand-slate">Termina aprox. el {formatDia(campana.fechaFinEstimada, hoy)}</p>
      )}
      {!activa && campana.ultimoEnvio && (
        <p className="font-sans text-xs text-brand-slate">Último envío: {formatInstante(campana.ultimoEnvio)}</p>
      )}

      {activa && campana.pausaMotivo && (
        <p role="status" className="rounded-md bg-amber-50 px-3 py-2 font-sans text-xs text-amber-900">
          {campana.pausaMotivo === "limite_mensual" ? TEXTO_LIMITE_MES : TEXTO_LIMITE_HOY}
        </p>
      )}
      {activa && campana.noAlcanzan > 0 && (
        <p role="status" className="rounded-md bg-amber-50 px-3 py-2 font-sans text-xs text-amber-900">
          {TEXTO_NO_ALCANZA}
        </p>
      )}

      {(activa || campana.fallidos > 0) && (
        <div className="-ml-2 flex flex-wrap gap-1">
          {campana.fallidos > 0 && campana.estado !== "cancelada" && (
            <Button
              variant="secondary"
              className="min-h-11 px-3 py-1 text-sm"
              disabled={busy}
              onClick={() => correr(() => reintentarFallidosAviso(campana.id), "Los fallidos se volverán a enviar.")}
            >
              Reintentar fallidos
            </Button>
          )}
          {activa && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmarCancelar(true)}
              className="inline-flex min-h-11 items-center rounded-md px-3 font-sans text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate disabled:opacity-50"
            >
              Cancelar aviso
            </button>
          )}
        </div>
      )}

      {mensaje && (
        <p
          role={mensaje.tono === "error" ? "alert" : "status"}
          className={`font-sans text-xs ${mensaje.tono === "error" ? "text-red-700" : "text-brand-slate"}`}
        >
          {mensaje.texto}
        </p>
      )}

      <ConfirmDialog
        open={confirmarCancelar}
        title="Cancelar aviso"
        description={`Los ${campana.pendientes} envíos pendientes ya no saldrán. Lo que ya se envió no cambia.`}
        confirmLabel="Cancelar aviso"
        cancelLabel="Volver"
        tone="danger"
        onConfirm={() => {
          setConfirmarCancelar(false);
          void correr(() => cancelarAviso(campana.id), "Aviso cancelado.");
        }}
        onCancel={() => setConfirmarCancelar(false)}
      />
    </div>
  );
}
