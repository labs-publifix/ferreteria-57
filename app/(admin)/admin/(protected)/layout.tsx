import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminProfile } from "@/lib/supabase/adminProfile";

// Segunda capa de verificación del lado del servidor, independiente del
// middleware (ver lib/supabase/middleware.ts): si por lo que sea una
// request llegara hasta aquí sin pasar por el middleware, esta página
// tampoco se renderiza sin sesión de admin real. Para algo marcado como
// crítico en seguridad, más vale que la protección no dependa de un solo
// lugar del código.
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminProfile();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <AdminShell adminName={admin.fullName?.trim() || admin.email}>
      {children}
    </AdminShell>
  );
}
