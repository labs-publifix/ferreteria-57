import { createClient } from "@/lib/supabase/server";

export interface AdminProfile {
  fullName: string | null;
  email: string;
}

// Reutilizado por app/(admin)/admin/(protected)/layout.tsx (para el shell
// con sidebar) y por la página de Inicio (para el saludo) — evita repetir
// la misma llamada a Supabase con dos formas distintas de decidir "¿es
// admin?". Devuelve null si no hay sesión o si el usuario no es admin: el
// middleware ya debería haber redirigido antes de llegar aquí, esto es la
// segunda capa de verificación del lado del servidor (nunca confiar solo
// en el middleware para algo tan crítico como esto).
export async function getAdminProfile(): Promise<AdminProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;

  return { fullName: profile.full_name, email: user.email ?? "" };
}

export interface StaffProfile {
  fullName: string | null;
  email: string;
  role: "admin" | "vendedor";
}

// Mismo criterio que getAdminProfile(), pero para el layout de
// app/(admin)/admin/(vendedor)/vendedor/ — admite admin O vendedor
// (un admin completo puede entrar a la vista de vendedor sin restricción,
// igual que el middleware ya lo permite), segunda capa de verificación
// del lado del servidor independiente del middleware.
export async function getStaffProfile(): Promise<StaffProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "vendedor")) return null;

  return { fullName: profile.full_name, email: user.email ?? "", role: profile.role };
}
