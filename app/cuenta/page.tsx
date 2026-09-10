import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { AuthTabs } from "@/components/account/AuthTabs";
import { ProfileView } from "@/components/account/ProfileView";

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx.
export const metadata: Metadata = {
  title: "Mi cuenta — Ferretería 57",
  description:
    "Inicia sesión o crea tu cuenta de Ferretería 57. Al registrarte ya formas parte del Programa de Lealtad.",
};

// Server Component: decide qué mostrar (formulario o perfil) leyendo la
// sesión del lado del servidor con el cliente de lib/supabase/server.ts,
// para que la primera pintura ya llegue correcta (sin parpadeo mostrando
// primero el formulario y luego el perfil una vez resuelto el cliente).
export default async function CuentaPage() {
  // Si todavía no se agregaron las variables de entorno en Vercel, esta
  // página es la única que depende de ellas de forma directa (el resto
  // del sitio sigue funcionando, ver AuthProvider/middleware) — mejor un
  // aviso claro que la pantalla de error genérica de Next.js.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <h1 className="font-display text-2xl uppercase text-brand-slate">
          Mi cuenta
        </h1>
        <p className="max-w-prose font-sans text-sm text-brand-black">
          Esta sección está en configuración — vuelve más tarde.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; referral_code: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, referral_code")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:py-24">
      <Image
        src="/brand/logo-naranja.png"
        alt="Ferretería 57"
        width={983}
        height={302}
        className="h-10 w-auto sm:h-12"
      />

      {user ? (
        <ProfileView
          email={user.email ?? ""}
          fullName={profile?.full_name ?? null}
          referralCode={profile?.referral_code ?? null}
        />
      ) : (
        <>
          <div className="max-w-prose">
            <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
              Mi cuenta
            </h1>
            <p className="mt-3 font-sans text-sm text-brand-black sm:text-base">
              Al registrarte como cliente de Ferretería 57, ya formas parte
              del Programa de Lealtad — sin pasos adicionales.
            </p>
          </div>

          <AuthTabs />
        </>
      )}
    </main>
  );
}
