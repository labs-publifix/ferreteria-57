import type { Metadata } from "next";
import { getAdminProfile } from "@/lib/supabase/adminProfile";

export const metadata: Metadata = { title: "Inicio — Panel de administración" };

// Dashboard de métricas real: prompt aparte. Por ahora solo confirma que
// se llegó hasta acá con una sesión de admin válida y saluda por nombre.
export default async function AdminHomePage() {
  const admin = await getAdminProfile();
  const displayName = admin?.fullName?.trim() || admin?.email || "";

  return (
    <div>
      <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">
        Bienvenido{displayName ? `, ${displayName}` : ""}
      </h1>
      <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
        Este es el panel de administración de Ferretería 57. El resumen de
        métricas (ventas, pedidos recientes, productos con poco stock)
        llega en un siguiente paso — por ahora, usa el menú para navegar
        entre las secciones.
      </p>
    </div>
  );
}
