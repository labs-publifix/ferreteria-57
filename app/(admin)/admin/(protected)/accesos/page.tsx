import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateAdminForm } from "@/components/admin/CreateAdminForm";

export const metadata: Metadata = { title: "Accesos — Panel de administración" };

async function getAdmins() {
  const adminClient = createAdminClient();

  // listUsers() trae todos los usuarios de Auth (con su email — profiles
  // nunca lo guarda, ver migraciones); profiles solo hace falta para
  // filtrar por role. Ambas consultas usan la service_role: se saltan RLS
  // a propósito, esta página ya está detrás del layout protegido.
  const [{ data: usersPage, error: usersError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      adminClient.auth.admin.listUsers(),
      adminClient.from("profiles").select("id, role"),
    ]);

  if (usersError || profilesError) {
    throw usersError ?? profilesError;
  }

  const adminIds = new Set(
    (profiles ?? []).filter((profile) => profile.role === "admin").map((profile) => profile.id)
  );

  return usersPage.users
    .filter((user) => adminIds.has(user.id))
    .map((user) => ({
      id: user.id,
      email: user.email ?? "",
      fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
      createdAt: user.created_at,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export default async function AdminAccesosPage() {
  let admins: Awaited<ReturnType<typeof getAdmins>> = [];
  let loadError: string | null = null;

  try {
    admins = await getAdmins();
  } catch {
    loadError = "No se pudo cargar la lista de administradores.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">
          Accesos
        </h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
          Crea cuentas con acceso al panel de administración. La contraseña
          que definas aquí ya queda activa de inmediato — no se envía
          ningún correo de confirmación.
        </p>
      </div>

      <CreateAdminForm />

      <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-display text-base uppercase text-brand-slate">
          Administradores actuales
        </h2>

        {loadError && (
          <p className="mt-3 font-sans text-sm text-red-700">{loadError}</p>
        )}

        {!loadError && admins.length === 0 && (
          <p className="mt-3 font-sans text-sm text-brand-slate/70">
            Todavía no hay administradores registrados.
          </p>
        )}

        {!loadError && admins.length > 0 && (
          <ul className="mt-3 flex flex-col divide-y divide-brand-slate/10">
            {admins.map((admin) => (
              <li key={admin.id} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
                <span className="font-sans text-sm font-semibold text-brand-black">
                  {admin.fullName?.trim() || "Sin nombre"}
                </span>
                <span className="font-sans text-sm text-brand-slate/70">{admin.email}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
