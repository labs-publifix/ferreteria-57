"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { ExternalLink, Mail } from "lucide-react";
import { Button, ConfirmDialog, Modal } from "@/components/ui";
import type { PromoEstado } from "@/lib/club57/promociones/config";
import { formatBytes } from "@/lib/club57/promociones/archivo";
import {
  PROMO_ESTADO_BADGE_CLASS,
  PROMO_ESTADO_LABEL,
  formatRangoLegible,
  promoEstadoParaChip,
} from "@/lib/club57/promociones/vigencia";
import {
  archivePromo,
  deleteArchivedPromo,
  deletePromoDraft,
  setPromoVigencia,
} from "@/app/(admin)/admin/(protected)/lealtad/promociones/actions";
import {
  PromoRangePicker,
  promoRangeConflict,
  type PromoPublicadaRef,
  type PromoRangoParcial,
} from "./PromoRangePicker";
import { describeActionFailure } from "@/lib/admin/describeActionFailure";
import type { AvisosListaData } from "@/lib/club57/avisos/tipos";
import { cargarAvisosLista } from "@/app/(admin)/admin/(protected)/lealtad/promociones/avisos-actions";
import { AvisoProgreso } from "./avisos/AvisoProgreso";
import { PromoEmailNotice } from "./avisos/PromoEmailNotice";
import { esActiva, formatFechaInstante } from "./avisos/formato";

const AVISOS_REFRESCO_MS = 20_000;

export interface PromoListRow {
  id: string;
  titulo: string;
  estado: PromoEstado;
  inicio: string | null;
  fin: string | null;
  nombre: string;
  bytes: number;
  descargasUnicas: number;
  descargasTotales: number;
  archivoEliminado: boolean;
  fuente: { nombre: string; productos: number } | null;
}

const linkActionClass =
  "inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 font-sans text-sm font-medium text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate disabled:opacity-50";

function confirmDescription(kind: "archivar" | "eliminar" | "eliminar-archivada", row: PromoListRow): string {
  if (kind === "archivar") {
    return `"${row.titulo}" quedará inactiva de inmediato: los miembros ya no podrán descargarla. Esta acción no se puede deshacer.`;
  }
  if (kind === "eliminar") {
    return `¿Eliminar el borrador "${row.titulo}" y su archivo? Esta acción no se puede deshacer.`;
  }
  if (row.descargasTotales === 0) {
    return `Se eliminará "${row.titulo}" por completo, junto con su PDF (${formatBytes(row.bytes)}). Nadie la descargó. Esta acción no se puede deshacer.`;
  }
  const unicas = `${row.descargasUnicas} ${row.descargasUnicas === 1 ? "descarga única" : "descargas únicas"}`;
  return `Se eliminará el PDF de "${row.titulo}" (${formatBytes(row.bytes)}) para liberar espacio. Se conserva el registro con sus fechas y ${unicas}. Esta acción no se puede deshacer.`;
}

export function PromocionesList({
  rows,
  hoy,
  publicadas,
  nuevaHref,
  avisos = null,
}: {
  rows: PromoListRow[];
  hoy: string;
  publicadas: PromoPublicadaRef[];
  nuevaHref: string;
  /** Aviso por email (null = función apagada: la lista queda como siempre). */
  avisos?: AvisosListaData | null;
}) {
  const router = useRouter();
  const editTitleId = useId();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<{ kind: "archivar" | "eliminar" | "eliminar-archivada"; row: PromoListRow } | null>(null);
  const [editTarget, setEditTarget] = useState<PromoListRow | null>(null);
  const [editRango, setEditRango] = useState<PromoRangoParcial>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const avisoTitleId = useId();
  const [avisosData, setAvisosData] = useState<AvisosListaData | null>(avisos);
  const [avisoTarget, setAvisoTarget] = useState<PromoListRow | null>(null);

  useEffect(() => setAvisosData(avisos), [avisos]);

  const recargarAvisos = useCallback(async () => {
    if (!avisos) return;
    try {
      const r = await cargarAvisosLista(Object.keys(avisos.porPromo));
      if (r.data) setAvisosData(r.data);
    } catch {
      // Se reintenta en el siguiente ciclo; la lista sigue utilizable.
    }
  }, [avisos]);

  const hayAvisoActivo = avisosData ? Object.values(avisosData.porPromo).some((a) => esActiva(a.ultima)) : false;
  useEffect(() => {
    if (!hayAvisoActivo) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void recargarAvisos();
    }, AVISOS_REFRESCO_MS);
    return () => window.clearInterval(timer);
  }, [hayAvisoActivo, recargarAvisos]);

  async function runRowAction(id: string, action: () => Promise<{ error?: string }>) {
    setPendingId(id);
    setRowErrors((current) => ({ ...current, [id]: "" }));
    let message: string | undefined;
    try {
      message = (await action()).error;
    } catch (actionError) {
      message = (await describeActionFailure(actionError, "completar la acción")).message;
    }
    if (message) setRowErrors((current) => ({ ...current, [id]: message! }));
    setPendingId(null);
    router.refresh();
  }

  function handleConfirm() {
    if (!confirm) return;
    const { kind, row } = confirm;
    setConfirm(null);
    void runRowAction(row.id, () =>
      kind === "archivar"
        ? archivePromo(row.id)
        : kind === "eliminar-archivada"
          ? deleteArchivedPromo(row.id)
          : deletePromoDraft(row.id)
    );
  }

  function openEdit(row: PromoListRow) {
    setEditTarget(row);
    setEditRango({ inicio: row.inicio ?? undefined, fin: row.fin ?? undefined });
    setEditError(null);
  }

  async function handleSaveDates() {
    if (!editTarget || !editRango.inicio || !editRango.fin) return;
    setIsSaving(true);
    setEditError(null);
    let message: string | undefined;
    try {
      message = (await setPromoVigencia(editTarget.id, editRango.inicio, editRango.fin)).error;
    } catch (saveError) {
      message = (await describeActionFailure(saveError, "guardar las fechas")).message;
    }
    setIsSaving(false);
    if (message) return setEditError(message);
    setEditTarget(null);
    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg bg-white p-8 text-center shadow-sm">
        <p className="font-sans text-sm text-brand-slate">Todavía no hay promociones de este tipo.</p>
        <Link href={nuevaHref} className="font-sans text-sm font-semibold text-brand-black underline underline-offset-2">
          Cargar la primera
        </Link>
      </div>
    );
  }

  const editConflict = editTarget ? promoRangeConflict(editRango, publicadas, editTarget.id) : null;
  const editMin = editTarget?.inicio && editTarget.inicio < hoy ? editTarget.inicio : hoy;

  return (
    <>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => {
          const chip = promoEstadoParaChip(row.estado, { inicio: row.inicio ?? undefined, fin: row.fin ?? undefined }, hoy);
          const isPending = pendingId === row.id;
          const rowError = rowErrors[row.id];
          const aviso = avisosData?.porPromo[row.id];
          const puedeAvisar =
            Boolean(avisosData) && row.estado === "publicada" && !row.archivoEliminado && (chip === "vigente" || chip === "programada");
          return (
            <li key={row.id} className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words font-sans text-base font-semibold text-brand-black">{row.titulo}</p>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${PROMO_ESTADO_BADGE_CLASS[chip]}`}>
                    {PROMO_ESTADO_LABEL[chip]}
                  </span>
                </div>
                <p className="mt-1 font-sans text-sm text-brand-black">
                  {row.inicio && row.fin ? formatRangoLegible({ inicio: row.inicio, fin: row.fin }) : "Sin fechas todavía"}
                </p>
                <p className="mt-0.5 break-words font-sans text-xs text-brand-slate">
                  {row.archivoEliminado
                    ? "PDF eliminado para liberar espacio"
                    : row.fuente
                      ? `${row.fuente.nombre} · ${row.fuente.productos} ${row.fuente.productos === 1 ? "producto" : "productos"} · PDF ${formatBytes(row.bytes)}`
                      : `${row.nombre} · ${formatBytes(row.bytes)}`}
                  {row.estado !== "borrador" && (
                    <>
                      {" "}
                      · {row.descargasUnicas} {row.descargasUnicas === 1 ? "descarga única" : "descargas únicas"}
                    </>
                  )}
                </p>
                {rowError && (
                  <p role="alert" className="mt-1 font-sans text-xs text-red-700">
                    {rowError}
                  </p>
                )}
                {avisosData && aviso?.metricas && (
                  <p className="mt-0.5 font-sans text-xs tabular-nums text-brand-slate">
                    Aviso{aviso.metricas.ultimoEnvio ? ` del ${formatFechaInstante(aviso.metricas.ultimoEnvio)}` : ""}:{" "}
                    {aviso.metricas.descargaron} de {aviso.metricas.enviados}{" "}
                    {aviso.metricas.enviados === 1 ? "destinatario descargó" : "destinatarios descargaron"}
                  </p>
                )}
                {avisosData && aviso?.ultima && (esActiva(aviso.ultima) || aviso.ultima.fallidos > 0) && (
                  <div className="mt-3">
                    <AvisoProgreso
                      campana={aviso.ultima}
                      capacidad={avisosData.capacidad}
                      hoy={hoy}
                      onCambio={() => {
                        void recargarAvisos();
                        router.refresh();
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="-ml-3 flex flex-wrap items-center gap-1 sm:ml-0 sm:justify-end">
                {row.estado === "borrador" ? (
                  <>
                    <Link href={`${nuevaHref}?borrador=${row.id}`} className={linkActionClass}>
                      Continuar
                    </Link>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setConfirm({ kind: "eliminar", row })}
                      className={`${linkActionClass} text-red-700`}
                    >
                      Eliminar
                    </button>
                  </>
                ) : row.archivoEliminado ? null : (
                  <>
                    <a
                      href={`/api/admin/lealtad/promociones/${row.id}/vista-previa`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkActionClass}
                    >
                      <ExternalLink className="size-4" aria-hidden="true" strokeWidth={1.75} />
                      Ver PDF
                    </a>
                    {puedeAvisar && (
                      <button type="button" disabled={isPending} onClick={() => setAvisoTarget(row)} className={linkActionClass}>
                        <Mail className="size-4" aria-hidden="true" strokeWidth={1.75} />
                        Enviar aviso
                      </button>
                    )}
                    {row.estado === "publicada" && (
                      <>
                        <button type="button" disabled={isPending} onClick={() => openEdit(row)} className={linkActionClass}>
                          Editar fechas
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setConfirm({ kind: "archivar", row })}
                          className={`${linkActionClass} text-red-700`}
                        >
                          Archivar
                        </button>
                      </>
                    )}
                    {row.estado === "archivada" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setConfirm({ kind: "eliminar-archivada", row })}
                        className={`${linkActionClass} text-red-700`}
                      >
                        Eliminar
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.kind === "archivar"
            ? "Archivar promoción"
            : confirm?.kind === "eliminar-archivada"
              ? "Eliminar promoción archivada"
              : "Eliminar borrador"
        }
        description={confirm ? confirmDescription(confirm.kind, confirm.row) : undefined}
        confirmLabel={confirm?.kind === "archivar" ? "Archivar" : "Eliminar"}
        tone="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />

      {avisoTarget && (
        <Modal titleId={avisoTitleId} onClose={() => setAvisoTarget(null)} maxWidthClassName="max-w-lg">
          <h2 id={avisoTitleId} className="pr-10 font-display text-base uppercase text-brand-slate">
            Enviar aviso
          </h2>
          <p className="mb-4 mt-1 break-words font-sans text-sm text-brand-slate">{avisoTarget.titulo}</p>
          <PromoEmailNotice
            promocionId={avisoTarget.id}
            onCerrar={() => setAvisoTarget(null)}
            onCambio={() => {
              void recargarAvisos();
              router.refresh();
            }}
          />
        </Modal>
      )}

      {editTarget && (
        <Modal titleId={editTitleId} onClose={() => setEditTarget(null)} maxWidthClassName="max-w-lg">
          <h2 id={editTitleId} className="pr-10 font-display text-base uppercase text-brand-slate">
            Editar fechas
          </h2>
          <p className="mb-4 mt-1 break-words font-sans text-sm text-brand-slate">
            {editTarget.titulo}
            {editTarget.fuente && (
              <span className="mt-1 block text-xs">Al guardar se vuelve a generar el PDF con las nuevas fechas.</span>
            )}
          </p>
          <PromoRangePicker
            hoy={hoy}
            minDate={editMin}
            value={editRango}
            onChange={setEditRango}
            publicadas={publicadas}
            excludeId={editTarget.id}
          />
          {editError && (
            <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
              {editError}
            </p>
          )}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setEditTarget(null)}>
              Cancelar
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={!editRango.inicio || !editRango.fin || Boolean(editConflict) || isSaving}
              onClick={handleSaveDates}
            >
              {isSaving ? (editTarget.fuente ? "Generando PDF…" : "Guardando…") : "Guardar fechas"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
