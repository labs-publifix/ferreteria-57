"use server";

import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPortalEmpresa } from "@/lib/club57/empresas/portal";
import { notificarVinculoResuelto } from "@/lib/club57/empresas/notificaciones";
import { notificarCanjeEmpresa } from "@/lib/club57/empresas/puntosNotificaciones";
import {
  notificarCanceladosPorBaja,
  notificarPedidosAutorizados,
  notificarPedidosEmpresaCancelados,
} from "@/lib/club57/empresas/pedidosNotificaciones";
import {
  claveColumna,
  marcarDuplicados,
  parseNumero,
  validarFilaPrecarga,
  type LineaTipo,
  type PrecargaError,
  type PrecargaFila,
} from "@/lib/club57/empresas/empleados";

// Portal Empresa — acciones del responsable. Cada función de la base
// vuelve a validar que la sesión sea el responsable de una empresa activa
// o suspendida (club57_requiere_responsable).

function revalidar() {
  revalidatePath("/empresa", "layout");
}

export interface GuardarEmpleadoInput {
  empleadoId: string;
  salario: string;
  lineaTipo: LineaTipo;
  lineaValor: string;
  numero: string;
  /** "" = la misma nómina que la empresa. */
  nominaFrecuencia: string;
  nominaDiaSemana: string;
  nominaDiaMes: string;
}

export async function guardarEmpleado(input: GuardarEmpleadoInput): Promise<{ error?: string }> {
  const supabase = await createClient();
  const salario = parseNumero(input.salario);
  const valor = parseNumero(input.lineaValor);
  if (Number.isNaN(salario)) return { error: "El salario no es un número." };
  if (Number.isNaN(valor) || valor === null) return { error: "Escribe la línea de crédito." };
  const frecuencia = input.nominaFrecuencia || null;

  const { data, error } = await supabase.rpc("club57_portal_guardar_empleado", {
    p_empleado_id: input.empleadoId,
    p_salario: salario,
    p_linea_tipo: input.lineaTipo,
    p_linea_valor: valor,
    p_numero: input.numero,
    p_nomina_frecuencia: frecuencia,
    p_nomina_dia_semana: frecuencia === "semanal" ? Number(input.nominaDiaSemana || 5) : null,
    p_nomina_dia_mes: frecuencia === "mensual" ? Number(input.nominaDiaMes || 0) : null,
  });
  if (error) return { error: error.message || "No se pudo guardar." };
  // Era una solicitud: se le avisa al empleado que ya está aprobado.
  if (data === "pendiente") await notificarVinculoResuelto(input.empleadoId);
  revalidar();
  return {};
}

export async function cerrarEmpleado(empleadoId: string, motivo: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("club57_portal_cerrar_empleado", {
    p_empleado_id: empleadoId,
    p_motivo: motivo.trim().slice(0, 500),
  });
  if (error) return { error: error.message || "No se pudo guardar." };
  await notificarVinculoResuelto(empleadoId);
  // Sus pedidos en espera de autorización se cancelaron con la baja.
  await notificarCanceladosPorBaja(empleadoId);
  revalidar();
  return {};
}

export interface NominaInput {
  frecuencia: string;
  diaSemana: string;
  diaMes: string;
  descuentos: string;
  politica: string;
}

export async function configurarNomina(input: NominaInput): Promise<{ error?: string }> {
  const descuentos = parseNumero(input.descuentos);
  const politica = parseNumero(input.politica);
  if (descuentos === null || Number.isNaN(descuentos) || !Number.isInteger(descuentos) || descuentos < 1 || descuentos > 24) {
    return { error: "Los descuentos por compra van de 1 a 24." };
  }
  if (Number.isNaN(politica) || (politica !== null && (politica <= 0 || politica > 100))) {
    return { error: "La línea general es un porcentaje mayor a 0 y hasta 100." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("club57_portal_configurar_nomina", {
    p_frecuencia: input.frecuencia,
    p_dia_semana: input.frecuencia === "semanal" ? Number(input.diaSemana || 5) : null,
    p_dia_mes: input.frecuencia === "mensual" ? Number(input.diaMes || 0) : null,
    p_descuentos: descuentos,
    p_politica: politica,
  });
  if (error) return { error: error.message || "No se pudo guardar." };
  revalidar();
  return {};
}

export async function regenerarCodigoPortal(): Promise<{ error?: string; codigo?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("club57_portal_regenerar_codigo");
  if (error || !data) return { error: error?.message ?? "No se pudo cambiar el código." };
  revalidar();
  return { codigo: data as string };
}

// --- Precarga por Excel -----------------------------------------------------

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("result" in value && value.result !== null && value.result !== undefined) return String(value.result);
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((part) => part.text).join("");
    if (value instanceof Date) return value.toISOString();
    return "";
  }
  return String(value);
}

export interface LeerPrecargaResult {
  error?: string;
  validas?: PrecargaFila[];
  errores?: PrecargaError[];
}

export async function leerPrecarga(formData: FormData): Promise<LeerPrecargaResult> {
  const { empresa } = await getPortalEmpresa();
  if (!empresa) return { error: "No autorizado." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Elige un archivo .xlsx o .csv." };
  const nombre = file.name.toLowerCase();
  if (!nombre.endsWith(".xlsx") && !nombre.endsWith(".csv")) return { error: "El archivo debe ser .xlsx o .csv." };

  let sheet: ExcelJS.Worksheet | undefined;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    if (nombre.endsWith(".csv")) await workbook.csv.read(Readable.from(buffer));
    // Ver la nota sobre el tipo Buffer de exceljs en productos/importar/actions.ts.
    else await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    sheet = workbook.worksheets[0];
  } catch {
    return { error: "No se pudo leer el archivo. Verifica que no esté dañado." };
  }
  if (!sheet || sheet.rowCount < 2) return { error: "El archivo no tiene filas de datos." };

  const columnas = new Map<string, number>();
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, col) => {
    const key = claveColumna(cellText(cell.value));
    if (!columnas.has(key)) columnas.set(key, col);
  });
  if (!columnas.has("linea") || (!columnas.has("correo") && !columnas.has("numero de empleado"))) {
    return { error: "El archivo necesita las columnas Correo o Número de empleado, y Línea. Descarga la plantilla." };
  }

  const leer = (row: ExcelJS.Row, key: string) => {
    const col = columnas.get(key);
    if (!col) return "";
    const value = row.getCell(col).value;
    return typeof value === "number" ? value : cellText(value).trim();
  };

  const filas: PrecargaFila[] = [];
  const errores: PrecargaError[] = [];
  for (let n = 2; n <= sheet.rowCount; n++) {
    const row = sheet.getRow(n);
    const raw = {
      nombre: leer(row, "nombre"),
      correo: leer(row, "correo"),
      numero: leer(row, "numero de empleado"),
      salario: leer(row, "salario mensual neto"),
      linea: leer(row, "linea"),
    };
    // Si la celda de línea trae un número con formato de porcentaje de
    // Excel (0.5 = 50 %), exceljs lo entrega como número: se respeta el
    // formato de la celda.
    const lineaCol = columnas.get("linea");
    if (lineaCol && typeof raw.linea === "number" && /%/.test(row.getCell(lineaCol).numFmt ?? "")) {
      raw.linea = `${Math.round(raw.linea * 10000) / 100}%`;
    }
    if (Object.values(raw).every((v) => v === "" || v === null)) continue;
    const result = validarFilaPrecarga(n, raw, empresa.exige_numero_empleado);
    if ("error" in result) errores.push(result.error);
    else filas.push(result.ok);
  }
  if (filas.length === 0 && errores.length === 0) return { error: "El archivo no tiene filas de datos." };
  const { validas, errores: repetidos } = marcarDuplicados(filas);
  return { validas, errores: [...errores, ...repetidos].sort((a, b) => a.fila - b.fila) };
}

export async function confirmarPrecarga(filas: PrecargaFila[]): Promise<{ error?: string; cargadas?: number; aprobadas?: number }> {
  const { supabase, empresa } = await getPortalEmpresa();
  if (!empresa) return { error: "No autorizado." };
  if (filas.length === 0) return { error: "No hay filas válidas para cargar." };

  // Solicitudes en revisión antes de cargar: a las que se aprueben se les avisa.
  const { data: antes } = await supabase.rpc("club57_portal_empleados");
  const pendientes = new Set(
    ((antes ?? []) as { id: string; estado: string }[]).filter((e) => e.estado === "pendiente").map((e) => e.id)
  );

  const { data, error } = await supabase.rpc("club57_portal_precargar", {
    p_filas: filas.map((f) => ({
      nombre: f.nombre,
      correo: f.correo,
      numero_empleado: f.numero_empleado,
      salario_mensual: f.salario_mensual === null ? "" : String(f.salario_mensual),
      linea_tipo: f.linea_tipo,
      linea_valor: String(f.linea_valor),
    })),
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return { error: error?.message ?? "No se pudo cargar la lista." };

  const { data: despues } = await supabase.rpc("club57_portal_empleados");
  const aprobadosAhora = ((despues ?? []) as { id: string; estado: string }[]).filter(
    (e) => e.estado === "activo" && pendientes.has(e.id)
  );
  for (const e of aprobadosAhora) await notificarVinculoResuelto(e.id);

  revalidar();
  return { cargadas: row.cargadas, aprobadas: row.aprobadas };
}

// ---------------------------------------------------------------------
// Pedidos con cargo a la empresa
// ---------------------------------------------------------------------
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Autoriza uno o varios pedidos en espera. */
export async function autorizarPedidos(orderIds: string[]): Promise<{ error?: string; autorizados?: number }> {
  const ids = [...new Set(orderIds)].filter((id) => UUID_RE.test(id));
  if (ids.length === 0) return { error: "Elige al menos un pedido." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("club57_portal_autorizar_pedidos", { p_order_ids: ids });
  if (error) return { error: error.message || "No se pudieron autorizar." };
  const autorizados = ((data ?? []) as (string | Record<string, string>)[]).map((row) =>
    typeof row === "string" ? row : Object.values(row)[0]
  );
  await notificarPedidosAutorizados(autorizados);
  revalidar();
  return { autorizados: autorizados.length };
}

/** Rechaza un pedido en espera, con motivo (se le avisa al empleado). */
export async function rechazarPedido(orderId: string, motivo: string): Promise<{ error?: string }> {
  if (!UUID_RE.test(orderId)) return { error: "Pedido no encontrado." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("club57_portal_rechazar_pedido", {
    p_order_id: orderId,
    p_motivo: motivo.trim().slice(0, 500),
  });
  if (error) return { error: error.message || "No se pudo rechazar." };
  await notificarPedidosEmpresaCancelados([orderId]);
  revalidar();
  return {};
}

// ---------------------------------------------------------------------
// Nómina: confirmar los descuentos aplicados
// ---------------------------------------------------------------------
/**
 * Confirma una nómina. Por omisión todos se descuentan completos; las
 * excepciones dicen cuánto se le descontó a un empleado (0 = no se aplicó).
 * Lo que falte se reprograma a su siguiente nómina.
 */
export async function confirmarNomina(
  fecha: string,
  excepciones: { empleado_id: string; monto_aplicado: number }[]
): Promise<{ error?: string; empleados?: number }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "Fecha de nómina inválida." };
  const limpias = excepciones
    .filter((e) => UUID_RE.test(e.empleado_id) && Number.isFinite(e.monto_aplicado) && e.monto_aplicado >= 0)
    .map((e) => ({ empleado_id: e.empleado_id, monto_aplicado: Math.round(e.monto_aplicado * 100) / 100 }));
  if (limpias.length !== excepciones.length) return { error: "Revisa los montos de las excepciones." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("club57_portal_confirmar_nomina", { p_fecha: fecha, p_excepciones: limpias });
  if (error) return { error: error.message || "No se pudo confirmar la nómina." };
  revalidar();
  return { empleados: Number(data ?? 0) };
}

// ---------------------------------------------------------------------
// Estados de cuenta (corte mensual con Ferretería 57)
// ---------------------------------------------------------------------
/** La empresa da su conformidad al estado de cuenta (sin observaciones abiertas). */
export async function darConformidadCorte(cicloId: string): Promise<{ error?: string }> {
  if (!UUID_RE.test(cicloId)) return { error: "Estado de cuenta no encontrado." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("club57_portal_conformidad_ciclo", { p_ciclo_id: cicloId });
  if (error) return { error: error.message || "No se pudo registrar tu conformidad." };
  revalidar();
  return {};
}

/** La empresa observa un pedido del estado de cuenta; Ferretería 57 lo revisa. */
export async function observarPedidoCorte(cicloId: string, orderId: string, comentario: string): Promise<{ error?: string }> {
  if (!UUID_RE.test(cicloId) || !UUID_RE.test(orderId)) return { error: "Pedido no encontrado." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("club57_portal_observar_pedido", {
    p_ciclo_id: cicloId,
    p_order_id: orderId,
    p_comentario: comentario.trim().slice(0, 500),
  });
  if (error) return { error: error.message || "No se pudo guardar la observación." };
  revalidar();
  return {};
}

// Canje de puntos de la empresa por un artículo del catálogo de canje. La
// base valida saldo, stock y que la empresa esté activa, y descuenta al
// momento; el artículo se entrega en tienda.
export async function canjearPuntosEmpresa(itemId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("club57_portal_canjear", { p_item_id: itemId }).single();
  if (error) {
    if (error.code === "F57NS") return { error: "Este artículo ya no tiene stock disponible." };
    if (error.code === "F57PI") return { error: "Tu empresa no tiene puntos suficientes para este artículo." };
    return { error: error.message || "No se pudo registrar el canje." };
  }
  await notificarCanjeEmpresa((data as { id: string }).id);
  revalidar();
  return {};
}
