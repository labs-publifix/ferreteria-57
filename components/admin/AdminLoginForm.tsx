"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, PasswordInput } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/supabase/authErrors";
import { requestStaffPasswordReset } from "@/app/(admin)/admin/login/actions";

// Mismo mensaje exista o no el correo: nunca revela qué cuentas existen.
const RESET_CONFIRMATION =
  "Si ese correo tiene una cuenta, te enviamos un enlace para crear una nueva contraseña. Revisa tu bandeja de entrada (y spam).";

// Login del panel para todo el personal (no las pestañas de /cuenta: aquí
// no hay registro ni mensaje del Programa de Lealtad, no aplican). Mismo
// sistema de Supabase Auth, con una verificación extra del rol, con las
// mismas funciones SQL que usa el middleware para /admin:
//   - is_admin()    → panel completo (/admin)
//   - is_vendedor() → vista de vendedor (/admin/vendedor)
//   - ninguno       → se cierra la sesión y se explica, en vez de dejar
//                     que la persona piense que sus credenciales están mal.
type BrowserClient = ReturnType<typeof createClient>;

// A dónde entra cada rol de personal; null si la cuenta no es personal (o
// si la consulta falla: ante la duda, sin acceso, igual que el middleware).
async function staffDestination(supabase: BrowserClient): Promise<string | null> {
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (!adminError && isAdmin) return "/admin";

  const { data: isVendedor, error: vendedorError } = await supabase.rpc("is_vendedor");
  if (!vendedorError && isVendedor) return "/admin/vendedor";

  return null;
}

export function AdminLoginForm({ passwordReset = false }: { passwordReset?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "forgot" | "forgot-sent">("login");
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Cuenta desactivada desde /admin/accesos (ban de Supabase Auth).
      setError(
        signInError.message === "User is banned"
          ? "Esta cuenta está desactivada. Pide a un administrador que la reactive."
          : translateAuthError(signInError.message)
      );
      setIsSubmitting(false);
      return;
    }

    const destination = await staffDestination(supabase);

    if (!destination) {
      // Credenciales válidas pero sin rol de personal: no lo dejamos con
      // una sesión "a medias" en la página de login del panel — mejor
      // cerrarla y que el mensaje sea inequívoco.
      await supabase.auth.signOut();
      setError("Esta cuenta no tiene acceso al panel de administración.");
      setIsSubmitting(false);
      return;
    }

    router.push(destination);
    router.refresh();
  }

  async function handleForgotSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const result = await requestStaffPasswordReset(email);
    setIsSubmitting(false);
    // Solo un correo mal escrito se muestra como error; cualquier otro caso
    // cae al mensaje genérico para no revelar si la cuenta existe.
    if (result.error === "Escribe un correo válido.") {
      setError(result.error);
      return;
    }
    setMode("forgot-sent");
  }

  function backToLogin() {
    setMode("login");
    setError(null);
  }

  const emailField = (
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
  );

  const backLink = (
    <button
      type="button"
      onClick={backToLogin}
      className="self-start font-sans text-sm font-medium text-brand-slate underline underline-offset-2 hover:text-brand-black"
    >
      ← Volver a iniciar sesión
    </button>
  );

  if (mode === "forgot-sent") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <p role="status" className="rounded-lg bg-brand-gray px-4 py-3 font-sans text-sm text-brand-black">
          {RESET_CONFIRMATION}
        </p>
        {backLink}
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <form onSubmit={handleForgotSubmit} className="flex w-full max-w-sm flex-col gap-4" noValidate>
        <p className="font-sans text-sm text-brand-slate">
          Escribe el correo de tu cuenta del panel y te enviamos un enlace para crear una nueva contraseña.
        </p>
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {error}
          </p>
        )}
        {emailField}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Enviando…" : "Enviar enlace"}
        </Button>
        {backLink}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4" noValidate>
      {passwordReset && !error && (
        <p role="status" className="rounded-md bg-brand-gray px-4 py-2.5 font-sans text-sm text-brand-black">
          Tu contraseña se actualizó. Inicia sesión con la nueva.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {emailField}

      <PasswordInput
        id={passwordId}
        label="Contraseña"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode("forgot");
          setError(null);
        }}
        className="self-center font-sans text-sm font-medium text-brand-slate underline underline-offset-2 hover:text-brand-black"
      >
        ¿Olvidaste tu contraseña?
      </button>
    </form>
  );
}
