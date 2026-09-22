import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Club57MembersTable, type Club57MemberRow } from "@/components/admin/Club57MembersTable";
import { buttonClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mis clientes — Club 57" };

// Misma consulta que /admin/lealtad/clientes (el admin) — la diferencia la
// hace RLS: la política "Los vendedores ven a sus propios clientes" (ver
// migración 20260927010000) ya limita las filas visibles a
// creado_por_vendedor_id = auth.uid() cuando quien llama es un vendedor,
// así que no hace falta filtrar nada aquí a mano.
async function getMyClub57Members(query: string): Promise<{ members: Club57MemberRow[]; error?: string }> {
  const supabase = await createClient();

  let membersQuery = supabase
    .from("club57_members")
    .select("id, full_name, email, phone")
    .order("created_at", { ascending: false });

  const q = query.trim();
  if (q) {
    membersQuery = membersQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data: members, error: membersError } = await membersQuery;
  if (membersError) return { members: [], error: membersError.message };
  if (!members || members.length === 0) return { members: [] };

  const memberIds = members.map((member) => member.id);
  const { data: ledgerRows, error: ledgerError } = await supabase
    .from("club57_points_ledger")
    .select("member_id, cantidad")
    .eq("estado", "disponible")
    .in("member_id", memberIds);
  if (ledgerError) return { members: [], error: ledgerError.message };

  const saldoByMember = new Map<string, number>();
  for (const row of ledgerRows ?? []) {
    saldoByMember.set(row.member_id, (saldoByMember.get(row.member_id) ?? 0) + row.cantidad);
  }

  return {
    members: members.map((member) => ({
      id: member.id,
      fullName: member.full_name,
      email: member.email,
      phone: member.phone,
      saldoDisponible: saldoByMember.get(member.id) ?? 0,
    })),
  };
}

export default async function VendedorClientesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q ?? "";
  const { members, error } = await getMyClub57Members(q);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Mis clientes</h1>
        <Link href="/admin/vendedor/clientes/nuevo" className={buttonClassName("primary")}>
          <UserPlus className="size-4" aria-hidden="true" strokeWidth={1.75} />
          Nuevo cliente
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="q" className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Buscar por nombre, correo o teléfono
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          />
        </div>
        <button type="submit" className={buttonClassName("secondary")}>
          Buscar
        </button>
      </form>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudieron cargar tus clientes: {error}
        </p>
      ) : (
        <Club57MembersTable members={members} basePath="/admin/vendedor/clientes" />
      )}
    </div>
  );
}
