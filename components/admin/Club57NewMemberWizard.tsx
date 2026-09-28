"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui";
import {
  createClub57Member,
  checkClub57ContactDuplicate,
  type Club57MemberMatch,
} from "@/app/(admin)/admin/(protected)/lealtad/clientes/actions";

type Step = "create" | "success";

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

// #10b: el formulario abre directo, sin el paso de búsqueda previa que
// antes obligaba a buscar por correo/teléfono antes de poder crear. El
// bloqueo de duplicados sigue existiendo, solo que se movió por completo
// al servidor (createClub57Member, al guardar) — aquí solo queda un aviso
// TEMPRANO por campo (onBlur, ver handleEmailBlur/handlePhoneBlur) que
// nunca bloquea el envío por sí solo, para no penalizar al vendedor por
// escribir.
//
// Nunca se guarda la contraseña en ningún estado más allá de este
// componente — vive solo en la respuesta del Server Action y en el
// estado de React de este árbol, se pierde apenas se navega fuera de
// aquí.
//
// basePath: la vista de vendedor (/admin/vendedor/clientes/nuevo) reutiliza
// este mismo wizard — sin esto, "Ver cliente"/"Ir al perfil" mandarían a un
// vendedor a la ruta de admin, que el middleware le rechaza.
export function Club57NewMemberWizard({
  basePath = "/admin/lealtad/clientes",
}: {
  basePath?: string;
}) {
  const [step, setStep] = useState<Step>("create");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);

  const [createdMember, setCreatedMember] = useState<Club57MemberMatch | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const fullNameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const referralCodeId = useId();

  async function handleEmailBlur() {
    if (!email.trim()) {
      setEmailWarning(null);
      return;
    }
    const result = await checkClub57ContactDuplicate("email", email);
    setEmailWarning(result.duplicate ? `Ya existe un cliente con ese correo: ${result.duplicate.fullName}.` : null);
  }

  async function handlePhoneBlur() {
    if (!phone.trim()) {
      setPhoneWarning(null);
      return;
    }
    const result = await checkClub57ContactDuplicate("phone", phone);
    setPhoneWarning(
      result.duplicate ? `Ya existe un cliente con ese teléfono: ${result.duplicate.fullName}.` : null
    );
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setCreateError(null);

    const result = await createClub57Member(fullName, email, phone, referralCode);
    setIsCreating(false);

    if (result.error || !result.member || !result.temporaryPassword) {
      setCreateError(result.error ?? "No se pudo crear el cliente.");
      return;
    }

    setCreatedMember(result.member);
    setTemporaryPassword(result.temporaryPassword);
    setStep("success");
  }

  async function handleCopyPassword() {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Portapapeles no disponible (permiso denegado, contexto no
      // seguro): la contraseña sigue visible en pantalla para copiarla a
      // mano, no hay nada más que hacer aquí.
    }
  }

  if (step === "create") {
    return (
      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:max-w-lg sm:p-6"
      >
        {createError && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {createError}
          </p>
        )}
        <div>
          <label htmlFor={fullNameId} className={labelClass}>
            Nombre
          </label>
          <input
            id={fullNameId}
            type="text"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={emailId} className={labelClass}>
            Correo
          </label>
          <input
            id={emailId}
            type="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailWarning) setEmailWarning(null);
            }}
            onBlur={handleEmailBlur}
            className={inputClass}
            aria-describedby={emailWarning ? `${emailId}-warning` : undefined}
          />
          {emailWarning && (
            <p id={`${emailId}-warning`} role="alert" className="mt-1.5 font-sans text-xs text-amber-700">
              {emailWarning}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={phoneId} className={labelClass}>
            Teléfono
          </label>
          <input
            id={phoneId}
            type="tel"
            required
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              if (phoneWarning) setPhoneWarning(null);
            }}
            onBlur={handlePhoneBlur}
            className={inputClass}
            aria-describedby={phoneWarning ? `${phoneId}-warning` : undefined}
          />
          {phoneWarning && (
            <p id={`${phoneId}-warning`} role="alert" className="mt-1.5 font-sans text-xs text-amber-700">
              {phoneWarning}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={referralCodeId} className={labelClass}>
            Código de quien lo invitó (opcional)
          </label>
          <input
            id={referralCodeId}
            type="text"
            autoComplete="off"
            placeholder="Código de referido"
            value={referralCode}
            onChange={(event) => setReferralCode(event.target.value)}
            className={inputClass}
          />
        </div>
        <Button type="submit" disabled={isCreating} className="w-full sm:w-auto sm:self-start">
          {isCreating ? "Creando…" : "Crear cliente"}
        </Button>
        <p className="font-sans text-xs text-brand-slate/70">
          Si el teléfono o el correo ya están registrados, no se permitirá el alta.
        </p>
      </form>
    );
  }

  // step === "success"
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:max-w-lg sm:p-6">
      <div className="flex items-start gap-3 rounded-md bg-green-50 p-4">
        <Check className="size-5 shrink-0 text-green-700" aria-hidden="true" strokeWidth={1.75} />
        <p className="font-sans text-sm text-green-900">
          Cliente {createdMember?.fullName} creado correctamente.
        </p>
      </div>

      <div className="rounded-md border-2 border-brand-orange/50 bg-brand-orange/5 p-4">
        <p className="font-sans text-sm font-semibold uppercase tracking-wide text-brand-black">
          Contraseña temporal
        </p>
        <p className="mt-1 font-mono text-lg font-semibold text-brand-black" aria-label="Contraseña generada">
          {temporaryPassword}
        </p>
        <button
          type="button"
          onClick={handleCopyPassword}
          className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-md border border-brand-slate/30 px-3 font-sans text-sm font-medium text-brand-slate hover:bg-brand-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        >
          {copied ? (
            <>
              <Check className="size-4" aria-hidden="true" strokeWidth={1.75} /> Copiada
            </>
          ) : (
            <>
              <Copy className="size-4" aria-hidden="true" strokeWidth={1.75} /> Copiar
            </>
          )}
        </button>
        <p className="mt-3 font-sans text-sm font-semibold text-red-700">
          Entrégasela al cliente ahora — no se volverá a mostrar.
        </p>
      </div>

      <Link
        href={`${basePath}/${createdMember?.id}`}
        className={buttonClassName("primary", "w-full sm:w-auto sm:self-start")}
      >
        Ir al perfil del cliente
      </Link>
    </div>
  );
}
