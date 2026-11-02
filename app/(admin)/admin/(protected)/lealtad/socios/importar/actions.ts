"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/supabase/requireStaff";
import { guardarLogo, resolverGiro, slugDisponible } from "@/lib/club57/socios/adminDb";
import { descargarLogoRemoto } from "@/lib/club57/socios/logoRemoto";
import {
  camposParaActualizar,
  clasificarFilas,
  IMPORT_MAX_ROWS,
  type DecisionDuplicado,
  type ExistingPartner,
} from "@/lib/club57/socios/import";
import type { PartnerInput } from "@/lib/club57/socios/normalize";

export interface ConfirmRow {
  rowNumber: number;
  input: Partial<PartnerInput>;
  decision: DecisionDuplicado;
}

export interface RowResult {
  rowNumber: number;
  nombre: string;
  resultado: "insertado" | "actualizado" | "omitido" | "error";
  motivo: string;
}

export interface ConfirmImportResult {
  error?: string;
  insertados?: number;
  actualizados?: number;
  omitidos?: number;
  errores?: number;
  resultados?: RowResult[];
}

// Paso 2 de la carga masiva: escribe lo que el admin confirmó en la vista
// previa. No confía en la clasificación del navegador: vuelve a normalizar,
// validar y buscar duplicados contra el directorio en este momento. Los
// duplicados se omiten o se actualizan según la decisión de cada fila; al
// actualizar, una celda vacía nunca borra un dato guardado.
export async function confirmPartnersImport(rows: ConfirmRow[]): Promise<ConfirmImportResult> {
  const staff = await requireStaff();
  if (!staff || staff.role !== "admin") return { error: "No autorizado." };
  if (!Array.isArray(rows) || rows.length === 0) return { error: "No hay filas para importar." };
  if (rows.length > IMPORT_MAX_ROWS) return { error: `Máximo ${IMPORT_MAX_ROWS} filas por archivo.` };
  const db = staff.supabase;

  const [{ data: existentes, error }, { data: giros }] = await Promise.all([
    db.from("club57_partners").select("id, nombre_comercial, telefono, correo, correo_2, calle, clave_origen, consentimiento_datos"),
    db.from("club57_partner_giros").select("nombre"),
  ]);
  if (error) return { error: "No se pudo consultar el directorio." };

  const decisiones = new Map(rows.map((row) => [row.rowNumber, row.decision === "actualizar" ? "actualizar" : "omitir"]));
  const { rows: clasificadas } = clasificarFilas(
    rows.map((row) => ({ rowNumber: Number(row.rowNumber), input: row.input ?? {} })),
    (existentes ?? []) as ExistingPartner[],
    (giros ?? []).map((giro) => giro.nombre as string)
  );
  const consentimientoActual = new Map((existentes ?? []).map((row) => [row.id as string, Boolean(row.consentimiento_datos)]));

  const giroIds = new Map<string, string>();
  async function giroId(nombre: string | null): Promise<string | null | { error: string }> {
    if (!nombre) return null;
    const key = nombre.toLowerCase();
    const cached = giroIds.get(key);
    if (cached) return cached;
    const giro = await resolverGiro(db, nombre);
    if ("error" in giro) return giro;
    giroIds.set(key, giro.id);
    return giro.id;
  }

  const resultados: RowResult[] = [];
  const ahora = new Date().toISOString();

  for (const fila of clasificadas) {
    const nombre = fila.data.nombre_comercial || "(sin nombre)";
    if (fila.estado === "error") {
      resultados.push({ rowNumber: fila.rowNumber, nombre, resultado: "error", motivo: fila.errors.join(" ") });
      continue;
    }
    if (fila.duplicado && decisiones.get(fila.rowNumber) !== "actualizar") {
      resultados.push({
        rowNumber: fila.rowNumber,
        nombre,
        resultado: "omitido",
        motivo: `Ya existe «${fila.duplicado.nombre}» (${fila.duplicado.motivo}).`,
      });
      continue;
    }

    const giro = await giroId(fila.data.giro);
    if (giro && typeof giro === "object") {
      resultados.push({ rowNumber: fila.rowNumber, nombre, resultado: "error", motivo: giro.error });
      continue;
    }
    const avisos = fila.warnings.filter((warning) => !warning.startsWith("Ya existe"));

    let partnerId: string;
    if (fila.duplicado) {
      const update: Record<string, unknown> = { ...camposParaActualizar(fila.data), updated_by: staff.userId };
      if (giro) update.giro_id = giro;
      if (fila.data.nombre_comercial) update.slug = await slugDisponible(db, fila.data.nombre_comercial, fila.duplicado.id);
      if (fila.data.consentimiento === true && !consentimientoActual.get(fila.duplicado.id)) {
        update.consentimiento_datos = true;
        update.consentimiento_fecha = ahora;
      } else if (fila.data.consentimiento === false) {
        update.consentimiento_datos = false;
        update.consentimiento_fecha = null;
      }
      if (fila.data.clave_origen) update.clave_origen = fila.data.clave_origen;
      const { error: updateError } = await db.from("club57_partners").update(update).eq("id", fila.duplicado.id);
      if (updateError) {
        resultados.push({ rowNumber: fila.rowNumber, nombre, resultado: "error", motivo: `No se pudo actualizar: ${updateError.message}` });
        continue;
      }
      partnerId = fila.duplicado.id;
      resultados.push({ rowNumber: fila.rowNumber, nombre, resultado: "actualizado", motivo: avisos.join(" ") });
    } else {
      const { data: creado, error: insertError } = await db
        .from("club57_partners")
        .insert({
          nombre_comercial: fila.data.nombre_comercial,
          slug: await slugDisponible(db, fila.data.nombre_comercial),
          giro_id: giro,
          contacto: fila.data.contacto,
          telefono: fila.data.telefono,
          correo: fila.data.correo,
          correo_2: fila.data.correo_2,
          calle: fila.data.calle,
          num_ext: fila.data.num_ext,
          num_int: fila.data.num_int,
          colonia: fila.data.colonia,
          cp: fila.data.cp,
          municipio: fila.data.municipio,
          estado: fila.data.estado,
          notas_internas: fila.data.notas_internas,
          clave_origen: fila.data.clave_origen,
          consentimiento_datos: fila.data.consentimiento === true,
          consentimiento_fecha: fila.data.consentimiento === true ? ahora : null,
          origen: "carga_masiva",
          created_by: staff.userId,
          updated_by: staff.userId,
        })
        .select("id")
        .single();
      if (insertError || !creado) {
        resultados.push({
          rowNumber: fila.rowNumber,
          nombre,
          resultado: "error",
          motivo: `No se pudo registrar: ${insertError?.message ?? ""}`,
        });
        continue;
      }
      partnerId = creado.id as string;
      resultados.push({ rowNumber: fila.rowNumber, nombre, resultado: "insertado", motivo: avisos.join(" ") });
    }

    if (fila.data.logo_url) {
      const descarga = await descargarLogoRemoto(fila.data.logo_url);
      const logo = "error" in descarga ? descarga : await guardarLogo(staff, partnerId, descarga.bytes);
      if (logo.error) {
        const ultimo = resultados[resultados.length - 1];
        ultimo.motivo = [ultimo.motivo, `Logotipo no cargado: ${logo.error} Se usa el avatar de iniciales.`]
          .filter(Boolean)
          .join(" ");
      }
    }
  }

  revalidatePath("/admin/lealtad/socios", "layout");
  revalidatePath("/directorio");
  revalidatePath("/");
  revalidatePath("/cuenta");

  return {
    insertados: resultados.filter((row) => row.resultado === "insertado").length,
    actualizados: resultados.filter((row) => row.resultado === "actualizado").length,
    omitidos: resultados.filter((row) => row.resultado === "omitido").length,
    errores: resultados.filter((row) => row.resultado === "error").length,
    resultados,
  };
}
