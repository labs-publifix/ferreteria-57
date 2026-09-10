"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, PasswordInput } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/supabase/authErrors";

// Login dedicado del admin (no las pestañas de /cuenta: aquí no hay
// registro ni mensaje del Programa de Lealtad, no aplican). Mismo sistema
// de Supabase Auth ya configurado, pero con una verificación extra: un
// login válido de una cuenta sin role = 'admin' no debe entrar al panel
// —is_admin() (la misma función SQL que protege /admin en el middleware)
// decide eso aquí también, para dar el mensaje correcto en vez de dejar
// que el usuario piense que sus credenciales están mal.
export function AdminLoginForm() {
  const router = useRouter();
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
      setError(translateAuthError(signInError.message));
      setIsSubmitting(false);
      return;
    }

    const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");

    if (rpcError || !isAdmin) {
      // Credenciales válidas pero sin permiso: no lo dejamos con una
      // sesión "a medias" en la página de login del panel — mejor cerrarla
      // y que el mensaje sea inequívoco.
      await supabase.auth.signOut();
      setError("Esta cuenta no tiene acceso al panel de administración.");
      setIsSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4" noValidate>
      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div>
        <label
          htmlFor={emailId}
          className="mb-1.5 block font-sans text-sm font-medium text-brand-black"
        >
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
    </form>
  );
}
