"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui";
import { PartnerAvatar } from "@/components/club57/PartnerAvatar";
import {
  hardDeletePartner,
  restorePartner,
  setPartnerActivo,
  softDeletePartner,
} from "@/app/(admin)/admin/(protected)/lealtad/socios/actions";
import { estaPendiente, estaPublicado, type AdminPartnerRow } from "@/lib/club57/socios/adminList";

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

// Tabla del listado del admin: scroll horizontal propio en pantallas chicas
// (la página nunca se ensancha) y acciones por fila con confirmación.
export function Club57PartnersTable({ rows, canHardDelete }: { rows: AdminPartnerRow[]; canHardDelete: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<{ accion: Accion; row: AdminPartnerRow } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="relative min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[880px] text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
              <th className="px-3 py-3">Socio</th>
              <th className="w-[140px] px-3 py-3">Giro</th>
              <th className="px-3 py-3">Contacto</th>
              <th className="px-3 py-3">Ubicación</th>
              <th className="px-3 py-3">Estatus</th>
              <th className="px-3 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const publicado = estaPublicado(row);
              return (
                <tr key={row.id} className="border-b border-brand-slate/10 align-top last:border-0">
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
                        <span className="block text-xs text-brand-slate/70">
                          {row.origen === "carga_masiva" ? "Carga masiva" : "Alta manual"}
                        </span>
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
                  <td className="max-w-[160px] px-3 py-3 text-brand-slate">
                    {[row.colonia, row.municipio].filter(Boolean).join(", ") || "—"}
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
                      {!row.consentimiento_datos && !row.eliminado_at && (
                        <span className="text-xs text-brand-slate/80">Sin consentimiento</span>
                      )}
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
