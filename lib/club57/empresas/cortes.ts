// Club 57 Empresarial · corte mensual con Ferretería 57 — utilidades puras
// compartidas por el portal, el panel y los documentos (PDF y Excel).

/** Bucket privado de Storage con las facturas (PDF y XML) de los cortes. */
export const FACTURAS_BUCKET = "club57-facturas";

export type EstadoCiclo = "abierto" | "revision" | "conciliado" | "facturado" | "pagado" | "vencido";

export const ESTADO_CICLO_LABEL: Record<EstadoCiclo, string> = {
  abierto: "En curso",
  revision: "En revisión",
  conciliado: "Conciliado",
  facturado: "Facturado",
  pagado: "Pagado",
  vencido: "Pago vencido",
};

export const ESTADO_CICLO_CLASS: Record<EstadoCiclo, string> = {
  abierto: "bg-brand-gray text-brand-slate",
  revision: "bg-orange-100 text-orange-800",
  conciliado: "bg-blue-100 text-blue-800",
  facturado: "bg-violet-100 text-violet-800",
  pagado: "bg-green-100 text-green-800",
  vencido: "bg-red-100 text-red-800",
};

/** Un ciclo como lo devuelven club57_portal_ciclos() / club57_admin_ciclos(). */
export interface Ciclo {
  id: string;
  empresa_id?: string;
  empresa_nombre?: string;
  periodo_inicio: string;
  periodo_fin: string;
  estado: EstadoCiclo;
  total: number;
  pedidos: number;
  observaciones_abiertas: number;
  revision_vence_at: string | null;
  conformidad_at: string | null;
  conformidad_tacita: boolean;
  factura_folio: string | null;
  factura_fecha: string | null;
  factura_monto: number | null;
  tiene_pdf: boolean;
  tiene_xml: boolean;
  pago_vence: string | null;
  pago_fecha: string | null;
  pago_monto: number | null;
  pago_referencia: string | null;
  nota: string | null;
}

export function mapCiclo(row: Record<string, unknown>): Ciclo {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return {
    ...(row as unknown as Ciclo),
    total: Number(row.total ?? 0),
    pedidos: Number(row.pedidos ?? 0),
    observaciones_abiertas: Number(row.observaciones_abiertas ?? 0),
    factura_monto: num(row.factura_monto),
    pago_monto: num(row.pago_monto),
  };
}

/** Renglón de club57_ciclo_detalle(): un pedido o un ajuste (saldo a favor). */
export interface CicloLinea {
  tipo: "pedido" | "ajuste";
  order_id: string | null;
  order_number: string | null;
  fecha: string;
  empleado_id: string | null;
  empleado_nombre: string | null;
  numero_empleado: string | null;
  status: string | null;
  subtotal: number | null;
  shipping_cost: number | null;
  total: number;
  items: { product_name: string; variant_label: string | null; sku: string; quantity: number; unit_price: number }[];
  concepto: string | null;
}

export function mapCicloLinea(row: Record<string, unknown>): CicloLinea {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  const items = (Array.isArray(row.items) ? row.items : []) as Record<string, unknown>[];
  return {
    ...(row as unknown as CicloLinea),
    subtotal: num(row.subtotal),
    shipping_cost: num(row.shipping_cost),
    total: Number(row.total ?? 0),
    items: items.map((i) => ({
      product_name: String(i.product_name),
      variant_label: (i.variant_label as string | null) ?? null,
      sku: String(i.sku ?? ""),
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
    })),
  };
}

const centavos = (n: number) => Math.round(n * 100) / 100;

export interface EmpleadoCorte {
  empleadoId: string;
  nombre: string;
  numero: string | null;
  pedidos: CicloLinea[];
  total: number;
}

/** Pedidos agrupados por empleado (estado de cuenta y Excel para nómina). */
export function agruparPorEmpleado(lineas: CicloLinea[]): EmpleadoCorte[] {
  const mapa = new Map<string, EmpleadoCorte>();
  for (const l of lineas) {
    if (l.tipo !== "pedido") continue;
    const clave = l.empleado_id ?? `sin-${l.empleado_nombre ?? ""}`;
    let e = mapa.get(clave);
    if (!e) {
      e = { empleadoId: clave, nombre: l.empleado_nombre ?? "Sin nombre", numero: l.numero_empleado, pedidos: [], total: 0 };
      mapa.set(clave, e);
    }
    e.pedidos.push(l);
    e.total = centavos(e.total + l.total);
  }
  return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export interface ProductoCorte {
  sku: string;
  producto: string;
  cantidad: number;
  importe: number;
}

/** Detalle por producto (Excel): piezas e importe sumados por SKU y presentación. */
export function detallePorProducto(lineas: CicloLinea[]): ProductoCorte[] {
  const mapa = new Map<string, ProductoCorte>();
  for (const l of lineas) {
    if (l.tipo !== "pedido") continue;
    for (const i of l.items) {
      const nombre = i.variant_label && i.variant_label !== "Único" ? `${i.product_name} (${i.variant_label})` : i.product_name;
      const clave = `${i.sku}|${nombre}`;
      const p = mapa.get(clave) ?? { sku: i.sku, producto: nombre, cantidad: 0, importe: 0 };
      p.cantidad += i.quantity;
      p.importe = centavos(p.importe + i.quantity * i.unit_price);
      mapa.set(clave, p);
    }
  }
  return [...mapa.values()].sort((a, b) => b.importe - a.importe || a.producto.localeCompare(b.producto, "es"));
}

/** Suma de los envíos cobrados en los pedidos del ciclo. */
export function totalEnvios(lineas: CicloLinea[]): number {
  return centavos(lineas.filter((l) => l.tipo === "pedido").reduce((sum, l) => sum + (l.shipping_cost ?? 0), 0));
}

const fmtDia = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });
const fmtDiaAnio = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "1 nov – 30 nov 2026" para un periodo YYYY-MM-DD. */
export function periodoLabel(inicio: string, fin: string): string {
  const a = new Date(`${inicio}T12:00:00Z`);
  const b = new Date(`${fin}T12:00:00Z`);
  const limpiar = (s: string) => s.replace(/\./g, "");
  return `${limpiar(fmtDia.format(a))} – ${limpiar(fmtDiaAnio.format(b))}`;
}

/** "30 nov 2026" para una fecha YYYY-MM-DD. */
export function fechaCorta(fecha: string): string {
  return fmtDiaAnio.format(new Date(`${fecha}T12:00:00Z`)).replace(/\./g, "");
}
