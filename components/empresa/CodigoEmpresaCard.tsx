"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Mail, MessageCircle, RefreshCw } from "lucide-react";
import { Button, buttonClassName, Modal } from "@/components/ui";
import { regenerarCodigoPortal } from "@/app/(site)/empresa/actions";

// Código de la empresa con botones para copiarlo y compartirlo con los
// colaboradores (WhatsApp o correo), y para cambiarlo si se filtró.
export function CodigoEmpresaCard({ codigo, empresa, registroUrl }: { codigo: string; empresa: string; registroUrl: string }) {
  const router = useRouter();
  const titleId = useId();
  const [copiado, setCopiado] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mensaje = `Ya puedes unirte a Club 57 Empresarial de ${empresa} en Ferretería 57. Regístrate en ${registroUrl} con la opción «Tengo código de empresa» y escribe el código ${codigo}. Si ya tienes cuenta, entra a Mi cuenta → Empresarial.`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  async function regenerar() {
    setTrabajando(true);
    setError(null);
    const result = await regenerarCodigoPortal();
    setTrabajando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setConfirmar(false);
    router.refresh();
  }

  return (
    <section aria-labelledby={`${titleId}-h`} className="rounded-lg bg-brand-slate p-5 text-white sm:p-6">
      <h2 id={`${titleId}-h`} className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
        Código de tu empresa
      </h2>
      <p className="mt-2 font-display text-3xl tracking-wide sm:text-4xl">{codigo}</p>
      <p className="mt-2 max-w-prose font-sans text-sm text-white/80">
        Compártelo con tus colaboradores. Al registrarse con él, su solicitud llega aquí para que la apruebes.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copiar}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 font-sans text-sm font-semibold text-brand-black hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {copiado ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copiado ? "Copiado" : "Copiar"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-white/40 px-4 font-sans text-sm font-semibold text-white hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Compartir por WhatsApp
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent(`Club 57 Empresarial · ${empresa}`)}&body=${encodeURIComponent(mensaje)}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-white/40 px-4 font-sans text-sm font-semibold text-white hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Mail className="size-4" aria-hidden="true" />
          Por correo
        </a>
        <button
          type="button"
          onClick={() => setConfirmar(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-sans text-sm font-semibold text-white/80 underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Cambiar código
        </button>
      </div>

      {confirmar && (
        <Modal titleId={titleId} onClose={() => setConfirmar(false)} maxWidthClassName="max-w-md">
          <div className="flex flex-col gap-4 text-left">
            <h2 id={titleId} className="pr-10 font-display text-lg uppercase text-brand-slate">
              Cambiar el código
            </h2>
            <p className="font-sans text-sm text-brand-slate">
              El código actual deja de servir para registrarse. Tus empleados ya aprobados no se ven afectados. Úsalo si el
              código se compartió fuera de tu empresa.
            </p>
            {error && (
              <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmar(false)} className={buttonClassName("secondary", "w-full sm:w-auto")}>
                Volver
              </button>
              <Button type="button" onClick={regenerar} disabled={trabajando} className="w-full sm:w-auto">
                {trabajando ? "Cambiando…" : "Cambiar código"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
