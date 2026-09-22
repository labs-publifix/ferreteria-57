import type { Metadata } from "next";
import { Club57RedemptionsTable, type Club57RedemptionRow } from "@/components/admin/Club57RedemptionsTable";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Canjes — Club 57" };

// Misma consulta que /admin/lealtad/canjes — RLS ("Los vendedores ven
// canjes de sus clientes", migración 20260927010000) ya limita las filas
// a los canjes de clientes con creado_por_vendedor_id = auth.uid() cuando
// quien llama es un vendedor. Entregar/cancelar reutiliza el mismo botón
// de Club57RedemptionsTable, que llama al mismo RPC ya extendido para
// validar que el vendedor sea dueño del cliente antes de resolver nada.
export default async function VendedorCanjesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("club57_redemptions")
    .select(
      "id, puntos_usados, estado, created_at, club57_members(full_name, email), club57_redemption_catalog(nombre)"
    )
    .order("created_at", { ascending: false });

  const redemptions: Club57RedemptionRow[] = (data ?? []).map((row) => {
    const member = row.club57_members as { full_name: string; email: string } | { full_name: string; email: string }[] | null;
    const item = row.club57_redemption_catalog as { nombre: string } | { nombre: string }[] | null;
    const memberInfo = Array.isArray(member) ? member[0] : member;
    const itemInfo = Array.isArray(item) ? item[0] : item;

    return {
      id: row.id,
      puntosUsados: row.puntos_usados,
      estado: row.estado,
      createdAt: row.created_at,
      memberNombre: memberInfo?.full_name ?? "Cliente",
      memberEmail: memberInfo?.email ?? "",
      itemNombre: itemInfo?.nombre ?? "Artículo",
    };
  });

  const pendientes = redemptions.filter((r) => r.estado === "pendiente");
  const resueltos = redemptions.filter((r) => r.estado !== "pendiente");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Canjes</h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
          Solicitudes de canje de tus clientes — entrega en tienda y marca aquí el resultado.
        </p>
      </div>

      <div>
        <h2 className="mb-3 font-display text-base uppercase text-brand-slate">
          Pendientes de entrega {pendientes.length > 0 && `(${pendientes.length})`}
        </h2>
        <Club57RedemptionsTable rows={pendientes} showActions />
      </div>

      <div>
        <h2 className="mb-3 font-display text-base uppercase text-brand-slate">Resueltos</h2>
        <Club57RedemptionsTable rows={resueltos} showActions={false} />
      </div>
    </div>
  );
}
