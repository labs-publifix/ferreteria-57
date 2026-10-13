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

  // Primero las filas de profiles con rol de personal (pocas) y después el
  // email de cada una con getUserById: profiles nunca guarda el email (ver
  // migraciones). Antes se usaba listUsers(), que solo devuelve la primera
  // página de Auth (50 usuarios): en cuanto había más clientes de Club 57
  // que eso, las cuentas de personal más nuevas dejaban de aparecer aquí.
  // Ambas consultas usan la service_role: se saltan RLS a propósito, esta
  // página ya está detrás del layout protegido.
  const { data: profiles, error: profilesError } = await adminClient
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "vendedor"]);

  if (profilesError) throw profilesError;

  const accounts = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      const { data, error } = await adminClient.auth.admin.getUserById(profile.id);
      if (error || !data.user) throw error ?? new Error(`Sin usuario de Auth para ${profile.id}`);
      const account: StaffAccount = {
        id: profile.id,
        email: data.user.email ?? "",
        fullName: (data.user.user_metadata?.full_name as string | undefined) ?? profile.full_name ?? null,
        createdAt: data.user.created_at,
      };
      return { role: profile.role as "admin" | "vendedor", account };
    })
  );

  const byCreatedAt = (a: StaffAccount, b: StaffAccount) => a.createdAt.localeCompare(b.createdAt);

  return {
    admins: accounts.filter((entry) => entry.role === "admin").map((entry) => entry.account).sort(byCreatedAt),
    vendedores: accounts.filter((entry) => entry.role === "vendedor").map((entry) => entry.account).sort(byCreatedAt),
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
