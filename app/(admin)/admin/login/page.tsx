import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAdminProfile } from "@/lib/supabase/adminProfile";

export const metadata: Metadata = { title: "Iniciar sesión — Panel de administración" };

// Fuera de app/(admin)/admin/(protected)/, así que no lleva el sidebar del
// panel (no hay nada que navegar todavía sin sesión). Si ya hay una
// sesión de admin válida, no tiene caso mostrar el formulario de nuevo.
export default async function AdminLoginPage() {
  const admin = await getAdminProfile();
  if (admin) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-16">
      <Image
        src="/brand/logo-naranja.png"
        alt="Ferretería 57"
        width={983}
        height={302}
        className="h-10 w-auto sm:h-12"
      />

      <div className="text-center">
        <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
          Panel de administración
        </h1>
      </div>

      <AdminLoginForm />
    </main>
  );
}
