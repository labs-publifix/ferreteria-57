import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateAdminForm } from "@/components/admin/CreateAdminForm";

export const metadata: Metadata = { title: "Accesos — Panel de administración" };

interface StaffAccount {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
}

async function getStaff(): Promise<{ admins: StaffAccount[]; vendedores: StaffAccount[] }> {
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

  const roleById = new Map((profiles ?? []).map((profile) => [profile.id, profile.role]));

  const toStaffAccount = (user: (typeof usersPage.users)[number]): StaffAccount => ({
    id: user.id,
    email: user.email ?? "",
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    createdAt: user.created_at,
  });

  const byCreatedAt = (a: StaffAccount, b: StaffAccount) => a.createdAt.localeCompare(b.createdAt);

  return {
    admins: usersPage.users.filter((user) => roleById.get(user.id) === "admin").map(toStaffAccount).sort(byCreatedAt),
    vendedores: usersPage.users
      .filter((user) => roleById.get(user.id) === "vendedor")
      .map(toStaffAccount)
      .sort(byCreatedAt),
  };
}

function StaffList({ title, emptyLabel, accounts }: { title: string; emptyLabel: string; accounts: StaffAccount[] }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
      <h2 className="font-display text-base uppercase text-brand-slate">{title}</h2>

      {accounts.length === 0 ? (
        <p className="mt-3 font-sans text-sm text-brand-slate/70">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-brand-slate/10">
          {accounts.map((account) => (
            <li key={account.id} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
              <span className="font-sans text-sm font-semibold text-brand-black">
                {account.fullName?.trim() || "Sin nombre"}
              </span>
              <span className="font-sans text-sm text-brand-slate/70">{account.email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminAccesosPage() {
  let admins: StaffAccount[] = [];
  let vendedores: StaffAccount[] = [];
  let loadError: string | null = null;

  try {
    const staff = await getStaff();
    admins = staff.admins;
    vendedores = staff.vendedores;
  } catch {
    loadError = "No se pudo cargar la lista de cuentas de acceso.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">
          Accesos
        </h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
          Crea cuentas con acceso al panel de administración o a la vista de
          vendedor. La contraseña que definas aquí ya queda activa de
          inmediato — no se envía ningún correo de confirmación.
        </p>
      </div>

      <CreateAdminForm />

      {loadError ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {loadError}
        </p>
      ) : (
        <>
          <StaffList title="Administradores actuales" emptyLabel="Todavía no hay administradores registrados." accounts={admins} />
          <StaffList title="Vendedores actuales" emptyLabel="Todavía no hay vendedores registrados." accounts={vendedores} />
        </>
      )}
    </div>
  );
}
