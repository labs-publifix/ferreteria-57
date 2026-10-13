"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, PasswordInput } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/supabase/authErrors";

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
