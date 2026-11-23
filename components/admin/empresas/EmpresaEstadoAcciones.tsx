"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button, buttonClassName, Modal } from "@/components/ui";
import {
  cambiarEstadoEmpresa,
  regenerarCodigoEmpresa,
} from "@/app/(admin)/admin/(protected)/lealtad/empresas/actions";
import type { EstadoEmpresa } from "@/lib/club57/empresas/datos";

type Destino = Exclude<EstadoEmpresa, "solicitud">;

interface Accion {
  destino: Destino;
  label: string;
  titulo: string;
  texto: string;
  pideMotivo: boolean;
  variante: "primary" | "secondary" | "danger";
}

const ACCIONES: Record<EstadoEmpresa, Accion[]> = {
  solicitud: [
    {
      destino: "activa",
      label: "Aprobar y activar",
      titulo: "Aprobar la solicitud",
      texto: "La empresa queda activa y se genera su código. Revisa que el convenio esté completo.",
      pideMotivo: false,
      variante: "primary",
    },
    {
      destino: "rechazada",
      label: "Rechazar",
      titulo: "Rechazar la solicitud",
      texto: "La solicitud se cierra. El motivo queda en la bitácora.",
      pideMotivo: true,
      variante: "danger",
    },
  ],
  activa: [
    {
      destino: "suspendida",
      label: "Suspender",
      titulo: "Suspender la empresa",
      texto: "Sus empleados no podrán comprar con cargo a la empresa hasta que se reactive.",
      pideMotivo: true,
      variante: "secondary",
    },
    {
      destino: "baja",
      label: "Dar de baja",
      titulo: "Terminar el convenio",
      texto: "Se bloquean las compras nuevas con cargo a la empresa. Esta acción no se puede deshacer.",
      pideMotivo: true,
      variante: "danger",
    },
  ],
  suspendida: [
    {
      destino: "activa",
      label: "Reactivar",
      titulo: "Reactivar la empresa",
      texto: "Sus empleados vuelven a poder comprar con cargo a la empresa.",
      pideMotivo: false,
      variante: "primary",
    },
    {
      destino: "baja",
      label: "Dar de baja",
      titulo: "Terminar el convenio",
      texto: "Se bloquean las compras nuevas con cargo a la empresa. Esta acción no se puede deshacer.",
      pideMotivo: true,
      variante: "danger",
    },
  ],
  baja: [],
  rechazada: [],
};

const dangerClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-red-700 px-6 font-sans text-base font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700";

export function EmpresaEstadoAcciones({
  empresaId,
  nombre,
  estado,
  codigo,
}: {
  empresaId: string;
  nombre: string;
  estado: EstadoEmpresa;
  codigo: string | null;
}) {
  const router = useRouter();
  const titleId = useId();
  const motivoId = useId();
  const [accion, setAccion] = useState<Accion | null>(null);
  const [regenerar, setRegenerar] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const trabajandoRef = useRef(false);

  async function confirmar() {
    if (trabajandoRef.current) return;
    trabajandoRef.current = true;
    setTrabajando(true);
    setError(null);
    const result = regenerar
      ? await regenerarCodigoEmpresa(empresaId)
      : await cambiarEstadoEmpresa(empresaId, accion!.destino, motivo);
    trabajandoRef.current = false;
    setTrabajando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    cerrar();
    router.refresh();
  }

  function cerrar() {
    setAccion(null);
    setRegenerar(false);
    setMotivo("");
    setError(null);
  }

  async function copiar() {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  const acciones = ACCIONES[estado];
  const abierto = accion !== null || regenerar;
  const pideMotivo = accion?.pideMotivo ?? false;

  return (
    <div className="flex flex-col gap-4">
      {codigo && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-slate/15 bg-brand-gray/60 p-4">
          <div className="min-w-0">
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-brand-slate/70">Código de la empresa</p>
            <p className="font-display text-xl tracking-wide text-brand-black sm:text-2xl">{codigo}</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" onClick={copiar} className={buttonClassName("secondary")}>
              {copiado ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
            <button type="button" onClick={() => setRegenerar(true)} className={buttonClassName("secondary")}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Cambiar código
            </button>
          </div>
        </div>
      )}

      {acciones.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {acciones.map((item) =>
            item.variante === "danger" ? (
              <button key={item.destino} type="button" onClick={() => setAccion(item)} className={dangerClass}>
                {item.label}
              </button>
            ) : (
              <button key={item.destino} type="button" onClick={() => setAccion(item)} className={buttonClassName(item.variante)}>
                {item.label}
              </button>
            )
          )}
        </div>
      )}

      {abierto && (
        <Modal titleId={titleId} onClose={cerrar} maxWidthClassName="max-w-md">
          <div className="flex flex-col gap-4 text-left">
            <div className="pr-10">
              <h2 id={titleId} className="font-display text-lg uppercase text-brand-slate">
                {regenerar ? "Cambiar el código" : accion!.titulo}
              </h2>
              <p className="mt-1 font-sans text-sm text-brand-slate/80">{nombre}</p>
            </div>
            <p className="font-sans text-sm text-brand-slate">
              {regenerar
                ? "El código actual deja de servir para registrarse. Los empleados que ya están vinculados no se ven afectados. Úsalo si el código se compartió fuera de la empresa."
                : accion!.texto}
            </p>
            {pideMotivo && (
              <div>
                <label htmlFor={motivoId} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
                  Motivo
                </label>
                <textarea
                  id={motivoId}
                  rows={3}
                  maxLength={500}
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  className="w-full rounded-md border border-brand-slate/30 px-3 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                />
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={cerrar} className={buttonClassName("secondary", "w-full sm:w-auto")}>
                Volver
              </button>
              <Button
                type="button"
                onClick={confirmar}
                disabled={trabajando || (pideMotivo && motivo.trim().length < 3)}
                className="w-full sm:w-auto"
              >
                {trabajando ? "Guardando…" : regenerar ? "Cambiar código" : accion!.label}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
