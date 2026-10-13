import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { ResetPasswordView } from "@/components/account/ResetPasswordView";
import { NO_INDEX_NO_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Restablecer contraseña — Panel de administración",
  robots: NO_INDEX_NO_FOLLOW,
};

// Destino del enlace de «¿Olvidaste tu contraseña?» del login del panel
// (admin y vendedores). Fuera de (protected): la persona todavía no tiene
// sesión; el middleware la deja pasar sin rol (ver lib/supabase/middleware).
// Misma vista que la de clientes, con la imagen del panel.
export default function AdminRestablecerContrasenaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-16">
      <Image
        src="/brand/logo-naranja.png"
        alt="Ferretería 57"
        width={983}
        height={302}
        className="h-10 w-auto sm:h-12"
      />
      <h1 className="text-center font-display text-2xl uppercase text-brand-slate sm:text-3xl">
        Nueva contraseña
      </h1>
      <Suspense fallback={null}>
        <ResetPasswordView variant="personal" />
      </Suspense>
    </main>
  );
}
