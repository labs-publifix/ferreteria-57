import { normalizeText } from "@/lib/normalizeText";
import { claveNombreCalle, normalizarSocio, type PartnerData, type PartnerInput } from "./normalize";

// Clasificación de las filas de una carga masiva de socios: válida, con
// advertencia o con error, con su motivo y número de fila, y detección de
// duplicados (dentro del archivo y contra lo que ya existe). Función pura:
// la usan la vista previa y, de nuevo, la confirmación en el servidor (que
// nunca confía en lo que mande el navegador).

export const IMPORT_MAX_ROWS = 1000;
export const IMPORT_MAX_BYTES = 4 * 1024 * 1024;

export type EstadoFila = "valida" | "advertencia" | "error";
export type DecisionDuplicado = "omitir" | "actualizar";

export interface ExistingPartner {
  id: string;
  nombre_comercial: string;
  telefono: string | null;
  correo: string | null;
  correo_2: string | null;
  calle: string | null;
  clave_origen: string | null;
}

export interface PreviewRow {
  rowNumber: number;
  input: Partial<PartnerInput>;
  data: PartnerData;
  estado: EstadoFila;
  errors: string[];
  warnings: string[];
  /** Socio que ya existe y coincide con esta fila. */
  duplicado: { id: string; nombre: string; motivo: string } | null;
  /** El giro de la fila no existe todavía y se creará. */
  giroNuevo: boolean;
}

export interface ImportSummary {
  total: number;
  validas: number;
  advertencias: number;
  errores: number;
  duplicados: number;
  girosNuevos: string[];
}

function clavesContacto(data: Pick<PartnerData, "telefono" | "correo" | "correo_2">): string[] {
  return [
    data.telefono ? `tel:${data.telefono}` : null,
    data.correo ? `mail:${data.correo}` : null,
    data.correo_2 ? `mail:${data.correo_2}` : null,
  ].filter((key): key is string => key !== null);
}

export function clasificarFilas(
  rows: { rowNumber: number; input: Partial<PartnerInput> }[],
  existentes: ExistingPartner[],
  girosExistentes: string[]
): { rows: PreviewRow[]; summary: ImportSummary } {
  // Índices de lo que ya existe en el directorio.
  const porContacto = new Map<string, ExistingPartner>();
  const porNombreCalle = new Map<string, ExistingPartner>();
  const porClave = new Map<string, ExistingPartner>();
  for (const partner of existentes) {
    for (const key of clavesContacto(partner)) if (!porContacto.has(key)) porContacto.set(key, partner);
    const nombreCalle = claveNombreCalle(partner.nombre_comercial, partner.calle);
    if (nombreCalle && !porNombreCalle.has(nombreCalle)) porNombreCalle.set(nombreCalle, partner);
    if (partner.clave_origen) porClave.set(partner.clave_origen.toLowerCase(), partner);
  }
  const giros = new Set(girosExistentes.map((giro) => normalizeText(giro)));
  const girosNuevos = new Map<string, string>();

  // Lo que ya apareció en filas anteriores del mismo archivo.
  const vistos = new Map<string, number>();

  const result: PreviewRow[] = rows.map(({ rowNumber, input }) => {
    const { data, errors, warnings } = normalizarSocio(input);

    let duplicado: PreviewRow["duplicado"] = null;
    if (errors.length === 0) {
      const nombreCalle = claveNombreCalle(data.nombre_comercial, data.calle);
      const claves = [...clavesContacto(data), ...(nombreCalle ? [`nc:${nombreCalle}`] : [])];
      const repetida = claves.map((key) => vistos.get(key)).find((fila) => fila !== undefined);
      if (repetida !== undefined) {
        errors.push(`Duplicada de la fila ${repetida} (mismo teléfono, correo o nombre y calle).`);
      } else {
        for (const key of claves) vistos.set(key, rowNumber);
        const porClaveOrigen = data.clave_origen ? porClave.get(data.clave_origen.toLowerCase()) : undefined;
        const contacto = clavesContacto(data).map((key) => porContacto.get(key)).find(Boolean);
        const mismoNombreCalle = nombreCalle ? porNombreCalle.get(nombreCalle) : undefined;
        const match = porClaveOrigen ?? contacto ?? mismoNombreCalle;
        if (match) {
          duplicado = {
            id: match.id,
            nombre: match.nombre_comercial,
            motivo: porClaveOrigen
              ? "misma clave de origen"
              : contacto
                ? "mismo teléfono o correo"
                : "mismo nombre comercial y calle",
          };
          // Al actualizar, una celda vacía no borra lo guardado: los avisos de
          // «falta tal dato» no aplican a un socio que ya existe.
          for (let i = warnings.length - 1; i >= 0; i -= 1) {
            if (/^(Falta |Sin teléfono ni correo|Giro por definir)/.test(warnings[i])) warnings.splice(i, 1);
          }
          warnings.unshift(`Ya existe «${match.nombre_comercial}» (${duplicado.motivo}).`);
        }
      }
    }

    let giroNuevo = false;
    if (data.giro && !giros.has(normalizeText(data.giro))) {
      giroNuevo = true;
      girosNuevos.set(normalizeText(data.giro), data.giro);
      warnings.push(`El giro «${data.giro}» no existe y se creará.`);
    }

    const estado: EstadoFila = errors.length > 0 ? "error" : warnings.length > 0 ? "advertencia" : "valida";
    return { rowNumber, input, data, estado, errors, warnings, duplicado, giroNuevo };
  });

  return {
    rows: result,
    summary: {
      total: result.length,
      validas: result.filter((row) => row.estado === "valida").length,
      advertencias: result.filter((row) => row.estado === "advertencia").length,
      errores: result.filter((row) => row.estado === "error").length,
      duplicados: result.filter((row) => row.duplicado).length,
      girosNuevos: [...girosNuevos.values()],
    },
  };
}

/** Campos a actualizar en un socio existente: solo lo que la fila sí trae. */
export function camposParaActualizar(data: PartnerData): Partial<Record<keyof PartnerData, string>> {
  const fields: Partial<Record<keyof PartnerData, string>> = {};
  for (const key of [
    "nombre_comercial",
    "contacto",
    "telefono",
    "correo",
    "correo_2",
    "calle",
    "num_ext",
    "num_int",
    "colonia",
    "cp",
    "municipio",
    "estado",
    "notas_internas",
  ] as const) {
    const value = data[key];
    if (typeof value === "string" && value !== "") fields[key] = value;
  }
  return fields;
}

/** Reporte de errores y advertencias en CSV (Excel en español lo abre con ;). */
export function reporteCsv(
  rows: { rowNumber: number; nombre: string; estado: string; motivo: string }[]
): string {
  const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [["Fila", "Nombre comercial", "Resultado", "Motivo"].map(cell).join(";")];
  for (const row of rows) lines.push([String(row.rowNumber), row.nombre, row.estado, row.motivo].map(cell).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`;
}
