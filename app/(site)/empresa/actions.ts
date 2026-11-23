"use server";

import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPortalEmpresa } from "@/lib/club57/empresas/portal";
import { notificarVinculoResuelto } from "@/lib/club57/empresas/notificaciones";
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
