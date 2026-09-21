import Link from "next/link";

export interface Club57MemberRow {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  saldoDisponible: number;
}

export function Club57MembersTable({ members }: { members: Club57MemberRow[] }) {
  if (members.length === 0) {
    return (
      <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
        No hay clientes que coincidan con esa búsqueda.
      </p>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
      <table className="w-full min-w-[560px] text-left font-sans text-sm">
        <thead>
          <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Teléfono</th>
            <th className="px-4 py-3">Saldo de puntos</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-brand-slate/10 last:border-0 hover:bg-brand-gray/40">
              <td className="max-w-[240px] px-4 py-3">
                <Link
                  href={`/admin/lealtad/clientes/${member.id}`}
                  className="font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
                >
                  {member.fullName}
                </Link>
                <p className="truncate text-xs text-brand-slate/70">{member.email}</p>
              </td>
              <td className="px-4 py-3 text-brand-slate">{member.phone}</td>
              <td className="px-4 py-3 font-medium text-brand-black">{member.saldoDisponible} pts</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
