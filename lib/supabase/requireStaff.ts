import { createClient } from "@/lib/supabase/server";

export interface StaffSession {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  role: "admin" | "vendedor";
}

// Mismo criterio que requireAdmin() ya usaba en cada Server Action de
// Club 57 (nunca confiar en que el middleware ya filtró la request), pero
// resolviendo también el rol de vendedor — cada acción decide por su
// cuenta qué le toca a cada rol (alcance completo para admin, solo sus
// propios clientes para vendedor) usando el "role" que esto devuelve.
export async function requireStaff(): Promise<StaffSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (!adminError && isAdmin) {
    return { supabase, userId: user.id, role: "admin" };
  }

  const { data: isVendedor, error: vendedorError } = await supabase.rpc("is_vendedor");
  if (!vendedorError && isVendedor) {
    return { supabase, userId: user.id, role: "vendedor" };
  }

  return null;
}
