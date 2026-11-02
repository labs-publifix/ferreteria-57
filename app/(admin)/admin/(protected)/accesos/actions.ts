"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateAuthError } from "@/lib/supabase/authErrors";

const STAFF_ROLE_LABEL: Record<"admin" | "operador" | "vendedor", string> = {
  admin: "administrador",
  operador: "operador",
  vendedor: "vendedor",
};

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

  const { data: isAdmin, error: adminCheckError } = await supabase.rpc("is_full_admin");
  if (adminCheckError || !isAdmin) {
    return { error: "No autorizado." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  // Sin espacios y en minúsculas: mismo criterio que el alta de clientes
  // de Club 57, para que el correo guardado sea el mismo que se teclea al
  // iniciar sesión.
  const email = String(formData.get("email") ?? "").replace(/\s+/g, "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "admin");

  if (!fullName || !email || !password) {
    return { error: "Completa nombre, correo y contraseña." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (role !== "admin" && role !== "operador" && role !== "vendedor") {
    return { error: "Rol inválido." };
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
    // El correo ya pertenece a otra cuenta (casi siempre un cliente que se
    // registró en el sitio o en Club 57). No se convierte en personal desde
    // aquí: perdería su membresía y sus puntos.
    if (createError?.code === "email_exists" || /already (been )?registered/i.test(createError?.message ?? "")) {
      return {
        error:
          "Ya existe una cuenta con ese correo (por ejemplo, un cliente registrado en el sitio o en Club 57). Usa otro correo para esta cuenta de acceso.",
      };
    }
    return { error: translateAuthError(createError?.message ?? "No se pudo crear el usuario.") };
  }

  // El trigger handle_new_user (ver migraciones) ya creó la fila en
  // profiles con role='customer' al insertarse en auth.users. Este UPDATE
  // corre con la service_role, así que prevent_role_escalation lo deja
  // pasar (esa protección es específicamente contra la anon key/JWT de
  // un usuario normal, no contra la service_role).
  const { error: promoteError } = await adminClient
    .from("profiles")
    .update({ role })
    .eq("id", created.user.id);

  if (promoteError) {
    return {
      error: `El usuario se creó pero no se pudo asignar el rol de ${STAFF_ROLE_LABEL[role]}. Avísale a soporte.`,
    };
  }

  // handle_new_user() (ver migraciones) mete a TODA cuenta nueva a
  // club57_members sin importar el rol — correcto para clientes, pero un
  // admin/vendedor no es un cliente y no debe aparecer en
  // /admin/lealtad/clientes ni acumular puntos. No falla el alta si esto
  // falla (el usuario ya quedó creado y promovido, que es lo importante).
  await adminClient.from("club57_members").delete().eq("id", created.user.id);

  revalidatePath("/admin/accesos");
  return { success: true };
}

export interface StaffAccountActionResult {
  error?: string;
  success?: boolean;
}

// Duración del "ban" de Supabase Auth con el que se desactiva una cuenta:
// en la práctica indefinido (se quita al reactivar con "none").
const DESACTIVADA_BAN = "876000h";

// Quién ejecuta la acción: solo un admin completo activo (el operador no
// administra cuentas de personal; is_full_admin() ya excluye cuentas
// desactivadas, ver migraciones 20261013010000 y 20261016010000).
async function requireAdminActor(): Promise<{ userId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isAdmin, error } = await supabase.rpc("is_full_admin");
  if (error || !isAdmin) return null;
  return { userId: user.id };
}

// La cuenta sobre la que se actúa tiene que ser de personal: estas acciones
// nunca deben poder tocar la cuenta de un cliente de Club 57.
async function getStaffTarget(adminClient: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: profile, error } = await adminClient.from("profiles").select("id, role").eq("id", userId).maybeSingle();
  if (error) return { error: "No se pudo validar la cuenta." };
  if (!profile || (profile.role !== "admin" && profile.role !== "operador" && profile.role !== "vendedor")) {
    return { error: "Esa cuenta no es de personal del panel." };
  }
  return { role: profile.role as "admin" | "operador" | "vendedor" };
}

function isBanned(bannedUntil: string | undefined | null): boolean {
  return Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now());
}

// Cambia la contraseña de una cuenta de personal (por ejemplo, porque la
// olvidó o porque se compartió). Si la cuenta es de otra persona, también
// se cierran sus sesiones abiertas para que tenga que entrar con la nueva.
export async function setStaffPassword(userId: string, password: string): Promise<StaffAccountActionResult> {
  const actor = await requireAdminActor();
  if (!actor) return { error: "No autorizado." };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const target = await getStaffTarget(adminClient, userId);
  if ("error" in target) return { error: target.error };

  const { error } = await adminClient.auth.admin.updateUserById(userId, { password });
  if (error) return { error: translateAuthError(error.message) };

  if (userId !== actor.userId) {
    const { error: sessionsError } = await adminClient.rpc("staff_cerrar_sesiones", { p_user_id: userId });
    if (sessionsError) console.error("[setStaffPassword] no se pudieron cerrar las sesiones", sessionsError.message);
  }

  revalidatePath("/admin/accesos");
  return { success: true };
}

// Desactiva o reactiva una cuenta de personal. Desactivar bloquea el
// inicio de sesión y cierra sus sesiones abiertas de inmediato; los datos
// (clientes que dio de alta, compras registradas) se conservan. Nunca se
// puede desactivar la propia cuenta ni al último administrador activo.
export async function setStaffActive(userId: string, active: boolean): Promise<StaffAccountActionResult> {
  const actor = await requireAdminActor();
  if (!actor) return { error: "No autorizado." };
  if (!active && userId === actor.userId) return { error: "No puedes desactivar tu propia cuenta." };

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const target = await getStaffTarget(adminClient, userId);
  if ("error" in target) return { error: target.error };

  if (!active && target.role === "admin") {
    const { data: admins, error: adminsError } = await adminClient.from("profiles").select("id").eq("role", "admin");
    if (adminsError) return { error: "No se pudo validar la lista de administradores." };
    const otherAdmins = (admins ?? []).filter((admin) => admin.id !== userId);
    const activeOthers = await Promise.all(
      otherAdmins.map(async (admin) => {
        const { data } = await adminClient.auth.admin.getUserById(admin.id);
        return data.user ? !isBanned(data.user.banned_until) : false;
      })
    );
    if (!activeOthers.some(Boolean)) return { error: "Debe quedar al menos un administrador activo." };
  }

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: active ? "none" : DESACTIVADA_BAN,
  });
  if (error) return { error: translateAuthError(error.message) };

  if (!active) {
    const { error: sessionsError } = await adminClient.rpc("staff_cerrar_sesiones", { p_user_id: userId });
    if (sessionsError) console.error("[setStaffActive] no se pudieron cerrar las sesiones", sessionsError.message);
  }

  revalidatePath("/admin/accesos");
  return { success: true };
}
