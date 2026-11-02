"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { Button, ConfirmDialog, Modal, Select } from "@/components/ui";
import { PartnerAvatar } from "@/components/club57/PartnerAvatar";
import {
  hardDeletePartner,
  restorePartner,
  setPartnerActivo,
  setPartnersConsentimiento,
  softDeletePartner,
} from "@/app/(admin)/admin/(protected)/lealtad/socios/actions";
import { estaPendiente, estaPublicado, type AdminPartnerRow } from "@/lib/club57/socios/adminList";
import { MEDIOS_CONSENTIMIENTO, medioLabel } from "@/lib/club57/socios/consentimiento";

type Accion = "desactivar" | "activar" | "eliminar" | "restaurar" | "borrar";

const ACCION_TEXTO: Record<Accion, { title: string; description: (n: string) => string; confirm: string; danger: boolean }> = {
  desactivar: {
    title: "Desactivar socio",
    description: (n) => `«${n}» dejará de verse en el directorio y en Mi cuenta. Puedes volver a activarlo cuando quieras.`,
    confirm: "Desactivar",
    danger: false,
  },
  activar: {
    title: "Activar socio",
    description: (n) => `«${n}» volverá a publicarse (si tiene giro asignado).`,
    confirm: "Activar",
    danger: false,
  },
  eliminar: {
    title: "Eliminar socio",
    description: (n) =>
      `«${n}» pasará a «Eliminados»: deja de publicarse y sale del listado. No se borra: puedes restaurarlo desde el filtro de estatus.`,
    confirm: "Eliminar",
    danger: true,
  },
  restaurar: {
    title: "Restaurar socio",
    description: (n) => `«${n}» regresa al listado con el mismo estatus que tenía.`,
    confirm: "Restaurar",
    danger: false,
  },
  borrar: {
    title: "Borrar definitivamente",
    description: (n) =>
      `Se borra «${n}» con su logotipo y no se puede deshacer. Si solo quieres ocultarlo, déjalo en «Eliminados».`,
    confirm: "Borrar definitivamente",
    danger: true,
  },
};

const rowButton =
  "min-h-11 whitespace-nowrap rounded-md px-2 font-sans text-sm font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const bulkButton =
  "inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-4 font-sans text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 disabled:opacity-50";

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
const medioCorto = (value: string | null) => medioLabel(value)?.replace(/ \(.*\)$/, "") ?? null;

// Tabla del listado del admin: scroll horizontal propio en pantallas chicas
// (la página nunca se ensancha), acciones por fila con confirmación y
// selección múltiple para registrar o quitar la autorización de datos de
// varios socios a la vez. La selección vive solo en esta vista: cambiar de
// filtro o de página la reinicia (la página le pasa una key con la URL).
export function Club57PartnersTable({
  rows,
  seleccionablesDelFiltro,
  canHardDelete,
}: {
  rows: AdminPartnerRow[];
  /** Ids de todos los socios no eliminados del filtro actual (todas las páginas). */
  seleccionablesDelFiltro: string[];
  canHardDelete: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<{ accion: Accion; row: AdminPartnerRow } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [seleccion, setSeleccion] = useState<Set<string>>(() => new Set());
  const [bulk, setBulk] = useState<"otorgar" | "retirar" | null>(null);
  const [medio, setMedio] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const bulkTitleId = useId();
  const headerCheckRef = useRef<HTMLInputElement>(null);

  const seleccionablesPagina = useMemo(() => rows.filter((row) => !row.eliminado_at).map((row) => row.id), [rows]);
  const marcadosPagina = seleccionablesPagina.filter((id) => seleccion.has(id)).length;
  const paginaCompleta = seleccionablesPagina.length > 0 && marcadosPagina === seleccionablesPagina.length;
  const hayMasEnFiltro = seleccionablesDelFiltro.length > seleccionablesPagina.length;
  const filtroCompleto = seleccion.size >= seleccionablesDelFiltro.length;

  useEffect(() => {
    if (headerCheckRef.current) headerCheckRef.current.indeterminate = marcadosPagina > 0 && !paginaCompleta;
  }, [marcadosPagina, paginaCompleta]);

  function alternar(id: string) {
    setAviso(null);
    setSeleccion((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function alternarPagina() {
    setAviso(null);
    setSeleccion((current) => {
      const next = new Set(current);
      if (paginaCompleta) seleccionablesPagina.forEach((id) => next.delete(id));
      else seleccionablesPagina.forEach((id) => next.add(id));
      return next;
    });
  }

  function cerrarBulk() {
    if (busy) return;
    setBulk(null);
    setMedio("");
    setConfirmado(false);
  }

  async function ejecutarBulk() {
    if (!bulk || busy) return;
    if (bulk === "otorgar" && (!medio || !confirmado)) return;
    setBusy(true);
    setError(null);
    const result = await setPartnersConsentimiento([...seleccion], bulk === "otorgar", bulk === "otorgar" ? medio : undefined);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const cambiados = result.cambiados ?? 0;
    const sinCambio = result.sinCambio ?? 0;
    const hecho =
      bulk === "otorgar"
        ? `Autorización registrada en ${plural(cambiados, "socio", "socios")}.`
        : `Autorización quitada a ${plural(cambiados, "socio", "socios")}.`;
    const resto =
      sinCambio > 0
        ? ` ${plural(sinCambio, "seleccionado ya estaba", "seleccionados ya estaban")} así y no se ${sinCambio === 1 ? "tocó" : "tocaron"}.`
        : "";
    setAviso(hecho + resto);
    setSeleccion(new Set());
    setBulk(null);
    setMedio("");
    setConfirmado(false);
    router.refresh();
  }

  async function ejecutar() {
    if (!pending) return;
    const { accion, row } = pending;
    setBusy(true);
    setError(null);
    const result =
      accion === "desactivar"
        ? await setPartnerActivo(row.id, false)
        : accion === "activar"
          ? await setPartnerActivo(row.id, true)
          : accion === "eliminar"
            ? await softDeletePartner(row.id)
            : accion === "restaurar"
              ? await restorePartner(row.id)
              : await hardDeletePartner(row.id);
    setBusy(false);
    setPending(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
        No hay socios con esos filtros.
      </p>
    );
  }

  const nombresSeleccion = rows.filter((row) => seleccion.has(row.id)).map((row) => row.nombre_comercial);
  const fueraDePagina = seleccion.size - nombresSeleccion.length;

  return (
    <>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      <p role="status" className={aviso ? "rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800" : "sr-only"}>
        {aviso ?? ""}
      </p>

      {seleccion.size > 0 && (
        <div
          role="region"
          aria-label="Acciones para los socios seleccionados"
          className="sticky top-2 z-20 flex flex-col gap-3 rounded-lg bg-brand-slate px-4 py-3 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="font-sans text-sm">
            <p className="font-semibold">{plural(seleccion.size, "socio seleccionado", "socios seleccionados")}</p>
            {paginaCompleta && hayMasEnFiltro && !filtroCompleto && (
              <button
                type="button"
                onClick={() => setSeleccion(new Set(seleccionablesDelFiltro))}
                className="min-h-11 text-left font-semibold text-white underline underline-offset-2 sm:min-h-0"
              >
                Seleccionar los {seleccionablesDelFiltro.length} socios del filtro
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setBulk("otorgar")} className={`${bulkButton} bg-white text-brand-black hover:bg-brand-gray`}>
              <ShieldCheck className="size-4" aria-hidden="true" strokeWidth={2} />
              Registrar autorización
            </button>
            <button
              type="button"
              onClick={() => setBulk("retirar")}
              className={`${bulkButton} border border-white/60 text-white hover:bg-white/10`}
            >
              <ShieldOff className="size-4" aria-hidden="true" strokeWidth={2} />
              Quitar autorización
            </button>
            <button
              type="button"
              onClick={() => setSeleccion(new Set())}
              className={`${bulkButton} px-3 text-white/90 underline underline-offset-2 hover:text-white`}
            >
              Limpiar selección
            </button>
          </div>
        </div>
      )}

      <div className="relative min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[880px] text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
              <th className="w-12 px-1 py-1">
                <label className="flex size-11 cursor-pointer items-center justify-center">
                  <input
                    ref={headerCheckRef}
                    type="checkbox"
                    checked={paginaCompleta}
                    onChange={alternarPagina}
                    disabled={seleccionablesPagina.length === 0}
                    aria-label="Seleccionar todos los socios de esta página"
                    className="size-5 accent-brand-slate"
                  />
                </label>
              </th>
              <th className="px-3 py-3">Socio</th>
              <th className="w-[140px] px-3 py-3">Giro</th>
              <th className="px-3 py-3">Contacto</th>
              <th className="px-3 py-3">Estatus</th>
              <th className="px-3 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const publicado = estaPublicado(row);
              const ubicacion = [row.colonia, row.municipio].filter(Boolean).join(", ");
              const marcado = seleccion.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={`border-b border-brand-slate/10 align-top last:border-0 ${marcado ? "bg-brand-gray/70" : ""}`}
                >
                  <td className="px-1 py-1.5">
                    {!row.eliminado_at && (
                      <label className="flex size-11 cursor-pointer items-center justify-center">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => alternar(row.id)}
                          aria-label={`Seleccionar ${row.nombre_comercial}`}
                          className="size-5 accent-brand-slate"
                        />
                      </label>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <PartnerAvatar nombre={row.nombre_comercial} logoUrl={row.logo_url} size="sm" />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/lealtad/socios/${row.id}`}
                          className="font-semibold text-brand-black underline-offset-2 hover:underline"
                        >
                          {row.nombre_comercial}
                        </Link>
                        <span className="block text-xs text-brand-slate/70">{ubicacion || "Sin ubicación"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {estaPendiente(row) ? (
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                        {row.giro ? `${row.giro} (giro inactivo)` : "Pendiente: sin giro"}
                      </span>
                    ) : (
                      <span className="text-brand-black">{row.giro}</span>
                    )}
                  </td>
                  <td className="min-w-[150px] px-3 py-3 text-brand-black">
                    {row.contacto ?? <span className="text-brand-slate/60">Sin contacto</span>}
                    {row.telefono && (
                      <span className="block tabular-nums text-xs text-brand-slate">
                        {row.telefono.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3")}
                      </span>
                    )}
                    {row.correo && <span className="block text-xs text-brand-slate [overflow-wrap:anywhere]">{row.correo}</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-start gap-1">
                      {row.eliminado_at ? (
                        <Estado tono="rojo">Eliminado</Estado>
                      ) : publicado ? (
                        <Estado tono="verde">Publicado</Estado>
                      ) : row.activo ? (
                        <Estado tono="ambar">Activo, sin publicar</Estado>
                      ) : (
                        <Estado tono="gris">Inactivo</Estado>
                      )}
                      {!row.eliminado_at &&
                        (row.consentimiento_datos ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-800">
                            <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" strokeWidth={2} />
                            Autorizó{row.consentimiento_medio ? ` · ${medioCorto(row.consentimiento_medio)}` : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-brand-slate/80">Sin consentimiento</span>
                        ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex flex-nowrap justify-end gap-x-0.5">
                      {row.eliminado_at ? (
                        <>
                          <button type="button" onClick={() => setPending({ accion: "restaurar", row })} className={`${rowButton} text-brand-slate`}>
                            Restaurar
                          </button>
                          {canHardDelete && (
                            <button type="button" onClick={() => setPending({ accion: "borrar", row })} className={`${rowButton} text-red-700`}>
                              Borrar definitivamente
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <Link href={`/admin/lealtad/socios/${row.id}`} className={`${rowButton} inline-flex items-center text-brand-slate`}>
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() => setPending({ accion: row.activo ? "desactivar" : "activar", row })}
                            className={`${rowButton} text-brand-slate`}
                          >
                            {row.activo ? "Desactivar" : "Activar"}
                          </button>
                          <button type="button" onClick={() => setPending({ accion: "eliminar", row })} className={`${rowButton} text-red-700`}>
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={pending ? ACCION_TEXTO[pending.accion].title : ""}
        description={pending ? ACCION_TEXTO[pending.accion].description(pending.row.nombre_comercial) : undefined}
        confirmLabel={busy ? "Guardando…" : pending ? ACCION_TEXTO[pending.accion].confirm : "Aceptar"}
        tone={pending && ACCION_TEXTO[pending.accion].danger ? "danger" : "neutral"}
        onConfirm={() => {
          if (!busy) void ejecutar();
        }}
        onCancel={() => {
          if (!busy) setPending(null);
        }}
      />

      <ConfirmDialog
        open={bulk === "retirar"}
        title="Quitar autorización de datos"
        description={`${seleccion.size === 1 ? "El socio seleccionado dejará" : `Los ${seleccion.size} socios seleccionados dejarán`} de mostrar su teléfono, correo y dirección a los miembros de Club 57. Se borran la fecha y el medio registrados; los socios siguen publicados.`}
        confirmLabel={busy ? "Guardando…" : "Quitar autorización"}
        tone="danger"
        onConfirm={() => void ejecutarBulk()}
        onCancel={cerrarBulk}
      />

      {bulk === "otorgar" && (
        <Modal titleId={bulkTitleId} onClose={cerrarBulk} maxWidthClassName="max-w-lg">
          <div className="flex flex-col gap-4 pr-8">
            <div>
              <h2 id={bulkTitleId} className="font-display text-base uppercase text-brand-slate">
                Registrar autorización de datos
              </h2>
              <p className="mt-2 font-sans text-sm text-brand-black">
                {plural(seleccion.size, "socio seleccionado", "socios seleccionados")}. Los miembros de Club 57 podrán ver su
                teléfono, WhatsApp, correo y dirección. Se registra con la fecha de hoy y tu nombre; los que ya tenían
                autorización se quedan como están.
              </p>
              {nombresSeleccion.length > 0 && (
                <p className="mt-2 font-sans text-xs text-brand-slate">
                  {nombresSeleccion.slice(0, 6).join(" · ")}
                  {nombresSeleccion.length > 6 || fueraDePagina > 0
                    ? ` y ${nombresSeleccion.length - Math.min(6, nombresSeleccion.length) + fueraDePagina} más`
                    : ""}
                </p>
              )}
            </div>
            <div>
              <span className="mb-1.5 block font-sans text-sm font-medium text-brand-black">Medio de autorización</span>
              <Select
                label="Medio de autorización"
                value={medio}
                onChange={setMedio}
                options={MEDIOS_CONSENTIMIENTO.map((m) => ({ value: m.value, label: m.label }))}
                placeholder="Elige cómo autorizaron"
              />
              <p className="mt-1 font-sans text-xs text-brand-slate/80">
                Si autorizaron por medios distintos, registra cada grupo por separado.
              </p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 font-sans text-sm text-brand-black">
              <input
                type="checkbox"
                checked={confirmado}
                onChange={(event) => setConfirmado(event.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-brand-slate"
              />
              <span>
                Confirmo que {seleccion.size === 1 ? "este socio autorizó" : "estos socios autorizaron"} compartir sus datos
                de contacto con los miembros de Club 57.
              </span>
            </label>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={cerrarBulk} disabled={busy}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void ejecutarBulk()} disabled={busy || !medio || !confirmado}>
                {busy ? "Guardando…" : "Registrar autorización"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Estado({ tono, children }: { tono: "verde" | "ambar" | "gris" | "rojo"; children: React.ReactNode }) {
  const clases = {
    verde: "bg-green-100 text-green-800",
    ambar: "bg-amber-100 text-amber-900",
    gris: "bg-brand-gray text-brand-slate",
    rojo: "bg-red-100 text-red-800",
  }[tono];
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${clases}`}>{children}</span>;
}
