// Solo servidor: usa la llave de servicio (no importar desde componentes de cliente).
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/sendEmail";
import { getBusinessNotificationRecipients } from "@/lib/email/businessRecipients";
import {
  buildCustomerConfirmationEmail,
  buildInternalNotificationEmail,
  type OrderEmailAddress,
} from "@/lib/email/orderEmails";
import {
  buildPedidoEmpresaCanceladoEmail,
  buildPedidoEmpresaRecibidoEmail,
  buildPedidoPorAutorizarEmail,
  buildPedidosEmpresaResumenEmail,
  type PedidoEmpresaCancelacion,
} from "@/lib/email/empresarialEmails";
import type { FulfillmentType } from "@/lib/orders/status";
import { appUrl } from "./notificaciones";

// Correos de los pedidos con cargo a la empresa. Igual que el resto de los
// avisos de Club 57 Empresarial: corren con la llave de servicio después de
// que la acción ya se aplicó, y nunca lanzan (un correo fallido no deshace
// nada).

const SELECT_PEDIDO =
  "id, order_number, created_at, status, metodo_pago, customer_name, customer_phone, customer_email, fulfillment_type, colonia, shipping_address, subtotal, shipping_cost, total, autorizacion_vence_at, autorizado_at, empresa_resolucion, empresa_motivo, order_items(product_name, variant_label, quantity, unit_price), club57_empresas(nombre_comercial, responsable_nombre, responsable_correo), club57_empresa_empleados(numero_empleado)";

interface PedidoEmpresa {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  metodo_pago: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  fulfillment_type: FulfillmentType;
  colonia: string | null;
  shipping_address: OrderEmailAddress | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  autorizacion_vence_at: string | null;
  autorizado_at: string | null;
  empresa_resolucion: string | null;
  empresa_motivo: string | null;
  items: { productName: string; variantLabel: string | null; quantity: number; unitPrice: number }[];
  empresa: { nombre_comercial: string; responsable_nombre: string; responsable_correo: string } | null;
  numeroEmpleado: string | null;
}

function uno<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function mapPedido(row: Record<string, unknown>): PedidoEmpresa {
  const items = (row.order_items as { product_name: string; variant_label: string | null; quantity: number; unit_price: number }[]) ?? [];
  return {
    ...(row as unknown as PedidoEmpresa),
    subtotal: Number(row.subtotal),
    shipping_cost: Number(row.shipping_cost),
    total: Number(row.total),
    items: items.map((item) => ({
      productName: item.product_name,
      variantLabel: item.variant_label,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
    })),
    empresa: uno(row.club57_empresas as PedidoEmpresa["empresa"] | PedidoEmpresa["empresa"][]),
    numeroEmpleado: uno(row.club57_empresa_empleados as { numero_empleado: string | null } | null)?.numero_empleado ?? null,
  };
}

async function leerPedidos(ids: string[]): Promise<PedidoEmpresa[]> {
  if (ids.length === 0) return [];
  const { data, error } = await createAdminClient().from("orders").select(SELECT_PEDIDO).in("id", ids);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapPedido).filter((p) => p.metodo_pago === "empresa");
}

function registrar(contexto: string, error: unknown) {
  console.error(`[club57 empresarial] ${contexto}`, error instanceof Error ? error.message : error);
}

async function enviar(contexto: string, to: string | string[], email: { subject: string; html: string }) {
  const result = await sendEmail({ to, ...email });
  if (result.error) registrar(contexto, result.error);
}

/** Pedido recién creado: acuse al empleado y aviso al responsable. */
export async function notificarPedidoEmpresaCreado(orderId: string): Promise<void> {
  try {
    const [pedido] = await leerPedidos([orderId]);
    if (!pedido || pedido.status !== "pendiente_autorizacion" || !pedido.empresa || !pedido.autorizacion_vence_at) return;
    await Promise.all([
      enviar(
        "acuse de pedido",
        pedido.customer_email,
        buildPedidoEmpresaRecibidoEmail({
          empleadoNombre: pedido.customer_name,
          empresa: pedido.empresa.nombre_comercial,
          orderNumber: pedido.order_number,
          items: pedido.items,
          total: pedido.total,
          venceAt: pedido.autorizacion_vence_at,
          cuentaUrl: appUrl("/cuenta?tab=empresarial"),
        })
      ),
      enviar(
        "pedido por autorizar",
        pedido.empresa.responsable_correo,
        buildPedidoPorAutorizarEmail({
          responsableNombre: pedido.empresa.responsable_nombre,
          empresa: pedido.empresa.nombre_comercial,
          empleadoNombre: pedido.customer_name,
          numeroEmpleado: pedido.numeroEmpleado,
          orderNumber: pedido.order_number,
          items: pedido.items,
          total: pedido.total,
          venceAt: pedido.autorizacion_vence_at,
          portalUrl: appUrl("/empresa/pedidos"),
        })
      ),
    ]);
  } catch (error) {
    registrar("aviso de pedido nuevo", error);
  }
}

/** Pedidos autorizados: confirmación al empleado y aviso a la tienda para prepararlos. */
export async function notificarPedidosAutorizados(orderIds: string[]): Promise<void> {
  try {
    const pedidos = await leerPedidos(orderIds);
    await Promise.all(
      pedidos
        .filter((p) => p.empresa_resolucion === "autorizado" && p.empresa)
        .map((pedido) => {
          const data = {
            orderNumber: pedido.order_number,
            createdAt: pedido.autorizado_at ?? pedido.created_at,
            customerName: pedido.customer_name,
            customerPhone: pedido.customer_phone,
            customerEmail: pedido.customer_email,
            fulfillmentType: pedido.fulfillment_type,
            colonia: pedido.colonia,
            shippingAddress: pedido.shipping_address,
            items: pedido.items,
            subtotal: pedido.subtotal,
            shippingCost: pedido.shipping_cost,
            total: pedido.total,
            cargoEmpresa: pedido.empresa?.nombre_comercial ?? null,
          };
          return Promise.all([
            enviar("pedido autorizado (empleado)", pedido.customer_email, buildCustomerConfirmationEmail(data)),
            enviar("pedido autorizado (tienda)", getBusinessNotificationRecipients(), buildInternalNotificationEmail(data)),
          ]);
        })
    );
  } catch (error) {
    registrar("aviso de pedidos autorizados", error);
  }
}

const AVISABLES: PedidoEmpresaCancelacion[] = ["rechazado", "vencido", "baja_empleado", "baja_empresa", "cancelado_tienda"];

/** Pedidos cancelados (rechazo, vencimiento, baja o la tienda): aviso al empleado. */
export async function notificarPedidosEmpresaCancelados(orderIds: string[]): Promise<void> {
  try {
    const pedidos = await leerPedidos(orderIds);
    await Promise.all(
      pedidos
        .filter((p) => p.status === "cancelado" && p.empresa && AVISABLES.includes(p.empresa_resolucion as PedidoEmpresaCancelacion))
        .map((pedido) =>
          enviar(
            "pedido cancelado",
            pedido.customer_email,
            buildPedidoEmpresaCanceladoEmail({
              empleadoNombre: pedido.customer_name,
              empresa: pedido.empresa?.nombre_comercial ?? "",
              orderNumber: pedido.order_number,
              resolucion: pedido.empresa_resolucion as PedidoEmpresaCancelacion,
              motivo: pedido.empresa_motivo,
              cuentaUrl: appUrl("/cuenta?tab=empresarial"),
            })
          )
        )
    );
  } catch (error) {
    registrar("aviso de pedidos cancelados", error);
  }
}

/** Pedidos de un empleado cancelados por su baja en los últimos minutos. */
export async function notificarCanceladosPorBaja(empleadoId: string): Promise<void> {
  try {
    const desde = new Date(Date.now() - 5 * 60_000).toISOString();
    const { data } = await createAdminClient()
      .from("orders")
      .select("id")
      .eq("empresa_empleado_id", empleadoId)
      .eq("empresa_resolucion", "baja_empleado")
      .gte("empresa_resuelto_at", desde);
    await notificarPedidosEmpresaCancelados(((data ?? []) as { id: string }[]).map((row) => row.id));
  } catch (error) {
    registrar("aviso de pedidos cancelados por baja", error);
  }
}

/**
 * Tarea diaria: cancela los pedidos cuyo plazo para autorizar ya venció,
 * avisa a cada empleado y manda a cada responsable un resumen con lo que
 * sigue en espera (como recordatorio) y lo que venció.
 */
export async function procesarPedidosEmpresaDiario(): Promise<{ vencidos: number; recordatorios: number }> {
  const supabase = createAdminClient();

  const { data: vencidosData, error: vencerError } = await supabase.rpc("club57_vencer_pedidos_empresa");
  if (vencerError) throw new Error(vencerError.message);
  const vencidosIds = ((vencidosData ?? []) as (string | { club57_vencer_pedidos_empresa: string })[]).map((row) =>
    typeof row === "string" ? row : row.club57_vencer_pedidos_empresa
  );

  const { data: recordarData, error: recordarError } = await supabase.rpc("club57_pedidos_empresa_por_recordar");
  if (recordarError) throw new Error(recordarError.message);
  const recordarIds = ((recordarData ?? []) as { order_id: string }[]).map((row) => row.order_id);

  const [vencidos, pendientes] = await Promise.all([leerPedidos(vencidosIds), leerPedidos(recordarIds)]);
  await notificarPedidosEmpresaCancelados(vencidosIds);

  const porEmpresa = new Map<string, { pendientes: PedidoEmpresa[]; vencidos: PedidoEmpresa[] }>();
  const grupo = (pedido: PedidoEmpresa) => {
    const clave = pedido.empresa?.responsable_correo ?? "";
    if (!porEmpresa.has(clave)) porEmpresa.set(clave, { pendientes: [], vencidos: [] });
    return porEmpresa.get(clave)!;
  };
  for (const pedido of pendientes) if (pedido.empresa) grupo(pedido).pendientes.push(pedido);
  for (const pedido of vencidos) if (pedido.empresa) grupo(pedido).vencidos.push(pedido);

  let recordatorios = 0;
  for (const [correo, { pendientes: enEspera, vencidos: cancelados }] of porEmpresa) {
    const empresa = (enEspera[0] ?? cancelados[0])?.empresa;
    if (!correo || !empresa) continue;
    try {
      await enviar(
        "resumen diario de pedidos",
        correo,
        buildPedidosEmpresaResumenEmail({
          responsableNombre: empresa.responsable_nombre,
          empresa: empresa.nombre_comercial,
          pendientes: enEspera.map((p) => ({
            orderNumber: p.order_number,
            empleadoNombre: p.customer_name,
            total: p.total,
            venceAt: p.autorizacion_vence_at ?? p.created_at,
          })),
          vencidos: cancelados.map((p) => ({ orderNumber: p.order_number, empleadoNombre: p.customer_name, total: p.total })),
          portalUrl: appUrl("/empresa/pedidos"),
        })
      );
      recordatorios += 1;
    } catch (error) {
      registrar("resumen diario de pedidos", error);
    }
  }

  return { vencidos: vencidosIds.length, recordatorios };
}
