"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/supabase/requireStaff";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSecurePassword } from "@/lib/generatePassword";
import { sendEmail } from "@/lib/email/sendEmail";
import { buildAccesoResponsableEmail } from "@/lib/email/empresarialEmails";
import { appUrl } from "@/lib/club57/empresas/notificaciones";
import { describirCambiosConvenio } from "@/lib/club57/empresas/cambios";
import { FACTURAS_BUCKET } from "@/lib/club57/empresas/cortes";
import { notificarCorteCerrado, notificarMovimientoCorte, notificarSuspension } from "@/lib/club57/empresas/cortesNotificaciones";
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
  const { data: antes } = await staff.supabase.from("club57_empresas").select("estado").eq("id", id).maybeSingle();
  const motivoLimpio = motivo.trim().slice(0, 500) || null;
  const { data, error } = await staff.supabase.rpc("club57_empresa_cambiar_estado", {
    p_empresa_id: id,
    p_estado: estado,
    p_motivo: motivoLimpio,
  });
  if (error) return { error: error.message || "No se pudo cambiar el estado." };
  // Aviso al responsable y a los colaboradores activos (la activación de una
  // solicitud no avisa: el acceso al portal se envía con «Dar acceso»).
  const previo = antes?.estado as EstadoEmpresa | undefined;
  if (estado === "suspendida") await notificarSuspension(id, "suspendida", null, { motivo: motivoLimpio });
  else if (estado === "activa" && previo === "suspendida") await notificarSuspension(id, "reactivada", null);
  else if (estado === "baja" && (previo === "activa" || previo === "suspendida")) await notificarSuspension(id, "baja", null, { motivo: motivoLimpio });
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

// Acceso del responsable al Portal Empresa: se crea su cuenta (o se usa la
// que ya tenga con ese correo), se vincula a la empresa y se le manda un
// correo con un enlace para crear su contraseña. Si la empresa ya tenía
// otro responsable, ese pierde el acceso en el acto.
export async function enviarAccesoResponsable(id: string): Promise<{ error?: string; correo?: string }> {
  const staff = await requireCatalogStaff();
  if (!staff) return { error: "No autorizado." };
  if (!UUID_RE.test(id)) return { error: "Empresa no encontrada." };

  const { data: empresa } = await staff.supabase
    .from("club57_empresas")
    .select("estado, nombre_comercial, codigo, responsable_nombre, responsable_correo, responsable_user_id")
    .eq("id", id)
    .maybeSingle();
  if (!empresa) return { error: "Empresa no encontrada." };
  if (empresa.estado !== "activa" && empresa.estado !== "suspendida") {
    return { error: "Activa la empresa antes de dar acceso a su responsable." };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Falta configurar el servidor para crear cuentas." };
  }

  const correo = empresa.responsable_correo.trim().toLowerCase();
  const { error: createError } = await admin.auth.admin.createUser({
    email: correo,
    email_confirm: true,
    password: generateSecurePassword(),
    user_metadata: { full_name: empresa.responsable_nombre },
  });
  if (createError && createError.code !== "email_exists" && !/already (been )?registered/i.test(createError.message)) {
    return { error: `No se pudo crear la cuenta del responsable: ${createError.message}` };
  }

  // El enlace usa el mismo flujo que «¿Olvidaste tu contraseña?».
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "recovery", email: correo });
  if (linkError || !link?.user || !link.properties?.hashed_token) {
    return { error: `No se pudo generar el enlace de acceso: ${linkError?.message ?? "sin respuesta"}` };
  }

  const anterior = empresa.responsable_user_id;
  const { error: updateError } = await staff.supabase
    .from("club57_empresas")
    .update({ responsable_user_id: link.user.id })
    .eq("id", id);
  if (updateError) return { error: describirError(updateError.message, "No se pudo vincular al responsable.") };

  await staff.supabase.from("club57_empresas_bitacora").insert({
    empresa_id: id,
    accion: "responsable",
    detalle: `${anterior && anterior !== link.user.id ? "Nuevo responsable" : "Acceso enviado"}: ${correo}`,
    actor_id: staff.userId,
  });

  const enlace = appUrl(
    `/cuenta/restablecer-contrasena?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=recovery`
  );
  const email = buildAccesoResponsableEmail({
    responsableNombre: empresa.responsable_nombre,
    empresa: empresa.nombre_comercial,
    codigo: empresa.codigo,
    enlace,
  });
  const sent = await sendEmail({ to: correo, ...email });
  revalidar(id);
  if (sent.error) {
    console.error("[club57 empresarial] acceso responsable", sent.error);
    return { error: "El responsable quedó vinculado, pero no se pudo enviar el correo. Intenta de nuevo." };
  }
  return { correo };
}

// ---------------------------------------------------------------------
// Corte mensual (Etapa 5): cerrar, resolver observaciones, factura y pago.
// Las reglas viven en la base (club57_admin_*), que vuelve a validar.
// ---------------------------------------------------------------------
function revalidarCortes(empresaId?: string) {
  revalidatePath("/admin/lealtad/empresas/cortes");
  if (empresaId && UUID_RE.test(empresaId)) revalidatePath(`/admin/lealtad/empresas/${empresaId}`);
  revalidatePath("/empresa", "layout");
}

export async function cerrarCorte(cicloId: string, empresaId: string): Promise<{ error?: string; resultado?: string }> {
  const staff = await requireCatalogStaff();
  if (!staff) return { error: "No autorizado." };
  if (!UUID_RE.test(cicloId)) return { error: "Corte no encontrado." };
  const { data, error } = await staff.supabase.rpc("club57_admin_cerrar_ciclo", { p_ciclo_id: cicloId });
  if (error) return { error: error.message || "No se pudo cerrar el corte." };
  if (data === "revision") await notificarCorteCerrado(cicloId);
  revalidarCortes(empresaId);
  return { resultado: data as string };
}

export async function resolverObservacion(observacionId: string, respuesta: string, empresaId: string): Promise<{ error?: string }> {
  const staff = await requireCatalogStaff();
  if (!staff) return { error: "No autorizado." };
  if (!UUID_RE.test(observacionId)) return { error: "Observación no encontrada." };
  const { error } = await staff.supabase.rpc("club57_admin_resolver_observacion", {
    p_observacion_id: observacionId,
    p_respuesta: respuesta.trim().slice(0, 500),
  });
  if (error) return { error: error.message || "No se pudo guardar la respuesta." };
  revalidarCortes(empresaId);
  return {};
}

// 2 MB por archivo: el PDF y el XML viajan juntos y Vercel corta peticiones de más de ~4.5 MB.
const FACTURA_MAX_BYTES = 2 * 1024 * 1024;

async function subirArchivoFactura(
  file: File | null,
  tipo: "pdf" | "xml",
  empresaId: string,
  cicloId: string
): Promise<{ path?: string | null; error?: string }> {
  if (!file || file.size === 0) return { path: null };
  if (file.size > FACTURA_MAX_BYTES) return { error: `El ${tipo.toUpperCase()} pesa más de 2 MB.` };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const inicio = new TextDecoder().decode(bytes.slice(0, 64)).trimStart();
  if (tipo === "pdf" && !inicio.startsWith("%PDF")) return { error: "El archivo de la factura no es un PDF." };
  if (tipo === "xml" && !inicio.startsWith("<")) return { error: "El archivo de la factura no es un XML." };
  const path = `${empresaId}/${cicloId}/factura-${crypto.randomUUID()}.${tipo}`;
  const { error } = await createAdminClient()
    .storage.from(FACTURAS_BUCKET)
    .upload(path, bytes, { contentType: tipo === "pdf" ? "application/pdf" : "application/xml", upsert: false });
  if (error) return { error: `No se pudo subir el ${tipo.toUpperCase()}: ${error.message}` };
  return { path };
}

export async function registrarFactura(formData: FormData): Promise<{ error?: string }> {
  const staff = await requireCatalogStaff();
  if (!staff) return { error: "No autorizado." };
  const cicloId = String(formData.get("ciclo_id") ?? "");
  const empresaId = String(formData.get("empresa_id") ?? "");
  if (!UUID_RE.test(cicloId) || !UUID_RE.test(empresaId)) return { error: "Corte no encontrado." };
  const folio = String(formData.get("folio") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "");
  const monto = Number(String(formData.get("monto") ?? "").replace(/[$,\s]/g, ""));
  if (!folio || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Number.isFinite(monto) || monto < 0) {
    return { error: "Captura folio, fecha y monto de la factura." };
  }
  const pdf = await subirArchivoFactura(formData.get("pdf") as File | null, "pdf", empresaId, cicloId);
  if (pdf.error) return { error: pdf.error };
  const xml = await subirArchivoFactura(formData.get("xml") as File | null, "xml", empresaId, cicloId);
  if (xml.error) return { error: xml.error };

  const { error } = await staff.supabase.rpc("club57_admin_registrar_factura", {
    p_ciclo_id: cicloId,
    p_folio: folio,
    p_fecha: fecha,
    p_monto: Math.round(monto * 100) / 100,
    p_pdf_path: pdf.path ?? null,
    p_xml_path: xml.path ?? null,
  });
  if (error) return { error: error.message || "No se pudo registrar la factura." };
  await notificarMovimientoCorte(cicloId, "factura");
  revalidarCortes(empresaId);
  return {};
}

export async function registrarPago(input: {
  cicloId: string;
  empresaId: string;
  fecha: string;
  monto: string;
  referencia: string;
}): Promise<{ error?: string; reactivada?: boolean }> {
  const staff = await requireCatalogStaff();
  if (!staff) return { error: "No autorizado." };
  if (!UUID_RE.test(input.cicloId)) return { error: "Corte no encontrado." };
  const monto = Number(input.monto.replace(/[$,\s]/g, ""));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha) || !Number.isFinite(monto) || monto <= 0) {
    return { error: "Captura la fecha y el monto del pago." };
  }
  const { data, error } = await staff.supabase.rpc("club57_admin_registrar_pago", {
    p_ciclo_id: input.cicloId,
    p_fecha: input.fecha,
    p_monto: Math.round(monto * 100) / 100,
    p_referencia: input.referencia.trim().slice(0, 120),
  });
  if (error) return { error: error.message || "No se pudo registrar el pago." };
  await notificarMovimientoCorte(input.cicloId, "pago", Boolean(data));
  revalidarCortes(input.empresaId);
  return { reactivada: Boolean(data) };
}
