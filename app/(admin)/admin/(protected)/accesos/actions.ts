"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateAuthError } from "@/lib/supabase/authErrors";

export interface CreateAdminResult {
  error?: string;
  success?: boolean;
}

// Server Action: aunque la página que la usa ya vive detrás del
// middleware y del layout protegido, una Server Action es su propio
// endpoint — se verifica is_admin() aquí también, por su cuenta, en vez
// de asumir que nadie puede invocarla directo (mismo criterio de "nunca
// un solo punto de verificación" del resto del panel).
export async function createAdminUser(formData: FormData): Promise<CreateAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const { data: isAdmin, error: adminCheckError } = await supabase.rpc("is_admin");
  if (adminCheckError || !isAdmin) {
    return { error: "No autorizado." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Completa nombre, correo y contraseña." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return {
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.",
    };
  }

  // email_confirm: true crea la cuenta ya confirmada — nadie tiene que
  // pasar por un correo de verificación, el propio admin que la crea ya
  // está garantizando la identidad de la persona.
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    return { error: translateAuthError(createError?.message ?? "No se pudo crear el usuario.") };
  }

  // El trigger handle_new_user (ver migraciones) ya creó la fila en
  // profiles con role='customer' al insertarse en auth.users. Este UPDATE
  // corre con la service_role, así que prevent_role_escalation lo deja
  // pasar (esa protección es específicamente contra la anon key/JWT de
  // un usuario normal, no contra la service_role).
  const { error: promoteError } = await adminClient
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", created.user.id);

  if (promoteError) {
    return {
      error:
        "El usuario se creó pero no se pudo asignar el rol de administrador. Avísale a soporte.",
    };
  }

  revalidatePath("/admin/accesos");
  return { success: true };
}
