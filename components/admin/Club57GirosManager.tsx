"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog } from "@/components/ui";
import { createGiro, renameGiro, setGiroActivo } from "@/app/(admin)/admin/(protected)/lealtad/socios/actions";

export interface GiroRow {
  id: string;
  nombre: string;
  activo: boolean;
  socios: number;
}

const inputClass =
  "min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";

// Catálogo de giros del directorio: agregar, renombrar y activar o
// desactivar. Un giro desactivado deja de publicarse junto con sus socios
// (la vista pública solo une giros activos), así que se avisa antes.
export function Club57GirosManager({ giros }: { giros: GiroRow[] }) {
  const router = useRouter();
  const nuevoId = useId();
  const [nuevo, setNuevo] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [busy, setBusy] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [desactivar, setDesactivar] = useState<GiroRow | null>(null);

  async function correr(accion: () => Promise<{ error?: string }>, ok: string) {
    setBusy(true);
    setMensaje(null);
    const result = await accion();
    setBusy(false);
    if (result.error) {
      setMensaje({ tipo: "error", texto: result.error });
      return false;
    }
    setMensaje({ tipo: "ok", texto: ok });
    router.refresh();
    return true;
  }

  return (
    <div className="flex flex-col gap-4">
      {mensaje && (
        <p
          role={mensaje.tipo === "error" ? "alert" : "status"}
          className={`rounded-md px-4 py-2.5 font-sans text-sm ${mensaje.tipo === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"}`}
        >
          {mensaje.texto}
        </p>
      )}

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (await correr(() => createGiro(nuevo), `Giro «${nuevo.trim()}» agregado.`)) setNuevo("");
        }}
        className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor={nuevoId} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Nuevo giro
          </label>
          <input id={nuevoId} value={nuevo} maxLength={80} onChange={(event) => setNuevo(event.target.value)} placeholder="Ej. Plomería" className={inputClass} />
        </div>
        <Button type="submit" disabled={busy || nuevo.trim().length < 2}>
          Agregar giro
        </Button>
      </form>

      <ul className="divide-y divide-brand-slate/10 rounded-lg bg-white shadow-sm">
        {giros.length === 0 && <li className="p-4 font-sans text-sm text-brand-slate/70">Todavía no hay giros.</li>}
        {giros.map((giro) => (
          <li key={giro.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            {editando === giro.id ? (
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (await correr(() => renameGiro(giro.id, nombreEditado), "Giro renombrado.")) setEditando(null);
                }}
                className="flex flex-1 flex-col gap-2 sm:flex-row"
              >
                <input
                  aria-label={`Nuevo nombre para ${giro.nombre}`}
                  value={nombreEditado}
                  maxLength={80}
                  onChange={(event) => setNombreEditado(event.target.value)}
                  className={inputClass}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={busy}>
                    Guardar
                  </Button>
                  <button type="button" onClick={() => setEditando(null)} className="min-h-11 px-3 font-sans text-sm text-brand-slate underline">
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div>
                  <p className="font-sans text-sm font-semibold text-brand-black">
                    {giro.nombre}
                    {!giro.activo && (
                      <span className="ml-2 rounded-full bg-brand-gray px-2 py-0.5 text-xs font-semibold text-brand-slate">Inactivo</span>
                    )}
                  </p>
                  <p className="font-sans text-xs text-brand-slate/80">
                    {giro.socios} {giro.socios === 1 ? "socio" : "socios"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(giro.id);
                      setNombreEditado(giro.nombre);
                    }}
                    className="min-h-11 px-3 font-sans text-sm font-semibold text-brand-slate underline-offset-2 hover:underline"
                  >
                    Renombrar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (giro.activo && giro.socios > 0) setDesactivar(giro);
                      else void correr(() => setGiroActivo(giro.id, !giro.activo), giro.activo ? "Giro desactivado." : "Giro activado.");
                    }}
                    className="min-h-11 px-3 font-sans text-sm font-semibold text-brand-slate underline-offset-2 hover:underline"
                  >
                    {giro.activo ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={desactivar !== null}
        title="Desactivar giro"
        description={
          desactivar
            ? `Al desactivar «${desactivar.nombre}», sus ${desactivar.socios} ${desactivar.socios === 1 ? "socio deja" : "socios dejan"} de publicarse hasta que les asignes otro giro o lo reactives.`
            : undefined
        }
        confirmLabel="Desactivar"
        tone="danger"
        onConfirm={() => {
          const giro = desactivar;
          setDesactivar(null);
          if (giro) void correr(() => setGiroActivo(giro.id, false), "Giro desactivado.");
        }}
        onCancel={() => setDesactivar(null)}
      />
    </div>
  );
}
