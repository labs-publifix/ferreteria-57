import { hasLowStock } from "@/lib/catalog/stockThresholds";
import { ALL_ORDER_STATUSES, type OrderStatus } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";

export interface DashboardMetrics {
  products: {
    active: number;
    total: number;
    withoutImage: number;
    lowStock: number;
    recentlyActivated: number;
  };
  categories: {
    active: number;
    total: number;
  };
  customers: number;
  pendingReviews: number;
  orders: OrderMetrics;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface ProductMetricsRow {
  active: boolean;
  images: string[] | null;
  activated_at: string | null;
  product_variants: { stock: number }[];
}

// Separado de getDashboardMetrics (que sí depende de Supabase) para poder
// verificarlo con datos de prueba sin necesitar una base real — mismo
// motivo por el que lib/marketing/visibility.ts separa el cálculo puro de
// isWithinSchedule de las consultas que lo usan.
export function computeProductMetrics(products: ProductMetricsRow[], now: number = Date.now()) {
  const sevenDaysAgo = now - SEVEN_DAYS_MS;
  return {
    total: products.length,
    active: products.filter((product) => product.active).length,
    withoutImage: products.filter((product) => (product.images?.length ?? 0) === 0).length,
    lowStock: products.filter((product) => hasLowStock(product.product_variants)).length,
    recentlyActivated: products.filter(
      (product) => product.activated_at && new Date(product.activated_at).getTime() >= sevenDaysAgo
    ).length,
  };
}

export function computeCategoryMetrics(categories: { active: boolean }[]) {
  return {
    total: categories.length,
    active: categories.filter((category) => category.active).length,
  };
}

export interface OrderMetrics {
  /** "pagado": ya se cobró pero nadie empezó a prepararlo todavía. */
  needsAttention: number;
  /** preparando + listo + enviado: ya se está trabajando, aún no se entrega. */
  inProgress: number;
  /** Suma de `total` de todo pedido que no esté cancelado — venta reservada
   *  en firme, no solo la ya entregada. */
  totalRevenue: number;
  byStatus: Record<OrderStatus, number>;
}

const IN_PROGRESS_STATUSES: OrderStatus[] = ["preparando", "listo", "enviado"];

interface OrderMetricsRow {
  status: OrderStatus;
  total: number;
}

export function computeOrderMetrics(orders: OrderMetricsRow[]): OrderMetrics {
  const byStatus = ALL_ORDER_STATUSES.reduce(
    (acc, status) => ({ ...acc, [status]: 0 }),
    {} as Record<OrderStatus, number>
  );
  let totalRevenue = 0;

  for (const order of orders) {
    byStatus[order.status] += 1;
    if (order.status !== "cancelado") totalRevenue += order.total;
  }

  return {
    needsAttention: byStatus.pagado,
    inProgress: IN_PROGRESS_STATUSES.reduce((sum, status) => sum + byStatus[status], 0),
    totalRevenue,
    byStatus,
  };
}

// Todas las lecturas necesarias para /admin (Inicio), en un solo lugar:
// esta página es la única que las usa, y agruparlas aquí (en vez de
// repartir cada .from(...).select(...) directo en el Server Component)
// deja la página enfocada en presentar, no en consultar.
//
// products/categories se traen completos (solo las columnas que hacen
// falta) y se cuentan en memoria en vez de varias consultas count-only por
// separado — mismo criterio ya usado en /admin/productos ("el catálogo de
// una ferretería no es tan grande como para que esto pese"), y así una
// sola ida a la base cubre activos/total/sin-imagen/stock-bajo/recientes
// a la vez.
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const [productsResult, categoriesResult, customersResult, pendingReviewsResult, ordersResult] = await Promise.all([
    supabase.from("products").select("active, images, activated_at, product_variants(stock)"),
    supabase.from("categories").select("active"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("status, total"),
  ]);

  if (productsResult.error) throw new Error(productsResult.error.message);
  if (categoriesResult.error) throw new Error(categoriesResult.error.message);
  if (customersResult.error) throw new Error(customersResult.error.message);
  if (pendingReviewsResult.error) throw new Error(pendingReviewsResult.error.message);
  if (ordersResult.error) throw new Error(ordersResult.error.message);

  return {
    products: computeProductMetrics(productsResult.data),
    categories: computeCategoryMetrics(categoriesResult.data),
    customers: customersResult.count ?? 0,
    pendingReviews: pendingReviewsResult.count ?? 0,
    orders: computeOrderMetrics(ordersResult.data),
  };
}
