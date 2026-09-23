"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button, PasswordInput, buttonClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/supabase/authErrors";

type Stage = "verificando" | "listo" | "invalido" | "guardando" | "exito";

// El enlace que manda resetPasswordForEmail() (ver cuenta/actions.ts) trae
// un ?code= de un solo uso en la URL (flujo PKCE — createBrowserClient usa
// PKCE por default con sesiones en cookie, a diferencia del flujo implícito
// con el token en el fragmento #). exchangeCodeForSession() es lo que
// valida ese code y recién ahí abre una sesión real — hasta que eso no
// resuelve con éxito, no hay "sesión de recuperación" que confiar, así que
// el formulario de nueva contraseña no se muestra todavía.
export function ResetPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>("verificando");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const passwordId = useId();
  const confirmId = useId();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStage("invalido");
      return;
    }

    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      setStage(exchangeError ? "invalido" : "listo");
    });
    // Solo debe correr una vez, al montar — searchParams es estable dentro
    // de esta misma carga de página (el code no cambia sin recargar).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setStage("guardando");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(translateAuthError(updateError.message));
      setStage("listo");
      return;
    }

    // Cierra la sesión de recuperación a propósito: updateUser() la deja
    // activa como una sesión normal, pero el pedido explícito es volver al
    // login con un mensaje de éxito, no entrar directo a la cuenta.
    await supabase.auth.signOut();
    setStage("exito");
    setTimeout(() => router.push("/cuenta?passwordReset=1"), 1500);
  }

  if (stage === "verificando") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Loader2 className="size-6 animate-spin text-brand-slate" aria-hidden="true" />
        <p className="font-sans text-sm text-brand-slate">Verificando tu enlace…</p>
      </div>
    );
  }

  if (stage === "invalido") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          Este enlace ya expiró o ya se usó antes. Solicita uno nuevo desde la pantalla de inicio de sesión.
        </p>
        <Link href="/cuenta" className={buttonClassName("primary")}>
          Ir a Mi cuenta
        </Link>
      </div>
    );
  }

  if (stage === "exito") {
    return (
      <p role="status" className="rounded-lg bg-brand-gray px-4 py-3 text-center font-sans text-sm text-brand-black">
        Tu contraseña se actualizó — te llevamos al inicio de sesión…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4" noValidate>
      <p className="font-sans text-sm text-brand-slate">Ingresa tu nueva contraseña.</p>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      <PasswordInput
        id={passwordId}
        label="Nueva contraseña"
        autoComplete="new-password"
        minLength={6}
        value={password}
        onChange={setPassword}
      />
      <PasswordInput
        id={confirmId}
        label="Confirma tu nueva contraseña"
        autoComplete="new-password"
        minLength={6}
        value={confirmPassword}
        onChange={setConfirmPassword}
      />
      <Button type="submit" disabled={stage === "guardando"} className="w-full">
        {stage === "guardando" ? "Guardando…" : "Guardar nueva contraseña"}
      </Button>
    </form>
  );
}
