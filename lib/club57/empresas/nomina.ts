// Club 57 Empresarial · descuentos de nómina (crédito revolvente) —
// utilidades puras: agrupan los descuentos que devuelve
// club57_portal_descuentos() por nómina (fecha) y por empleado.

export type EstadoDescuento = "programado" | "aplicado" | "no_aplicado" | "cancelado" | "baja";
export type EstadoNomina = "pendiente" | "confirmada" | "tacita";

export interface PortalDescuento {
  id: string;
  fecha_nomina: string;
  nomina_estado: EstadoNomina;
  nomina_confirmada_at: string | null;
  tacita_at: string;
  empleado_id: string;
  empleado_nombre: string;
  empleado_correo: string;
  numero_empleado: string | null;
  empleado_estado: string;
  order_number: string;
  numero: number;
  de_total: number;
  monto: number;
  monto_aplicado: number | null;
  estado: EstadoDescuento;
}

export interface NominaEmpleado {
  empleadoId: string;
  nombre: string;
  correo: string;
  numero: string | null;
  /** Lo que tocaba descontar en esta nómina. */
  total: number;
  /** Lo que se descontó (solo nóminas confirmadas). */
  aplicado: number;
  pedidos: string[];
  /** true si en esta nómina el empleado ya estaba dado de baja. */
  baja: boolean;
}

export interface Nomina {
  fecha: string;
  estado: EstadoNomina;
  confirmadaAt: string | null;
  tacitaAt: string;
  empleados: NominaEmpleado[];
  total: number;
  aplicado: number;
}

export interface NominasAgrupadas {
  /** Ya llegó su fecha y falta confirmarlas. */
  porConfirmar: Nomina[];
  /** Fecha futura. */
  proximas: Nomina[];
  /** Confirmadas o aplicadas en automático, la más reciente primero. */
  historial: Nomina[];
}

const centavos = (n: number) => Math.round(n * 100) / 100;
const pesosMx = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function mapPortalDescuento(row: Record<string, unknown>): PortalDescuento {
  return {
    ...(row as unknown as PortalDescuento),
    numero: Number(row.numero),
    de_total: Number(row.de_total),
    monto: Number(row.monto),
    monto_aplicado: row.monto_aplicado === null || row.monto_aplicado === undefined ? null : Number(row.monto_aplicado),
  };
}

/** `hoy` en formato YYYY-MM-DD (zona de la tienda). */
export function agruparNominas(descuentos: PortalDescuento[], hoy: string): NominasAgrupadas {
  const porFecha = new Map<string, Nomina>();
  for (const d of descuentos) {
    if (d.estado === "cancelado") continue;
    let nomina = porFecha.get(d.fecha_nomina);
    if (!nomina) {
      nomina = {
        fecha: d.fecha_nomina,
        estado: d.nomina_estado,
        confirmadaAt: d.nomina_confirmada_at,
        tacitaAt: d.tacita_at,
        empleados: [],
        total: 0,
        aplicado: 0,
      };
      porFecha.set(d.fecha_nomina, nomina);
    }
    // Pendiente: solo cuenta lo programado (lo cerrado por baja ya no se
    // descuenta). Confirmada: todo lo que se resolvió en esa fecha.
    if (nomina.estado === "pendiente" && d.estado !== "programado") continue;
    let empleado = nomina.empleados.find((e) => e.empleadoId === d.empleado_id);
    if (!empleado) {
      empleado = {
        empleadoId: d.empleado_id,
        nombre: d.empleado_nombre,
        correo: d.empleado_correo,
        numero: d.numero_empleado,
        total: 0,
        aplicado: 0,
        pedidos: [],
        baja: d.estado === "baja",
      };
      nomina.empleados.push(empleado);
    }
    empleado.total = centavos(empleado.total + d.monto);
    empleado.aplicado = centavos(empleado.aplicado + (d.monto_aplicado ?? 0));
    if (!empleado.pedidos.includes(d.order_number)) empleado.pedidos.push(d.order_number);
  }

  const nominas = [...porFecha.values()].filter((n) => n.empleados.length > 0);
  for (const n of nominas) {
    n.empleados.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    n.total = centavos(n.empleados.reduce((sum, e) => sum + e.total, 0));
    n.aplicado = centavos(n.empleados.reduce((sum, e) => sum + e.aplicado, 0));
  }
  const pendientes = nominas.filter((n) => n.estado === "pendiente").sort((a, b) => a.fecha.localeCompare(b.fecha));
  return {
    porConfirmar: pendientes.filter((n) => n.fecha <= hoy),
    proximas: pendientes.filter((n) => n.fecha > hoy),
    historial: nominas.filter((n) => n.estado !== "pendiente").sort((a, b) => b.fecha.localeCompare(a.fecha)),
  };
}

const formatoFecha = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const formatoCorto = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });

/** "lunes, 30 de noviembre" para una fecha YYYY-MM-DD (sin corrimiento de zona). */
export function fechaNominaLabel(fecha: string): string {
  return formatoFecha.format(new Date(`${fecha}T12:00:00Z`));
}

/** "30 nov" para una fecha YYYY-MM-DD. */
export function fechaNominaCorta(fecha: string): string {
  return formatoCorto.format(new Date(`${fecha}T12:00:00Z`)).replace(".", "");
}

/** Excepción de una nómina: monto aplicado a un empleado (0 = no se aplicó). */
export interface ExcepcionNomina {
  empleado_id: string;
  monto_aplicado: number;
}

/** Valida las excepciones contra lo que tocaba descontar a cada empleado. */
export function validarExcepciones(nomina: Nomina, excepciones: ExcepcionNomina[]): string | null {
  for (const exc of excepciones) {
    const empleado = nomina.empleados.find((e) => e.empleadoId === exc.empleado_id);
    if (!empleado) return "Hay un empleado que no está en esta nómina.";
    if (!Number.isFinite(exc.monto_aplicado) || exc.monto_aplicado < 0) return `Revisa el monto de ${empleado.nombre}.`;
    if (exc.monto_aplicado > empleado.total + 0.005) {
      return `A ${empleado.nombre} le tocaban ${pesosMx.format(empleado.total)}; el monto aplicado no puede ser mayor.`;
    }
  }
  return null;
}
