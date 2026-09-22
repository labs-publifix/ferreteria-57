"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Barra de identidad compacta, una sola fila: avatar + nombre a la
// izquierda, "Cerrar sesión" como enlace discreto a la derecha — nunca el
// mismo peso visual que el saldo de puntos, que es lo que el cliente
// realmente viene a ver. El código de referido vive ahora en la franja de
// saldo (Club57MemberPanel), no aquí.
export function ProfileView({
  email,
  fullName,
}: {
  email: string;
  fullName: string | null;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    <div className="flex w-full max-w-4xl items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 shadow-sm">
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

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="flex min-h-9 shrink-0 items-center rounded-md border border-brand-slate/30 px-3 font-sans text-sm font-medium text-brand-slate hover:border-brand-slate hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate disabled:opacity-50"
      >
        {isSigningOut ? "Cerrando…" : "Cerrar sesión"}
      </button>
    </div>
  );
}
