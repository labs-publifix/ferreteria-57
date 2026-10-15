import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireFullAdmin } from "@/lib/supabase/requireStaff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CreateAdminForm } from "@/components/admin/CreateAdminForm";
import { StaffAccountActions } from "@/components/admin/StaffAccountActions";

export const metadata: Metadata = { title: "Accesos — Panel de administración" };

interface StaffAccount {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
  /** false si la cuenta está desactivada (ban de Supabase Auth). */
  active: boolean;
}

async function getStaff(): Promise<{
  admins: StaffAccount[];
  operadores: StaffAccount[];
  vendedores: StaffAccount[];
}> {
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
    .in("role", ["admin", "operador", "vendedor"]);

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
        active: !(data.user.banned_until && new Date(data.user.banned_until).getTime() > Date.now()),
      };
      return { role: profile.role as "admin" | "operador" | "vendedor", account };
    })
  );

  const byCreatedAt = (a: StaffAccount, b: StaffAccount) => a.createdAt.localeCompare(b.createdAt);

  return {
    admins: accounts.filter((entry) => entry.role === "admin").map((entry) => entry.account).sort(byCreatedAt),
    operadores: accounts.filter((entry) => entry.role === "operador").map((entry) => entry.account).sort(byCreatedAt),
    vendedores: accounts.filter((entry) => entry.role === "vendedor").map((entry) => entry.account).sort(byCreatedAt),
  };
}

function StaffList({
  title,
  emptyLabel,
  accounts,
  currentUserId,
}: {
  title: string;
  emptyLabel: string;
  accounts: StaffAccount[];
  currentUserId: string | null;
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
      <h2 className="font-display text-base uppercase text-brand-slate">{title}</h2>

      {accounts.length === 0 ? (
        <p className="mt-3 font-sans text-sm text-brand-slate/70">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-brand-slate/10">
          {accounts.map((account) => {
            const isSelf = account.id === currentUserId;
            const name = account.fullName?.trim() || "Sin nombre";
            return (
              <li
                key={account.id}
                className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2 font-sans text-sm font-semibold text-brand-black">
                    {name}
                    {isSelf && <span className="font-normal text-brand-slate/70">(tú)</span>}
                    {!account.active && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 font-sans text-xs font-semibold text-red-700">
                        Desactivada
                      </span>
                    )}
                  </span>
                  <span className="break-all font-sans text-sm text-brand-slate/70">{account.email}</span>
                </div>
                <StaffAccountActions
                  userId={account.id}
                  name={name}
                  email={account.email}
                  active={account.active}
                  isSelf={isSelf}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default async function AdminAccesosPage() {
  // Solo el admin completo (el operador no administra este módulo); el
  // middleware ya lo redirige, esto es la segunda capa.
  if (!(await requireFullAdmin())) redirect("/admin");

  let admins: StaffAccount[] = [];
  let operadores: StaffAccount[] = [];
  let vendedores: StaffAccount[] = [];
  let loadError: string | null = null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  try {
    const staff = await getStaff();
    admins = staff.admins;
    operadores = staff.operadores;
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
          vendedor. Un operador usa el panel completo salvo Accesos,
          Configuración y la configuración de Club 57. La contraseña que definas aquí ya queda activa de
          inmediato — no se envía ningún correo de confirmación. Desde la
          lista puedes cambiarle la contraseña a una cuenta o desactivarla:
          una cuenta desactivada no puede entrar, pero conserva sus datos.
        </p>
      </div>

      <CreateAdminForm />

      {loadError ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {loadError}
        </p>
      ) : (
        <>
          <StaffList title="Administradores actuales" emptyLabel="Todavía no hay administradores registrados." accounts={admins} currentUserId={currentUserId} />
          <StaffList title="Operadores actuales" emptyLabel="Todavía no hay operadores registrados." accounts={operadores} currentUserId={currentUserId} />
          <StaffList title="Vendedores actuales" emptyLabel="Todavía no hay vendedores registrados." accounts={vendedores} currentUserId={currentUserId} />
        </>
      )}
    </div>
  );
}
