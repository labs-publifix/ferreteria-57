import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordView } from "@/components/account/ResetPasswordView";
import { NO_INDEX_NO_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Restablecer contraseña — Ferretería 57",
  description: "Crea una nueva contraseña para tu cuenta de Ferretería 57.",
  robots: NO_INDEX_NO_FOLLOW,
};

// El enlace de recuperación de Supabase trae un ?code= en la URL —
// ResetPasswordView necesita useSearchParams() para leerlo, por eso va
// envuelto en Suspense (requisito de Next.js para ese hook), mismo
// patrón que /checkout/confirmacion.
export default function RestablecerContrasenaPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
      <Suspense fallback={null}>
        <ResetPasswordView />
      </Suspense>
    </main>
  );
}
