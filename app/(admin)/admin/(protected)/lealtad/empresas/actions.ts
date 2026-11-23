"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/supabase/requireStaff";
import { describirCambiosConvenio } from "@/lib/club57/empresas/cambios";
import {
  validarConvenio,
  validarDatosEmpresa,
  type Convenio,
  type ConvenioInput,
  type EmpresaDatos,
  type EmpresaDatosInput,
  type Errores,
  type EstadoEmpresa,
} from "@/lib/club57/empresas/datos";

// Club 57 Empresarial — acciones del panel de Ferretería 57 (admin y
// operador). Las transiciones de estado y el código viven en funciones de
// la base (club57_empresa_cambiar_estado / _regenerar_codigo), que vuelven
// a validar el permiso.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireCatalogStaff() {
  const staff = await requireStaff();
  return staff && staff.role === "admin" ? staff : null;
}

export interface EmpresaFormInput {
  datos: Partial<EmpresaDatosInput>;
  convenio: Partial<ConvenioInput>;
  notas_internas: string;
}

export interface EmpresaFormResult {
  id?: string;
  error?: string;
  errores?: Errores<keyof EmpresaDatosInput | keyof ConvenioInput>;
  /** La empresa se guardó, pero no se pudo activar (p. ej. convenio incompleto). */
  aviso?: string;
}

function validar(input: EmpresaFormInput):
  | { datos: EmpresaDatos; convenio: Convenio; notas: string | null }
  | { errores: EmpresaFormResult["errores"] } {
  const d = validarDatosEmpresa(input.datos, { estricto: false });
  const c = validarConvenio(input.convenio);
  const errores = { ...("errores" in d ? d.errores : {}), ...("errores" in c ? c.errores : {}) };
  if (!("datos" in d) || !("convenio" in c)) return { errores };
  const notas = String(input.notas_internas ?? "").trim().slice(0, 2000);
  return { datos: d.datos, convenio: c.convenio, notas: notas || null };
}

function revalidar(id?: string) {
  revalidatePath("/admin/lealtad/empresas");
  if (id) revalidatePath(`/admin/lealtad/empresas/${id}`);
}

function describirError(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  if (message.includes("club57_empresas_rfc_vigente_key")) return "Ya hay una empresa activa o en solicitud con ese RFC.";
  return message;
}

export async function crearEmpresa(input: EmpresaFormInput, activar: boolean): Promise<EmpresaFormResult> {
  const staff = await requireCatalogStaff();
  if (!staff) return { error: "No autorizado." };
  const v = validar(input);
  if ("errores" in v) return { error: "Revisa los campos marcados.", errores: v.errores };

  const { data, error } = await staff.supabase
    .from("club57_empresas")
    .insert({
      ...v.datos,
      ...v.convenio,
      notas_internas: v.notas,
      estado: "solicitud",
      origen: "alta_directa",
      created_by: staff.userId,
    })
    .select("id")
    .single();
  if (error || !data) return { error: describirError(error?.message, "No se pudo guardar la empresa.") };

  if (activar) {
    const { error: activarError } = await staff.supabase.rpc("club57_empresa_activar_alta_directa", {
      p_empresa_id: data.id,
    });
    revalidar(data.id);
    if (activarError) {
      return { id: data.id, aviso: `La empresa se guardó como solicitud, pero no se activó: ${activarError.message}` };
    }
    return { id: data.id };
  }

  await staff.supabase
    .from("club57_empresas_bitacora")
    .insert({ empresa_id: data.id, accion: "alta", detalle: "Registrada desde el panel", actor_id: staff.userId });
  revalidar(data.id);
  return { id: data.id };
}

export async function actualizarEmpresa(id: string, input: EmpresaFormInput): Promise<EmpresaFormResult> {
  const staff = await requireCatalogStaff();
  if (!staff) return { error: "No autorizado." };
  if (!UUID_RE.test(id)) return { error: "Empresa no encontrada." };
  const v = validar(input);
  if ("errores" in v) return { error: "Revisa los campos marcados.", errores: v.errores };

  const { data: actual, error: leerError } = await staff.supabase
    .from("club57_empresas")
    .select(
      "estado, limite_credito, dia_corte, plazo_pago_dias, plazo_autorizacion_dias, exige_numero_empleado, nomina_frecuencia, nomina_dia_semana, nomina_dia_mes, descuentos_por_compra, politica_porcentaje"
    )
    .eq("id", id)
    .maybeSingle();
  if (leerError || !actual) return { error: "Empresa no encontrada." };

  // Una empresa activa o suspendida no puede quedarse sin convenio completo.
  if (
    (actual.estado === "activa" || actual.estado === "suspendida") &&
    (v.convenio.limite_credito === null || v.convenio.dia_corte === null || v.convenio.plazo_pago_dias === null)
  ) {
    return { error: "Una empresa con convenio vigente necesita límite de crédito, día de corte y plazo de pago." };
  }

  const { error } = await staff.supabase
    .from("club57_empresas")
    .update({ ...v.datos, ...v.convenio, notas_internas: v.notas })
    .eq("id", id);
  if (error) return { error: describirError(error.message, "No se pudieron guardar los cambios.") };

  const antes: Convenio = {
    limite_credito: actual.limite_credito === null ? null : Number(actual.limite_credito),
    dia_corte: actual.dia_corte,
    plazo_pago_dias: actual.plazo_pago_dias,
    plazo_autorizacion_dias: actual.plazo_autorizacion_dias,
    exige_numero_empleado: actual.exige_numero_empleado,
    nomina_frecuencia: actual.nomina_frecuencia,
    nomina_dia_semana: actual.nomina_dia_semana,
    nomina_dia_mes: actual.nomina_dia_mes,
    descuentos_por_compra: actual.descuentos_por_compra,
    politica_porcentaje: actual.politica_porcentaje === null ? null : Number(actual.politica_porcentaje),
  };
  const cambios = describirCambiosConvenio(antes, v.convenio);
  await staff.supabase.from("club57_empresas_bitacora").insert(
    cambios.length > 0
      ? { empresa_id: id, accion: "convenio", detalle: cambios.join(" · ").slice(0, 1000), actor_id: staff.userId }
      : { empresa_id: id, accion: "datos", detalle: "Datos de la empresa actualizados", actor_id: staff.userId }
  );

  revalidar(id);
  return { id };
}

export async function cambiarEstadoEmpresa(
  id: string,
  estado: Exclude<EstadoEmpresa, "solicitud">,
  motivo: string
): Promise<{ error?: string; codigo?: string | null }> {
  const staff = await requireCatalogStaff();
  if (!staff) return { error: "No autorizado." };
  if (!UUID_RE.test(id)) return { error: "Empresa no encontrada." };
  const { data, error } = await staff.supabase.rpc("club57_empresa_cambiar_estado", {
    p_empresa_id: id,
    p_estado: estado,
    p_motivo: motivo.trim().slice(0, 500) || null,
  });
  if (error) return { error: error.message || "No se pudo cambiar el estado." };
  revalidar(id);
  return { codigo: (data as string | null) ?? null };
}

export async function regenerarCodigoEmpresa(id: string): Promise<{ error?: string; codigo?: string }> {
  const staff = await requireCatalogStaff();
  if (!staff) return { error: "No autorizado." };
  if (!UUID_RE.test(id)) return { error: "Empresa no encontrada." };
  const { data, error } = await staff.supabase.rpc("club57_empresa_regenerar_codigo", { p_empresa_id: id });
  if (error || !data) return { error: error?.message ?? "No se pudo cambiar el código." };
  revalidar(id);
  return { codigo: data as string };
}
