import { createClient } from "@/lib/supabase/server";

export interface StaffSession {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  /**
   * Alcance de datos: "admin" (admin completo u operador, ven a todos los
   * clientes) o "vendedor" (solo los suyos). Las reglas que dependen de ver
   * todo usan esto; el operador entra aquí como "admin" a propósito.
   */
  role: "admin" | "vendedor";
  /** Rol real de la cuenta. */
  staffRole: "admin" | "operador" | "vendedor";
  /**
   * Solo el admin completo: Accesos, Configuración (Mercado Pago) y
   * Configuración de Club 57. El operador queda fuera de eso.
   */
  isFullAdmin: boolean;
}

// Mismo criterio que requireAdmin() ya usaba en cada Server Action de
// Club 57 (nunca confiar en que el middleware ya filtró la request), pero
// resolviendo también el rol de vendedor — cada acción decide por su
// cuenta qué le toca a cada rol (alcance completo para admin y operador,
// solo sus propios clientes para vendedor) usando el "role" que esto
// devuelve.
export async function requireStaff(): Promise<StaffSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: staffRole, error } = await supabase.rpc("current_staff_role");
  if (error || (staffRole !== "admin" && staffRole !== "operador" && staffRole !== "vendedor")) {
    return null;
  }

  return {
    supabase,
    userId: user.id,
    role: staffRole === "vendedor" ? "vendedor" : "admin",
    staffRole,
    isFullAdmin: staffRole === "admin",
  };
}

// Para lo que solo administra el admin completo (ver StaffSession.isFullAdmin).
export async function requireFullAdmin(): Promise<StaffSession | null> {
  const staff = await requireStaff();
  return staff?.isFullAdmin ? staff : null;
}
