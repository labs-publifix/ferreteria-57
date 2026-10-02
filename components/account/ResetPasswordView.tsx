"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button, PasswordInput, buttonClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/supabase/authErrors";

type Stage = "verificando" | "listo" | "invalido" | "guardando" | "exito";

// La plantilla de correo "Reset Password" en Supabase apunta directo a esta
// página con ?token_hash=...&type=recovery (en vez de {{ .ConfirmationURL }},
// que primero pasa por el endpoint GET /auth/v1/verify de Supabase). Ese
// endpoint consume el token de un solo uso con solo visitarlo — y Gmail (y
// varios antivirus/filtros corporativos) "pre-visitan" los enlaces de un
// correo para escanearlos antes de que la persona le dé clic, así que el
// enlace ya llegaba gastado al clic real. Al apuntar al token_hash directo a
// esta página, un prefetch que no ejecuta JS no consume nada: solo
// verifyOtp() —desde el navegador de la persona— lo hace. Se deja el
// fallback a ?code= (exchangeCodeForSession) por si queda algún correo de
// recuperación en tránsito con la plantilla vieja.
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
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const code = searchParams.get("code");
    const supabase = createClient();

    if (tokenHash && type === "recovery") {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" }).then(({ error: verifyError }) => {
        setStage(verifyError ? "invalido" : "listo");
      });
      return;
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        setStage(exchangeError ? "invalido" : "listo");
      });
      return;
    }

    setStage("invalido");
    // Solo debe correr una vez, al montar — searchParams es estable dentro
    // de esta misma carga de página (ni el token_hash ni el code cambian
    // sin recargar).
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
