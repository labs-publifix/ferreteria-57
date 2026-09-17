import type { Metadata } from "next";
import { FilterSelectField } from "@/components/admin/FilterSelectField";
import { OrdersTable, type OrderRow } from "@/components/admin/OrdersTable";
import { buttonClassName } from "@/components/ui";
import { FULFILLMENT_TYPE_LABEL, ORDER_STATUS_LABEL } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pedidos — Panel de administración" };

// Estatus y tipo de entrega se filtran en la propia consulta; el buscador
// (por número de pedido o correo) se resuelve en memoria sobre ese
// resultado ya acotado — mismo criterio documentado en /admin/productos.
async function getAdminOrders(filters: {
  q: string;
  estatus: string;
  entrega: string;
}): Promise<OrderRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_email, fulfillment_type, status, total, created_at")
    .order("created_at", { ascending: false });

  if (filters.estatus) query = query.eq("status", filters.estatus);
  if (filters.entrega) query = query.eq("fulfillment_type", filters.entrega);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  let rows = (data ?? []) as unknown as OrderRow[];

  const q = filters.q.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (row) => row.order_number.toLowerCase().includes(q) || row.customer_email.toLowerCase().includes(q)
    );
  }

  return rows;
}

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: { q?: string; estatus?: string; entrega?: string };
}) {
  const filters = {
    q: searchParams.q ?? "",
    estatus: searchParams.estatus ?? "",
    entrega: searchParams.entrega ?? "",
  };

  let orders: OrderRow[] = [];
  let loadError: string | null = null;
  try {
    orders = await getAdminOrders(filters);
  } catch (err) {
    loadError = `No se pudieron cargar los pedidos: ${err instanceof Error ? err.message : "error desconocido"}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Pedidos</h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
          Pedidos creados desde el checkout de la tienda. El pago se procesa de forma simulada por
          ahora — todo pedido nace con estatus &quot;Pagado&quot;.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="q" className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
            Buscar por número de pedido o correo
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={filters.q}
            className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
          />
        </div>

        <div>
          <span className="mb-1.5 block font-sans text-sm font-medium text-brand-black">Estatus</span>
          <FilterSelectField
            name="estatus"
            defaultValue={filters.estatus}
            label="Estatus"
            options={[
              { value: "", label: "Todos" },
              ...Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>

        <div>
          <span className="mb-1.5 block font-sans text-sm font-medium text-brand-black">Entrega</span>
          <FilterSelectField
            name="entrega"
            defaultValue={filters.entrega}
            label="Entrega"
            options={[
              { value: "", label: "Todas" },
              ...Object.entries(FULFILLMENT_TYPE_LABEL).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>

        <button type="submit" className={buttonClassName("secondary")}>
          Filtrar
        </button>
      </form>

      {loadError ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {loadError}
        </p>
      ) : (
        <OrdersTable orders={orders} />
      )}
    </div>
  );
}
