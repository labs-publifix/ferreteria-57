import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Club57MembersTable, type Club57MemberRow } from "@/components/admin/Club57MembersTable";
import { buttonClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { club57VendedorLabel } from "@/lib/club57/labels";

export const metadata: Metadata = { title: "Clientes — Club 57" };

// Saldo disponible = suma del ledger en estado 'disponible' — se calcula
// aquí en memoria (no hay vista materializada) tal como pide la
// especificación de esta pantalla; con el volumen de clientes de Club 57
// en esta primera fase, traer todo el ledger disponible en una sola
// consulta .in(memberIds) es más simple y suficiente que una vista.
// Filtro «Vendedor»: "" = todos, "ninguno" = sin vendedor (registro en
// línea o alta desde el panel), o el id de un vendedor. Un valor que no sea
// un uuid se ignora (se muestran todos) en vez de romper la consulta.
const SIN_VENDEDOR = "ninguno";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface VendedorOption {
  id: string;
  nombre: string;
}

// Los admins leen todos los perfiles (política de 20260914010000), así que
// basta el cliente normal para listar a los vendedores con su nombre.
async function getVendedores(): Promise<VendedorOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name").eq("role", "vendedor");
  return (data ?? [])
    .map((row) => ({ id: row.id as string, nombre: (row.full_name as string | null)?.trim() || "Vendedor sin nombre" }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

async function getClub57Members(
  query: string,
  vendedor: string,
  vendedores: VendedorOption[]
): Promise<{ members: Club57MemberRow[]; error?: string }> {
  const supabase = await createClient();

  let membersQuery = supabase
    .from("club57_members")
    .select("id, full_name, email, phone, origen_alta, creado_por_vendedor_id")
    .order("created_at", { ascending: false });

  const q = query.trim();
  if (q) {
    membersQuery = membersQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  if (vendedor === SIN_VENDEDOR) {
    membersQuery = membersQuery.is("creado_por_vendedor_id", null);
  } else if (UUID_RE.test(vendedor)) {
    membersQuery = membersQuery.eq("creado_por_vendedor_id", vendedor);
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

  const nombreByVendedor = new Map(vendedores.map((option) => [option.id, option.nombre]));

  return {
    members: members.map((member) => ({
      id: member.id,
      fullName: member.full_name,
      email: member.email,
      phone: member.phone,
      saldoDisponible: saldoByMember.get(member.id) ?? 0,
      vendedorLabel: club57VendedorLabel(
        member.origen_alta,
        member.creado_por_vendedor_id,
        member.creado_por_vendedor_id ? nombreByVendedor.get(member.creado_por_vendedor_id) : null
      ),
    })),
  };
}

export default async function AdminClub57ClientesPage({
  searchParams,
}: {
  searchParams: { q?: string; vendedor?: string };
}) {
  const q = searchParams.q ?? "";
  const vendedor = searchParams.vendedor ?? "";
  const vendedores = await getVendedores();
  const { members, error } = await getClub57Members(q, vendedor, vendedores);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/lealtad"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Club 57
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Clientes</h1>
          <Link href="/admin/lealtad/clientes/nuevo" className={buttonClassName("primary")}>
            <UserPlus className="size-4" aria-hidden="true" strokeWidth={1.75} />
            Nuevo cliente
          </Link>
        </div>
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
        <div className="min-w-[200px]">
          <label htmlFor="vendedor" className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Vendedor
          </label>
          <select
            id="vendedor"
            name="vendedor"
            defaultValue={vendedor}
            className="w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          >
            <option value="">Todos</option>
            {vendedores.map((option) => (
              <option key={option.id} value={option.id}>
                {option.nombre}
              </option>
            ))}
            <option value={SIN_VENDEDOR}>Sin vendedor</option>
          </select>
        </div>
        <button type="submit" className={buttonClassName("secondary")}>
          Buscar
        </button>
      </form>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudieron cargar los clientes: {error}
        </p>
      ) : (
        <Club57MembersTable members={members} showVendedor />
      )}
    </div>
  );
}
