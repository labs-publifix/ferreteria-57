"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { ExternalLink, Mail } from "lucide-react";
import { Button, ConfirmDialog } from "@/components/ui";
import { promoTipoInfo } from "@/lib/club57/promociones/config";
import { formatRangoLegible } from "@/lib/club57/promociones/vigencia";
import { estimarAvisoNuevo } from "@/lib/club57/avisos/estimacion";
import type { AvisoPanelData } from "@/lib/club57/avisos/tipos";
import { cargarAvisoPanel, crearAviso, enviarAvisoPrueba } from "@/app/(admin)/admin/(protected)/lealtad/promociones/avisos-actions";
import { describeActionFailure } from "@/lib/admin/describeActionFailure";
import { AvisoProgreso } from "./AvisoProgreso";
import {
  TEXTO_MES_CERCA,
  TEXTO_NO_ALCANZA,
  dias,
  esActiva,
  formatDia,
  formatInstante,
  miembros,
} from "./formato";

type Modo = "ahora" | "programar" | "no";
type Alcance = "todos" | "no_recibieron";

const REFRESCO_MS = 15_000;

// Paso "AVISO POR EMAIL": se usa tal cual al publicar (paso 4 del
// asistente) y desde la acción "Enviar aviso" de la lista. El correo solo
// invita a iniciar sesión; el contenido se descarga dentro de la cuenta.
export function PromoEmailNotice({
  promocionId,
  onCerrar,
  onCambio,
}: {
  promocionId: string;
  /** Si existe, se muestra "Cerrar" (uso dentro de un modal). */
  onCerrar?: () => void;
  /** Avisa al contenedor que algo cambió (para refrescar la lista). */
  onCambio?: () => void;
}) {
  const headingId = useId();
  const confirmRepetidoId = useId();
  const [data, setData] = useState<AvisoPanelData | null>(null);
  const [cargaError, setCargaError] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo | null>(null);
  const [alcance, setAlcance] = useState<Alcance | null>(null);
  const [confirmarRepetido, setConfirmarRepetido] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [busy, setBusy] = useState<null | "prueba" | "crear">(null);
  const [mensaje, setMensaje] = useState<{ tono: "error" | "ok" | "info"; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const r = await cargarAvisoPanel(promocionId);
      if (r.error || !r.data) {
        setCargaError(r.error ?? "No se pudo cargar el aviso.");
        return;
      }
      setCargaError(null);
      setData(r.data);
    } catch (error) {
      setCargaError((await describeActionFailure(error, "cargar el aviso")).message);
    }
  }, [promocionId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const activa = data?.campanas.find((c) => esActiva(c)) ?? null;

  useEffect(() => {
    if (!activa) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void cargar();
    }, REFRESCO_MS);
    return () => window.clearInterval(timer);
  }, [activa, cargar]);

  if (cargaError) {
    return (
      <section aria-labelledby={headingId} className="w-full rounded-lg border border-brand-slate/15 p-4 text-left">
        <h3 id={headingId} className="font-display text-sm uppercase text-brand-slate">
          Aviso por email
        </h3>
        <p role="alert" className="mt-2 font-sans text-sm text-red-700">
          {cargaError}
        </p>
        <Button variant="secondary" className="mt-3 w-full sm:w-auto" onClick={() => void cargar()}>
          Reintentar
        </Button>
      </section>
    );
  }

  if (!data) {
    return (
      <section aria-labelledby={headingId} aria-busy="true" className="w-full rounded-lg border border-brand-slate/15 p-4 text-left">
        <h3 id={headingId} className="font-display text-sm uppercase text-brand-slate">
          Aviso por email
        </h3>
        <p className="mt-2 font-sans text-sm text-brand-slate">Calculando destinatarios…</p>
      </section>
    );
  }

  const { promo, hoy, capacidad, destinatarios } = data;
  const vigenciaEmpezo = hoy >= promo.inicio;
  const modoActual: Modo = modo ?? (vigenciaEmpezo ? "ahora" : "programar");
  const previa = data.campanas.find((c) => c.enviados > 0) ?? null;
  const alcanceActual: Alcance =
    alcance ?? (previa && destinatarios.noRecibieron > 0 ? "no_recibieron" : "todos");
  const total = alcanceActual === "todos" ? destinatarios.todos : destinatarios.noRecibieron;
  const requiereConfirmarRepetido = Boolean(previa) && alcanceActual === "todos";
  const tipoLabel = promoTipoInfo(promo.tipo).label;

  const estimacion =
    modoActual === "no" || total === 0
      ? null
      : estimarAvisoNuevo({
          hoy,
          restantesHoy: capacidad.restantesHoy,
          capDiario: capacidad.capDiario,
          cola: data.cola,
          total,
          inicioDia: modoActual === "ahora" ? hoy : promo.inicio,
          finVigencia: promo.fin,
          orden: modoActual === "ahora" ? data.ahoraMs : data.programadoInicioMs,
        });
  const hayColaAntes = data.cola.some(
    (c) => c.pendientes > 0 && c.orden < (modoActual === "ahora" ? data.ahoraMs : data.programadoInicioMs)
  );

  async function handlePrueba() {
    setBusy("prueba");
    setMensaje(null);
    try {
      const r = await enviarAvisoPrueba(promo.id);
      if (r.error) setMensaje({ tono: "error", texto: r.error });
      else setMensaje({ tono: "ok", texto: `Prueba enviada a ${r.email}. Revisa tu bandeja de entrada.` });
      await cargar();
    } catch (error) {
      setMensaje({ tono: "error", texto: (await describeActionFailure(error, "enviar la prueba")).message });
    }
    setBusy(null);
  }

  async function handleCrear() {
    if (modoActual === "no") return;
    setConfirmando(false);
    setBusy("crear");
    setMensaje(null);
    try {
      const r = await crearAviso({
        promocionId: promo.id,
        modo: modoActual,
        alcance: alcanceActual,
        confirmarRepetido: requiereConfirmarRepetido ? confirmarRepetido : undefined,
      });
      if (r.error) {
        setMensaje({ tono: "error", texto: r.error });
      } else if (modoActual === "programar") {
        setMensaje({ tono: "ok", texto: `Aviso programado para el ${formatInstante(new Date(data!.programadoInicioMs).toISOString())}.` });
      } else {
        const enviados = r.enviadosAhora ?? 0;
        setMensaje({
          tono: r.aviso ? "info" : "ok",
          texto: r.aviso ?? (enviados > 0 ? `Listo: salieron ${miembros(enviados)} en este momento.` : "Aviso en curso."),
        });
      }
      await cargar();
      onCambio?.();
    } catch (error) {
      setMensaje({ tono: "error", texto: (await describeActionFailure(error, "enviar el aviso")).message });
    }
    setBusy(null);
  }

  const opcionClass = (selected: boolean, disabled = false) =>
    `flex cursor-pointer gap-3 rounded-md border p-3 ${
      disabled
        ? "cursor-not-allowed border-brand-slate/10 opacity-60"
        : selected
          ? "border-brand-orange bg-brand-orange/5"
          : "border-brand-slate/20 hover:border-brand-slate/40"
    }`;

  const textoEstimacion = (() => {
    if (!estimacion) return null;
    const limite = `Con el límite actual de ${capacidad.capDiario.toLocaleString("es-MX")} envíos por día`;
    if (capacidad.capDiario <= 0) return "Por ahora no hay capacidad de envío diaria disponible.";
    if (estimacion.noAlcanzan > 0) {
      return `${limite}, el aviso llegaría a ${estimacion.alcanzan.toLocaleString("es-MX")} de ${total.toLocaleString("es-MX")} antes de que venza la promoción (${formatDia(promo.fin, hoy)}).`;
    }
    if (!estimacion.fechaFin) return null;
    if (estimacion.dias <= 1) {
      return estimacion.fechaFin === hoy
        ? `${limite}, el aviso llegará a todos hoy.`
        : `${limite}, el aviso llegará a todos el ${formatDia(estimacion.fechaFin, hoy)}.`;
    }
    return `${limite}, el aviso llegará a todos en ${dias(estimacion.dias)}, el ${formatDia(estimacion.fechaFin, hoy)}.`;
  })();

  const puedeEnviar =
    modoActual !== "no" && total > 0 && (!requiereConfirmarRepetido || confirmarRepetido) && busy === null;

  return (
    <section
      aria-labelledby={headingId}
      className={`flex w-full flex-col gap-4 text-left ${onCerrar ? "" : "rounded-lg border border-brand-slate/15 p-4 sm:p-5"}`}
    >
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 size-5 shrink-0 text-brand-orange" aria-hidden="true" strokeWidth={1.75} />
        <div className="min-w-0">
          <h3 id={headingId} className="font-display text-sm uppercase leading-snug text-brand-slate sm:text-base">
            {activa ? "Aviso por email" : "¿Quieres avisar a los miembros de Club 57 por email?"}
          </h3>
          <p className="mt-1 font-sans text-xs text-brand-slate">
            {tipoLabel} · {formatRangoLegible(promo)}
          </p>
        </div>
      </div>

      {activa ? (
        <AvisoProgreso
          campana={activa}
          capacidad={capacidad}
          hoy={hoy}
          onCambio={() => {
            void cargar();
            onCambio?.();
          }}
        />
      ) : (
        <>
          <p className="font-sans text-sm text-brand-black">
            El correo invita a iniciar sesión: la promoción solo se descarga dentro de la cuenta del miembro.
          </p>

          {previa && (
            <div className="rounded-md bg-brand-gray/60 px-3 py-2.5 font-sans text-sm text-brand-black">
              Ya se envió un aviso de esta promoción
              {previa.ultimoEnvio ? ` el ${formatInstante(previa.ultimoEnvio)}` : ""} a {miembros(previa.enviados)}.
            </div>
          )}

          {previa && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 font-sans text-sm font-semibold text-brand-black">¿A quién?</legend>
              <label className={opcionClass(alcanceActual === "no_recibieron", destinatarios.noRecibieron === 0)}>
                <input
                  type="radio"
                  name={`${headingId}-alcance`}
                  className="mt-1 size-4 accent-brand-orange"
                  checked={alcanceActual === "no_recibieron"}
                  disabled={destinatarios.noRecibieron === 0}
                  onChange={() => setAlcance("no_recibieron")}
                />
                <span className="font-sans text-sm">
                  <span className="block font-semibold text-brand-black">Enviar a quienes no lo recibieron</span>
                  <span className="text-brand-slate">
                    {destinatarios.noRecibieron > 0
                      ? `${miembros(destinatarios.noRecibieron)} con envío pendiente o fallido`
                      : "Todos los miembros ya lo recibieron"}
                  </span>
                </span>
              </label>
              <label className={opcionClass(alcanceActual === "todos")}>
                <input
                  type="radio"
                  name={`${headingId}-alcance`}
                  className="mt-1 size-4 accent-brand-orange"
                  checked={alcanceActual === "todos"}
                  onChange={() => setAlcance("todos")}
                />
                <span className="font-sans text-sm">
                  <span className="block font-semibold text-brand-black">Enviar otra vez a todos</span>
                  <span className="text-brand-slate">{miembros(destinatarios.todos)}; quienes ya lo recibieron lo recibirán de nuevo</span>
                </span>
              </label>
              {alcanceActual === "todos" && (
                <label htmlFor={confirmRepetidoId} className="flex items-start gap-2 px-1 font-sans text-sm text-brand-black">
                  <input
                    id={confirmRepetidoId}
                    type="checkbox"
                    className="mt-0.5 size-4 accent-brand-orange"
                    checked={confirmarRepetido}
                    onChange={(event) => setConfirmarRepetido(event.target.checked)}
                  />
                  Sí, quiero enviar el aviso otra vez a todos los miembros.
                </label>
              )}
            </fieldset>
          )}

          <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 rounded-md bg-brand-gray/60 px-3 py-3 font-sans text-sm sm:grid-cols-[auto_1fr]">
            <dt className="font-semibold text-brand-slate">Destinatarios</dt>
            <dd className="tabular-nums text-brand-black">
              {miembros(total)}
              <span className="block text-xs text-brand-slate">Con correo y sin baja de avisos</span>
            </dd>
            <dt className="font-semibold text-brand-slate">Límite diario</dt>
            <dd className="tabular-nums text-brand-black">
              {capacidad.capDiario.toLocaleString("es-MX")} envíos por día
              <span className="block text-xs text-brand-slate">
                Hoy se enviaron {capacidad.usadosHoy.toLocaleString("es-MX")} de {capacidad.capDiario.toLocaleString("es-MX")} permitidos
              </span>
            </dd>
          </dl>

          {total === 0 && (
            <p className="font-sans text-sm text-brand-slate">No hay miembros a quienes enviar este aviso.</p>
          )}

          {textoEstimacion && <p className="font-sans text-sm text-brand-black">{textoEstimacion}</p>}
          {hayColaAntes && modoActual !== "no" && (
            <p className="font-sans text-xs text-brand-slate">Hay otro aviso en curso: este sale cuando termine.</p>
          )}
          {estimacion && estimacion.noAlcanzan > 0 && (
            <p role="status" className="rounded-md bg-amber-50 px-3 py-2.5 font-sans text-sm text-amber-900">
              {TEXTO_NO_ALCANZA}
              <span className="mt-1 block text-xs">
                {miembros(estimacion.noAlcanzan)} quedarían como «omitido (promoción vencida)» y ya no se les envía después.
              </span>
            </p>
          )}
          {capacidad.cercaLimiteMensual && modoActual !== "no" && (
            <p role="status" className="rounded-md bg-amber-50 px-3 py-2.5 font-sans text-sm text-amber-900">
              {TEXTO_MES_CERCA}
            </p>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-sans text-sm font-semibold text-brand-black">¿Cuándo?</legend>
            <label className={opcionClass(modoActual === "ahora", !vigenciaEmpezo)}>
              <input
                type="radio"
                name={`${headingId}-modo`}
                className="mt-1 size-4 accent-brand-orange"
                checked={modoActual === "ahora"}
                disabled={!vigenciaEmpezo}
                onChange={() => setModo("ahora")}
              />
              <span className="font-sans text-sm">
                <span className="block font-semibold text-brand-black">Enviar ahora</span>
                <span className="text-brand-slate">
                  {vigenciaEmpezo ? "Empieza en este momento" : "Disponible cuando empiece la vigencia"}
                </span>
              </span>
            </label>
            {!vigenciaEmpezo && (
              <label className={opcionClass(modoActual === "programar")}>
                <input
                  type="radio"
                  name={`${headingId}-modo`}
                  className="mt-1 size-4 accent-brand-orange"
                  checked={modoActual === "programar"}
                  onChange={() => setModo("programar")}
                />
                <span className="font-sans text-sm">
                  <span className="block font-semibold text-brand-black">Programar para el inicio de la vigencia</span>
                  <span className="text-brand-slate">{formatInstante(new Date(data.programadoInicioMs).toISOString())}</span>
                </span>
              </label>
            )}
            <label className={opcionClass(modoActual === "no")}>
              <input
                type="radio"
                name={`${headingId}-modo`}
                className="mt-1 size-4 accent-brand-orange"
                checked={modoActual === "no"}
                onChange={() => setModo("no")}
              />
              <span className="font-sans text-sm">
                <span className="block font-semibold text-brand-black">No enviar por ahora</span>
                <span className="text-brand-slate">Puedes enviarlo después desde la lista con «Enviar aviso»</span>
              </span>
            </label>
          </fieldset>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {modoActual !== "no" && (
              <Button className="w-full sm:w-auto" disabled={!puedeEnviar} onClick={() => setConfirmando(true)}>
                {busy === "crear" ? "Enviando…" : modoActual === "ahora" ? "Enviar aviso" : "Programar aviso"}
              </Button>
            )}
            <Button variant="secondary" className="w-full sm:w-auto" disabled={busy !== null} onClick={handlePrueba}>
              {busy === "prueba" ? "Enviando prueba…" : "Enviarme una prueba"}
            </Button>
            <Link
              href={`/admin/lealtad/promociones/email-preview/${promoTipoInfo(promo.tipo).slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md px-3 font-sans text-sm font-medium text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            >
              <ExternalLink className="size-4" aria-hidden="true" strokeWidth={1.75} />
              Ver diseño del correo
            </Link>
          </div>
          {data.adminEmail && (
            <p className="-mt-2 font-sans text-xs text-brand-slate">
              La prueba llega a {data.adminEmail} y cuenta dentro del límite de envíos de hoy.
            </p>
          )}
        </>
      )}

      {mensaje && (
        <p
          role={mensaje.tono === "error" ? "alert" : "status"}
          className={`rounded-md px-3 py-2.5 font-sans text-sm ${
            mensaje.tono === "error"
              ? "bg-red-50 text-red-700"
              : mensaje.tono === "ok"
                ? "bg-green-50 text-green-800"
                : "bg-amber-50 text-amber-900"
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      {onCerrar && (
        <div className="flex justify-end">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onCerrar}>
            Cerrar
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmando}
        title={modoActual === "ahora" ? "Enviar aviso" : "Programar aviso"}
        description={`Se enviará a ${miembros(total)}${
          modoActual === "programar" ? ` a partir del ${formatInstante(new Date(data.programadoInicioMs).toISOString())}` : ""
        }. Asunto: «${data.asuntoMuestra}».`}
        confirmLabel={modoActual === "ahora" ? "Enviar aviso" : "Programar aviso"}
        cancelLabel="Volver"
        onConfirm={handleCrear}
        onCancel={() => setConfirmando(false)}
      />
    </section>
  );
}
