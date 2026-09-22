"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChangePasswordModal } from "./ChangePasswordModal";

// Barra de identidad compacta: avatar + nombre, y las dos acciones de
// cuenta (cambiar contraseña, cerrar sesión) — nunca con el mismo peso
// visual que el saldo de puntos, que es lo que el cliente realmente viene
// a ver. El código de referido vive ahora en la franja de saldo
// (Club57MemberPanel), no aquí. Una sola fila desde sm: en adelante; en
// 375px se parte en dos (identidad arriba, acciones abajo) — con las dos
// acciones siempre visibles: "Cambiar contraseña" es crítico también en
// móvil (la mayoría de los clientes entra desde el teléfono, y es la
// única forma de reemplazar la contraseña que el personal en tienda les
// entregó en papel).
export function ProfileView({
  email,
  fullName,
}: {
  email: string;
  fullName: string | null;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // Mismo mecanismo que el login/registro: signOut() limpia las cookies
    // de sesión, refresh() vuelve a pedir los Server Components de /cuenta
    // (que ahora ya no ven sesión) sin recargar toda la página.
    router.refresh();
  }

  const displayName = fullName?.trim() || "Cliente Ferretería 57";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex w-full max-w-4xl flex-col gap-3 rounded-lg bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-slate font-display text-sm text-white"
        >
          {initial}
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate font-sans text-sm font-semibold text-brand-black">{displayName}</p>
          <p className="truncate font-sans text-xs text-brand-slate/60">{email}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 sm:shrink-0">
        <button
          type="button"
          onClick={() => setIsChangePasswordOpen(true)}
          className="font-sans text-xs font-medium text-brand-slate underline underline-offset-2 hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        >
          Cambiar contraseña
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex min-h-9 shrink-0 items-center rounded-md border border-brand-slate/30 px-3 font-sans text-sm font-medium text-brand-slate hover:border-brand-slate hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate disabled:opacity-50"
        >
          {isSigningOut ? "Cerrando…" : "Cerrar sesión"}
        </button>
      </div>

      {isChangePasswordOpen && <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} />}
    </div>
  );
}
