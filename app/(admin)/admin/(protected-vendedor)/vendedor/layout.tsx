import { redirect } from "next/navigation";
import { VendedorShell } from "@/components/vendedor/VendedorShell";
import { getStaffProfile } from "@/lib/supabase/adminProfile";

// Segunda capa de verificación del lado del servidor, independiente del
// middleware (mismo criterio que app/(admin)/admin/(protected)/layout.tsx
// para el admin completo) — admite admin O vendedor, igual que el
// middleware ya permite para /admin/vendedor/**.
export default async function VendedorProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getStaffProfile();
  if (!staff) {
    redirect("/admin/login");
  }

  return <VendedorShell staffName={staff.fullName?.trim() || staff.email}>{children}</VendedorShell>;
}
