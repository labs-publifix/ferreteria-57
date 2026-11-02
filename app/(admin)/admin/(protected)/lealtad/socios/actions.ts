"use server";

import { revalidatePath } from "next/cache";
import { requireFullAdmin, requireStaff, type StaffSession } from "@/lib/supabase/requireStaff";
import { normalizarSocio, type PartnerInput } from "@/lib/club57/socios/normalize";
import { LOGO_BUCKET } from "@/lib/club57/socios/logo";
import { resolverGiro, slugDisponible } from "@/lib/club57/socios/adminDb";
import { esMedioConsentimiento } from "@/lib/club57/socios/consentimiento";

// Acciones del directorio de socios comerciales (admin y operador). Cada una
// confirma el rol por su cuenta (nunca confía en el middleware) y escribe
// con la sesión del usuario: RLS solo deja escribir a is_admin() y borrar
// físicamente a is_full_admin() (migración 20261102010000).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ActionResult {
  error?: string;
}

async function requireDirectorioStaff(): Promise<StaffSession | null> {
  const staff = await requireStaff();
  return staff && staff.role === "admin" ? staff : null;
}

function revalidarDirectorio(id?: string) {
  revalidatePath("/admin/lealtad/socios", "layout");
  if (id) revalidatePath(`/admin/lealtad/socios/${id}`);
  revalidatePath("/directorio");
  revalidatePath("/");
  revalidatePath("/cuenta");
}

export interface PartnerFormInput
  extends Omit<PartnerInput, "giro" | "consentimiento" | "medio_consentimiento" | "logo_url" | "clave_origen"> {
  id?: string;
  /** Giro elegido del catálogo ("" = por definir). */
  giro_id: string;
  /** Giro nuevo escrito a mano (tiene prioridad sobre giro_id). */
  giro_nuevo: string;
  consentimiento: boolean;
  /** Medio de la autorización («whatsapp», «firma»…); obligatorio al registrarla. */
  consentimiento_medio: string;
}

export interface SavePartnerResult extends ActionResult {
  id?: string;
  errors?: string[];
  warnings?: string[];
}

export async function savePartner(input: PartnerFormInput): Promise<SavePartnerResult> {
  const staff = await requireDirectorioStaff();
  if (!staff) return { error: "No autorizado." };
  if (input.id && !UUID_RE.test(input.id)) return { error: "Socio no encontrado." };
  const db = staff.supabase;

  // El giro se resuelve aparte (catálogo o nuevo); a la normalización solo
  // le importa si hay uno, para no avisar «Giro por definir» de más.
  const result = normalizarSocio({
    ...input,
    giro: input.giro_nuevo.trim() || (input.giro_id ? "catálogo" : ""),
    consentimiento: input.consentimiento ? "SI" : "NO",
    medio_consentimiento: input.consentimiento ? input.consentimiento_medio : "",
  });
  if (result.errors.length > 0) return { error: "Revisa los datos marcados.", errors: result.errors };
  const data = result.data;

  let giroId: string | null = null;
  if (input.giro_nuevo.trim()) {
    const giro = await resolverGiro(db, data.giro ?? input.giro_nuevo);
    if ("error" in giro) return { error: giro.error };
    giroId = giro.id;
  } else if (input.giro_id) {
    if (!UUID_RE.test(input.giro_id)) return { error: "Elige un giro de la lista." };
    giroId = input.giro_id;
  }

  // Consentimiento: fecha, medio y quién lo registró se fijan al marcarlo y
  // se conservan mientras siga marcado; al quitarlo se limpian. El medio es
  // obligatorio para una autorización nueva.
  let consentimientoFecha: string | null = null;
  let consentimientoMedio: string | null = null;
  let consentimientoPor: string | null = null;
  if (input.consentimiento) {
    const medioElegido = input.consentimiento_medio?.trim() ?? "";
    if (medioElegido && !esMedioConsentimiento(medioElegido)) return { error: "Elige el medio de autorización de la lista." };
    const { data: actual } = input.id
      ? await db
          .from("club57_partners")
          .select("consentimiento_datos, consentimiento_fecha, consentimiento_medio, consentimiento_registrado_por")
          .eq("id", input.id)
          .maybeSingle()
      : { data: null };
    const yaAutorizado = Boolean(actual?.consentimiento_datos && actual.consentimiento_fecha);
    if (!yaAutorizado && !medioElegido) {
      const mensaje = "Indica por qué medio autorizó el socio (WhatsApp, firma, correo…).";
      return { error: mensaje, errors: [mensaje] };
    }
    consentimientoFecha = yaAutorizado ? (actual!.consentimiento_fecha as string) : new Date().toISOString();
    consentimientoMedio = medioElegido || ((actual?.consentimiento_medio as string | null) ?? null);
    consentimientoPor =
      yaAutorizado && consentimientoMedio === actual!.consentimiento_medio
        ? ((actual!.consentimiento_registrado_por as string | null) ?? null)
        : staff.userId;
  }

  const row = {
    nombre_comercial: data.nombre_comercial,
    giro_id: giroId,
    contacto: data.contacto,
    telefono: data.telefono,
    correo: data.correo,
    correo_2: data.correo_2,
    calle: data.calle,
    num_ext: data.num_ext,
    num_int: data.num_int,
    colonia: data.colonia,
    cp: data.cp,
    municipio: data.municipio,
    estado: data.estado,
    notas_internas: data.notas_internas,
    consentimiento_datos: input.consentimiento,
    consentimiento_fecha: consentimientoFecha,
    consentimiento_medio: consentimientoMedio,
    consentimiento_registrado_por: consentimientoPor,
    updated_by: staff.userId,
  };

  if (input.id) {
    const { error } = await db
      .from("club57_partners")
      .update({ ...row, slug: await slugDisponible(db, data.nombre_comercial, input.id) })
      .eq("id", input.id);
    if (error) return { error: `No se pudo guardar el socio: ${error.message}` };
    revalidarDirectorio(input.id);
    return { id: input.id, warnings: result.warnings };
  }

  const { data: creado, error } = await db
    .from("club57_partners")
    .insert({
      ...row,
      slug: await slugDisponible(db, data.nombre_comercial),
      origen: "manual",
      created_by: staff.userId,
    })
    .select("id")
    .single();
  if (error || !creado) return { error: `No se pudo registrar el socio: ${error?.message ?? ""}` };
  revalidarDirectorio(creado.id as string);
  return { id: creado.id as string, warnings: result.warnings };
}

export async function setPartnerActivo(id: string, activo: boolean): Promise<ActionResult> {
  const staff = await requireDirectorioStaff();
  if (!staff) return { error: "No autorizado." };
  if (!UUID_RE.test(id)) return { error: "Socio no encontrado." };
  const { error } = await staff.supabase
    .from("club57_partners")
    .update({ activo, updated_by: staff.userId })
    .eq("id", id);
  if (error) return { error: `No se pudo cambiar el estatus: ${error.message}` };
  revalidarDirectorio(id);
  return {};
}

export interface BulkConsentResult extends ActionResult {
  /** Socios que cambiaron. */
  cambiados?: number;
  /** Seleccionados que ya estaban así (o en «Eliminados») y no se tocaron. */
  sinCambio?: number;
}

const BULK_MAX = 500;

/**
 * Registra o retira la autorización de datos de varios socios a la vez
 * (selección múltiple de la tabla). Al registrarla solo toca a los que no
 * la tenían, así que nunca pisa la fecha ni el medio de una autorización
 * anterior; al retirarla limpia fecha, medio y quién la registró.
 */
export async function setPartnersConsentimiento(ids: string[], otorgar: boolean, medio?: string): Promise<BulkConsentResult> {
  const staff = await requireDirectorioStaff();
  if (!staff) return { error: "No autorizado." };
  const unicos = Array.isArray(ids) ? [...new Set(ids)] : [];
  if (unicos.length === 0) return { error: "Selecciona al menos un socio." };
  if (unicos.length > BULK_MAX) return { error: `Máximo ${BULK_MAX} socios a la vez.` };
  if (!unicos.every((id) => typeof id === "string" && UUID_RE.test(id))) return { error: "Hay socios no válidos en la selección." };
  if (otorgar && !esMedioConsentimiento(medio)) return { error: "Elige el medio por el que autorizaron." };

  const cambios = otorgar
    ? {
        consentimiento_datos: true,
        consentimiento_fecha: new Date().toISOString(),
        consentimiento_medio: medio,
        consentimiento_registrado_por: staff.userId,
      }
    : { consentimiento_datos: false, consentimiento_fecha: null, consentimiento_medio: null, consentimiento_registrado_por: null };

  const { data, error } = await staff.supabase
    .from("club57_partners")
    .update({ ...cambios, updated_by: staff.userId })
    .in("id", unicos)
    .is("eliminado_at", null)
    .eq("consentimiento_datos", !otorgar)
    .select("id");
  if (error) return { error: `No se pudo actualizar la autorización: ${error.message}` };
  const cambiados = data?.length ?? 0;
  revalidarDirectorio();
  return { cambiados, sinCambio: unicos.length - cambiados };
}

/** «Eliminar» del admin: soft delete, se puede restaurar desde «Eliminados». */
export async function softDeletePartner(id: string): Promise<ActionResult> {
  const staff = await requireDirectorioStaff();
  if (!staff) return { error: "No autorizado." };
  if (!UUID_RE.test(id)) return { error: "Socio no encontrado." };
  const { error } = await staff.supabase
    .from("club57_partners")
    .update({ eliminado_at: new Date().toISOString(), updated_by: staff.userId })
    .eq("id", id);
  if (error) return { error: `No se pudo eliminar: ${error.message}` };
  revalidarDirectorio(id);
  return {};
}

export async function restorePartner(id: string): Promise<ActionResult> {
  const staff = await requireDirectorioStaff();
  if (!staff) return { error: "No autorizado." };
  if (!UUID_RE.test(id)) return { error: "Socio no encontrado." };
  const { error } = await staff.supabase
    .from("club57_partners")
    .update({ eliminado_at: null, updated_by: staff.userId })
    .eq("id", id);
  if (error) return { error: `No se pudo restaurar: ${error.message}` };
  revalidarDirectorio(id);
  return {};
}

/** Borrado físico: solo el admin completo y solo de un socio ya en «Eliminados». */
export async function hardDeletePartner(id: string): Promise<ActionResult> {
  const staff = await requireFullAdmin();
  if (!staff) return { error: "Solo un administrador puede borrar definitivamente." };
  if (!UUID_RE.test(id)) return { error: "Socio no encontrado." };
  const db = staff.supabase;
  const { data: socio } = await db
    .from("club57_partners")
    .select("eliminado_at, logo_path")
    .eq("id", id)
    .maybeSingle();
  if (!socio) return { error: "Socio no encontrado." };
  if (!socio.eliminado_at) return { error: "Primero envía el socio a «Eliminados»." };
  const { error } = await db.from("club57_partners").delete().eq("id", id);
  if (error) return { error: `No se pudo borrar: ${error.message}` };
  if (socio.logo_path) await db.storage.from(LOGO_BUCKET).remove([socio.logo_path as string]);
  revalidarDirectorio();
  return {};
}

/** Quita el logotipo: el socio vuelve al avatar de iniciales. */
export async function removePartnerLogo(id: string): Promise<ActionResult> {
  const staff = await requireDirectorioStaff();
  if (!staff) return { error: "No autorizado." };
  if (!UUID_RE.test(id)) return { error: "Socio no encontrado." };
  const db = staff.supabase;
  const { data: socio } = await db.from("club57_partners").select("logo_path").eq("id", id).maybeSingle();
  if (!socio) return { error: "Socio no encontrado." };
  const { error } = await db
    .from("club57_partners")
    .update({ logo_url: null, logo_path: null, updated_by: staff.userId })
    .eq("id", id);
  if (error) return { error: `No se pudo quitar el logotipo: ${error.message}` };
  if (socio.logo_path) await db.storage.from(LOGO_BUCKET).remove([socio.logo_path as string]);
  revalidarDirectorio(id);
  return {};
}

// --- Giros -----------------------------------------------------------------

function validarNombreGiro(nombre: string): string | null {
  const limpio = nombre.replace(/\s+/g, " ").trim();
  if (limpio.length < 2 || limpio.length > 80) return null;
  return limpio;
}

export async function createGiro(nombre: string): Promise<ActionResult> {
  const staff = await requireDirectorioStaff();
  if (!staff) return { error: "No autorizado." };
  const limpio = validarNombreGiro(nombre);
  if (!limpio) return { error: "El giro debe tener entre 2 y 80 caracteres." };
  const { error } = await staff.supabase.from("club57_partner_giros").insert({ nombre: limpio });
  if (error) return { error: error.code === "23505" ? "Ese giro ya existe." : `No se pudo crear: ${error.message}` };
  revalidarDirectorio();
  return {};
}

export async function renameGiro(id: string, nombre: string): Promise<ActionResult> {
  const staff = await requireDirectorioStaff();
  if (!staff) return { error: "No autorizado." };
  if (!UUID_RE.test(id)) return { error: "Giro no encontrado." };
  const limpio = validarNombreGiro(nombre);
  if (!limpio) return { error: "El giro debe tener entre 2 y 80 caracteres." };
  const { error } = await staff.supabase.from("club57_partner_giros").update({ nombre: limpio }).eq("id", id);
  if (error) return { error: error.code === "23505" ? "Ya hay otro giro con ese nombre." : `No se pudo renombrar: ${error.message}` };
  revalidarDirectorio();
  return {};
}

export async function setGiroActivo(id: string, activo: boolean): Promise<ActionResult> {
  const staff = await requireDirectorioStaff();
  if (!staff) return { error: "No autorizado." };
  if (!UUID_RE.test(id)) return { error: "Giro no encontrado." };
  const { error } = await staff.supabase.from("club57_partner_giros").update({ activo }).eq("id", id);
  if (error) return { error: `No se pudo cambiar el giro: ${error.message}` };
  revalidarDirectorio();
  return {};
}
