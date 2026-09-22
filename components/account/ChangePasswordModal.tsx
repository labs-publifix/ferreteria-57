"use client";

import { useId, useState } from "react";
import { Button, Modal, PasswordInput } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/supabase/authErrors";

// updateUser() confía en la sesión activa del navegador — Supabase no pide
// re-ingresar la contraseña actual para este caso (a diferencia de otros
// proveedores), así que solo se pide la nueva, dos veces. Pensado sobre
// todo para el cliente que recibió una contraseña generada en tienda y
// quiere reemplazarla por una propia sin tener que cerrar sesión primero.
export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError(translateAuthError(updateError.message));
      return;
    }

    setSuccess(true);
  }

  return (
    <Modal titleId={titleId} onClose={onClose} maxWidthClassName="max-w-sm">
      <h2 id={titleId} className="mb-4 font-display text-lg uppercase text-brand-black">
        Cambiar contraseña
      </h2>

      {success ? (
        <div className="flex flex-col gap-4">
          <p role="status" className="rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800">
            Tu contraseña se actualizó correctamente.
          </p>
          <Button type="button" onClick={onClose} className="w-full">
            Listo
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Guardando…" : "Guardar nueva contraseña"}
          </Button>
        </form>
      )}
    </Modal>
  );
}
