"use client";

import { useId, useState } from "react";
import { requestPasswordReset } from "@/app/(site)/cuenta/actions";
import { Button } from "@/components/ui";

// Mensaje siempre idéntico exista o no el correo — nunca revela si una
// cuenta está registrada (mismo criterio de seguridad que ya aplica
// resetPasswordForEmail() de Supabase por su cuenta, ver requestPasswordReset
// en cuenta/actions.ts). Se muestra tanto en éxito como ante cualquier
// error esperado (límite de envíos, etc.) — solo un fallo de red deja ver
// el estado de "reintenta".
const GENERIC_CONFIRMATION =
  "Si ese correo está registrado, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).";

// Vive dentro de la pestaña "Iniciar sesión" de AuthTabs (no es una ruta
// aparte): onBack regresa al formulario de credenciales sin perder el
// contexto de "sigo en /cuenta intentando entrar".
export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    await requestPasswordReset(email);
    // Se ignora a propósito el {error} de la respuesta: mostrar el mismo
    // mensaje genérico pase lo que pase es lo que evita que alguien use
    // este formulario para averiguar qué correos están registrados.
    setSubmitted(true);
    setIsSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-lg bg-brand-gray px-4 py-3 font-sans text-sm text-brand-black">
          {GENERIC_CONFIRMATION}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="self-start font-sans text-sm font-medium text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Volver a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <p className="font-sans text-sm text-brand-slate">
        Ingresa el correo con el que te registraste — si está en Club 57, te mandamos un enlace para
        crear una nueva contraseña.
      </p>
      <div>
        <label htmlFor={emailId} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
          Correo electrónico
        </label>
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black placeholder:text-brand-slate/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Enviando…" : "Enviar enlace de recuperación"}
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="self-start font-sans text-sm font-medium text-brand-slate underline underline-offset-2 hover:text-brand-black"
      >
        ← Volver a iniciar sesión
      </button>
    </form>
  );
}
