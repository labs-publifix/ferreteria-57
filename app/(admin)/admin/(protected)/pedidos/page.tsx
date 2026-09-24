import type { Metadata } from "next";
import { FilterSelectField } from "@/components/admin/FilterSelectField";
import { OrdersTable, type OrderRow } from "@/components/admin/OrdersTable";
import { Pagination } from "@/components/admin/Pagination";
import { buttonClassName } from "@/components/ui";
import { FULFILLMENT_TYPE_LABEL, ORDER_STATUS_LABEL } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pedidos — Panel de administración" };

const PAGE_SIZE = 20;

interface AdminOrdersFilters {
  q: string;
  estatus: string;
  entrega: string;
  page: number;
}

// Estatus y tipo de entrega se filtran en la propia consulta. El buscador
// (por número de pedido o correo) sigue resolviéndose en memoria — mismo
// criterio documentado en /admin/productos —, pero eso significa que no se
// puede paginar en la base cuando hay texto de búsqueda: filtrar en
// memoria DESPUÉS de un .range() daría páginas con menos resultados de
// los que en realidad hay. Con `q` vacío (el caso común de solo navegar la
// lista) sí se pagina en la base con .range()+count exact, que es lo que
// escala cuando la tabla crezca; con `q` presente se trae el conjunto ya
// acotado por estatus/entrega (normalmente chico) y se pagina en memoria
// sobre el resultado filtrado por texto.
async function getAdminOrders(filters: AdminOrdersFilters): Promise<{ orders: OrderRow[]; totalCount: number }> {
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_email, fulfillment_type, status, total, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (filters.estatus) query = query.eq("status", filters.estatus);
  if (filters.entrega) query = query.eq("fulfillment_type", filters.entrega);

  const q = filters.q.trim().toLowerCase();

  if (!q) {
    const from = (filters.page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);
    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { orders: (data ?? []) as unknown as OrderRow[], totalCount: count ?? 0 };
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const filtered = ((data ?? []) as unknown as OrderRow[]).filter(
    (row) => row.order_number.toLowerCase().includes(q) || row.customer_email.toLowerCase().includes(q)
  );
  const from = (filters.page - 1) * PAGE_SIZE;
  return { orders: filtered.slice(from, from + PAGE_SIZE), totalCount: filtered.length };
}

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: { q?: string; estatus?: string; entrega?: string; page?: string };
}) {
  const filters: AdminOrdersFilters = {
    q: searchParams.q ?? "",
    estatus: searchParams.estatus ?? "",
    entrega: searchParams.entrega ?? "",
    page: Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1),
  };

  let orders: OrderRow[] = [];
  let totalCount = 0;
  let loadError: string | null = null;
  try {
    ({ orders, totalCount } = await getAdminOrders(filters));
  } catch (err) {
    loadError = `No se pudieron cargar los pedidos: ${err instanceof Error ? err.message : "error desconocido"}`;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function buildHref(page: number) {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.estatus) params.set("estatus", filters.estatus);
    if (filters.entrega) params.set("entrega", filters.entrega);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `/admin/pedidos?${query}` : "/admin/pedidos";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Pedidos</h1>
        <p className="mt-2 max-w-prose font-sans text-sm text-brand-slate/70">
          Pedidos creados desde el checkout de la tienda. Todo pedido nace &quot;Pendiente de pago&quot;
          y pasa a &quot;Pagado&quot; cuando Mercado Pago confirma el cobro.
        </p>
      </div>

      {/* Sin campo oculto para `page`: cambiar cualquier filtro aquí manda
          un GET con solo estos 3 campos, así que siempre vuelve a la
          página 1 en vez de conservar una página que puede ya ni existir
          para el nuevo resultado filtrado. */}
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
        <>
          <OrdersTable orders={orders} />
          <Pagination page={filters.page} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
