"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClassName, ConfirmDialog, Modal, PasswordInput } from "@/components/ui";
import { setStaffActive, setStaffPassword } from "@/app/(admin)/admin/(protected)/accesos/actions";

// Acciones por cuenta en /admin/accesos: cambiar la contraseña (modal) y
// desactivar/reactivar (con confirmación). Las reglas reales viven en las
// Server Actions (solo admin, solo cuentas de personal, nunca la propia ni
// el último admin activo); aquí solo se ocultan los botones que no aplican.
export function StaffAccountActions({
  userId,
  name,
  email,
  active,
  isSelf,
}: {
  userId: string;
  name: string;
  email: string;
  active: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const titleId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  function openPasswordModal() {
    setPassword("");
    setConfirmPassword("");
    setModalError(null);
    setNotice(null);
    setPasswordOpen(true);
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModalError(null);
    if (password.length < 6) {
      setModalError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setModalError("Las contraseñas no coinciden.");
      return;
    }
    setIsSaving(true);
    const result = await setStaffPassword(userId, password);
    setIsSaving(false);
    if (result.error) {
      setModalError(result.error);
      return;
    }
    setPasswordOpen(false);
    setNotice({
      tone: "ok",
      text: isSelf
        ? "Contraseña actualizada."
        : "Contraseña actualizada. Se cerraron sus sesiones abiertas: tendrá que entrar con la nueva.",
    });
    router.refresh();
  }

  async function handleToggleActive() {
    setConfirmOpen(false);
    setNotice(null);
    setIsSaving(true);
    const result = await setStaffActive(userId, !active);
    setIsSaving(false);
    if (result.error) {
      setNotice({ tone: "error", text: result.error });
      return;
    }
    setNotice({ tone: "ok", text: active ? "Cuenta desactivada." : "Cuenta reactivada." });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={openPasswordModal}
          disabled={isSaving}
          className={buttonClassName("secondary", "flex-1 !px-3 text-sm sm:flex-none sm:!px-4")}
        >
          Cambiar contraseña
        </button>
        {!isSelf && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={isSaving}
            className={buttonClassName(
              "secondary",
              `flex-1 !px-3 text-sm sm:flex-none sm:!px-4 ${active ? "text-red-700" : ""}`
            )}
          >
            {active ? "Desactivar" : "Reactivar"}
          </button>
        )}
      </div>

      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={`font-sans text-sm ${notice.tone === "error" ? "text-red-700" : "text-brand-slate"}`}
        >
          {notice.text}
        </p>
      )}

      {passwordOpen && (
        <Modal titleId={titleId} onClose={() => setPasswordOpen(false)} maxWidthClassName="max-w-md">
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4" noValidate>
            <div className="pr-8">
              <h2 id={titleId} className="font-display text-lg uppercase text-brand-slate">
                Cambiar contraseña
              </h2>
              <p className="mt-1 break-all font-sans text-sm text-brand-slate/80">
                {name} · {email}
              </p>
            </div>
            {!isSelf && (
              <p className="font-sans text-sm text-brand-slate">
                Se cerrarán sus sesiones abiertas. Comparte la nueva contraseña con la persona por un medio seguro.
              </p>
            )}
            {modalError && (
              <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
                {modalError}
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
              label="Confirma la nueva contraseña"
              autoComplete="new-password"
              minLength={6}
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto sm:self-start">
              {isSaving ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={active ? `¿Desactivar la cuenta de ${name}?` : `¿Reactivar la cuenta de ${name}?`}
        description={
          active
            ? "No podrá iniciar sesión y se cerrarán sus sesiones abiertas. Sus datos (clientes, compras registradas) se conservan y puedes reactivarla cuando quieras."
            : "Podrá volver a iniciar sesión con su contraseña actual."
        }
        confirmLabel={active ? "Desactivar" : "Reactivar"}
        tone={active ? "danger" : "neutral"}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
