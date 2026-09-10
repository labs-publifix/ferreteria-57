"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function ProfileView({
  email,
  fullName,
  referralCode,
}: {
  email: string;
  fullName: string | null;
  referralCode: string | null;
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
    <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg bg-white p-6 shadow-sm">
      <div
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-full bg-brand-slate font-display text-xl text-white"
      >
        {initial}
      </div>

      <div className="text-center">
        <p className="font-display text-lg uppercase text-brand-slate">
          {displayName}
        </p>
        <p className="font-sans text-sm text-brand-slate/70">{email}</p>
      </div>

      {referralCode && (
        <div className="w-full rounded-md bg-brand-gray px-4 py-3 text-center">
          <p className="font-sans text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
            Tu código de referido
          </p>
          <p className="font-display text-lg text-brand-black">
            {referralCode}
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="w-full"
      >
        {isSigningOut ? "Cerrando sesión…" : "Cerrar sesión"}
      </Button>
    </div>
  );
}
