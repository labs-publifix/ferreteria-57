"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui";
import {
  createClub57Member,
  findClub57MemberByContact,
  type Club57MemberMatch,
} from "@/app/(admin)/admin/(protected)/lealtad/clientes/actions";

type Step = "search" | "found" | "create" | "success";

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

// Flujo de 3 pasos: buscar (bloquea duplicados) → crear (solo si no hubo
// match) → éxito con la contraseña generada, visible una sola vez. Nunca
// se guarda la contraseña en ningún estado más allá de este componente —
// vive solo en la respuesta del Server Action y en el estado de React de
// este árbol, se pierde apenas se navega fuera de aquí.
//
// basePath: la vista de vendedor (/admin/vendedor/clientes/nuevo) reutiliza
// este mismo wizard — sin esto, "Ver cliente"/"Ir al perfil" mandarían a un
// vendedor a la ruta de admin, que el middleware le rechaza.
export function Club57NewMemberWizard({
  basePath = "/admin/lealtad/clientes",
}: {
  basePath?: string;
}) {
  const [step, setStep] = useState<Step>("search");

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Club57MemberMatch[]>([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [createdMember, setCreatedMember] = useState<Club57MemberMatch | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const searchId = useId();
  const fullNameId = useId();
  const emailId = useId();
  const phoneId = useId();

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSearching(true);
    setSearchError(null);

    const result = await findClub57MemberByContact(query);
    setIsSearching(false);

    if (result.error) {
      setSearchError(result.error);
      return;
    }

    if (result.matches && result.matches.length > 0) {
      setMatches(result.matches);
      setStep("found");
      return;
    }

    // Sin match: precarga el email/teléfono con lo que se buscó, para no
    // hacer que el admin lo vuelva a escribir (evita el "Redundant Entry"
    // que penaliza pedir el mismo dato dos veces en un mismo flujo).
    const looksLikeEmail = query.includes("@");
    setEmail(looksLikeEmail ? query.trim() : "");
    setPhone(looksLikeEmail ? "" : query.trim());
    setStep("create");
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setCreateError(null);

    const result = await createClub57Member(fullName, email, phone);
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

  if (step === "search") {
    return (
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:max-w-lg sm:p-6"
      >
        <p className="font-sans text-sm text-brand-slate">
          Busca primero por correo o teléfono — si el cliente ya está registrado, no se puede crear un
          duplicado.
        </p>
        <div>
          <label htmlFor={searchId} className={labelClass}>
            Correo o teléfono
          </label>
          <input
            id={searchId}
            type="text"
            required
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={inputClass}
            placeholder="cliente@correo.com o 4421234567"
          />
        </div>
        {searchError && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {searchError}
          </p>
        )}
        <Button type="submit" disabled={isSearching} className="w-full sm:w-auto sm:self-start">
          {isSearching ? "Buscando…" : "Buscar"}
        </Button>
      </form>
    );
  }

  if (step === "found") {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:max-w-lg sm:p-6">
        <div className="flex items-start gap-3 rounded-md bg-amber-50 p-4">
          <TriangleAlert className="size-5 shrink-0 text-amber-700" aria-hidden="true" strokeWidth={1.75} />
          <p className="font-sans text-sm text-amber-900">
            Ya existe {matches.length === 1 ? "un cliente" : `${matches.length} clientes`} con ese correo o
            teléfono — no se puede crear un duplicado.
          </p>
        </div>
        <ul className="flex flex-col gap-2">
          {matches.map((match) => (
            <li key={match.id} className="rounded-md border border-brand-slate/15 p-3">
              <p className="break-words font-sans text-sm font-semibold text-brand-black">{match.fullName}</p>
              {/* break-all: un correo largo sin espacios no tiene dónde
                  partir la línea por default y puede sacar a la tarjeta
                  (y a la página) de su ancho en móvil. */}
              <p className="break-all font-sans text-xs text-brand-slate/70">
                {match.email} · {match.phone}
              </p>
              <Link
                href={`${basePath}/${match.id}`}
                className="mt-1 inline-block font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
              >
                Ver cliente
              </Link>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            setMatches([]);
            setStep("search");
          }}
          className={buttonClassName("secondary", "w-full sm:w-auto sm:self-start")}
        >
          Buscar otro contacto
        </button>
      </div>
    );
  }

  if (step === "create") {
    return (
      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:max-w-lg sm:p-6"
      >
        <p className="font-sans text-sm text-brand-slate">
          Sin coincidencias para &quot;{query}&quot; — completa los datos para dar de alta al cliente.
        </p>
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
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
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
            onChange={(event) => setPhone(event.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isCreating}>
            {isCreating ? "Creando…" : "Crear cliente"}
          </Button>
          <button
            type="button"
            onClick={() => setStep("search")}
            disabled={isCreating}
            className={buttonClassName("secondary")}
          >
            Volver a buscar
          </button>
        </div>
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
