"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { buttonClassName } from "@/components/ui";
import { enviarAccesoResponsable } from "@/app/(admin)/admin/(protected)/lealtad/empresas/actions";

// Acceso del responsable al Portal Empresa desde el detalle de la empresa.
export function AccesoResponsable({
  empresaId,
  correo,
  tieneAcceso,
  habilitado,
}: {
  empresaId: string;
  correo: string;
  tieneAcceso: boolean;
  habilitado: boolean;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tono: "ok" | "error"; texto: string } | null>(null);

  async function enviar() {
    setEnviando(true);
    setMensaje(null);
    const result = await enviarAccesoResponsable(empresaId);
    setEnviando(false);
    if (result.error) {
      setMensaje({ tono: "error", texto: result.error });
      return;
    }
    setMensaje({ tono: "ok", texto: `Enviamos el acceso a ${result.correo}.` });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-brand-slate/15 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-sans text-sm font-semibold text-brand-black">Acceso del responsable al Portal Empresa</p>
          <p className="mt-0.5 break-all font-sans text-sm text-brand-slate">
            {tieneAcceso ? "Con acceso" : "Sin acceso todavía"} · {correo}
          </p>
          <p className="mt-1 font-sans text-xs text-brand-slate/70">
            Le llega un correo con el código de la empresa y un enlace para crear su contraseña. Si cambias el correo del
            responsable, vuelve a enviar el acceso: el anterior lo pierde en ese momento.
          </p>
        </div>
        <button
          type="button"
          onClick={enviar}
          disabled={enviando || !habilitado}
          className={buttonClassName(tieneAcceso ? "secondary" : "primary", "shrink-0")}
        >
          <KeyRound className="size-4" aria-hidden="true" />
          {enviando ? "Enviando…" : tieneAcceso ? "Reenviar acceso" : "Dar acceso"}
        </button>
      </div>
      {!habilitado && <p className="font-sans text-xs text-brand-slate/70">Disponible cuando la empresa esté activa.</p>}
      {mensaje && (
        <p
          role={mensaje.tono === "error" ? "alert" : "status"}
          className={`rounded-md px-3 py-2 font-sans text-sm ${mensaje.tono === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"}`}
        >
          {mensaje.texto}
        </p>
      )}
    </div>
  );
}
