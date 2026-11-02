"use server";

import { revalidatePath } from "next/cache";
import { requireFullAdmin, requireStaff, type StaffSession } from "@/lib/supabase/requireStaff";
import { normalizarSocio, type PartnerInput } from "@/lib/club57/socios/normalize";
import { LOGO_BUCKET } from "@/lib/club57/socios/logo";
import { resolverGiro, slugDisponible } from "@/lib/club57/socios/adminDb";

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

export interface PartnerFormInput extends Omit<PartnerInput, "giro" | "consentimiento" | "logo_url" | "clave_origen"> {
  id?: string;
  /** Giro elegido del catálogo ("" = por definir). */
  giro_id: string;
  /** Giro nuevo escrito a mano (tiene prioridad sobre giro_id). */
  giro_nuevo: string;
  consentimiento: boolean;
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

  // Consentimiento: la fecha se fija al marcarlo y se conserva mientras siga marcado.
  let consentimientoFecha: string | null = null;
  if (input.consentimiento) {
    if (input.id) {
      const { data: actual } = await db
        .from("club57_partners")
        .select("consentimiento_datos, consentimiento_fecha")
        .eq("id", input.id)
        .maybeSingle();
      consentimientoFecha =
        actual?.consentimiento_datos && actual.consentimiento_fecha
          ? (actual.consentimiento_fecha as string)
          : new Date().toISOString();
    } else {
      consentimientoFecha = new Date().toISOString();
    }
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
