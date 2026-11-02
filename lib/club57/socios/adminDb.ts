import { normalizeText } from "@/lib/normalizeText";
import type { StaffSession } from "@/lib/supabase/requireStaff";
import { partnerSlug } from "./normalize";
import { LOGO_BUCKET, validarLogo } from "./logo";

// Operaciones de base de datos del directorio que comparten el formulario y
// la carga masiva. Fuera del archivo de Server Actions a propósito: reciben
// la sesión ya validada y no deben poder llamarse desde el navegador.

type Db = StaffSession["supabase"];

/** Id del giro con ese nombre (sin acentos ni mayúsculas); lo crea si no existe. */
export async function resolverGiro(db: Db, nombre: string): Promise<{ id: string; creado: boolean } | { error: string }> {
  const { data: giros, error } = await db.from("club57_partner_giros").select("id, nombre");
  if (error) return { error: `No se pudieron leer los giros: ${error.message}` };
  const existente = (giros ?? []).find((giro) => normalizeText(giro.nombre as string) === normalizeText(nombre));
  if (existente) return { id: existente.id as string, creado: false };
  const { data: nuevo, error: insertError } = await db
    .from("club57_partner_giros")
    .insert({ nombre: nombre.trim() })
    .select("id")
    .single();
  if (insertError || !nuevo) return { error: `No se pudo crear el giro «${nombre}»: ${insertError?.message ?? ""}` };
  return { id: nuevo.id as string, creado: true };
}

/** Slug libre a partir del nombre («taller-el-gallo», «taller-el-gallo-2», …). */
export async function slugDisponible(db: Db, nombre: string, excludeId?: string): Promise<string> {
  const base = partnerSlug(nombre);
  const { data } = await db.from("club57_partners").select("id, slug").like("slug", `${base}%`);
  const usados = new Set((data ?? []).filter((row) => row.id !== excludeId).map((row) => row.slug as string));
  if (!usados.has(base)) return base;
  for (let n = 2; ; n += 1) if (!usados.has(`${base}-${n}`)) return `${base}-${n}`;
}

export async function guardarLogo(
  staff: StaffSession,
  id: string,
  bytes: Uint8Array
): Promise<{ error?: string; logoUrl?: string }> {
  const validado = validarLogo(bytes);
  if (!validado.ok) return { error: validado.error };
  const db = staff.supabase;

  const { data: socio } = await db.from("club57_partners").select("logo_path").eq("id", id).maybeSingle();
  if (!socio) return { error: "Socio no encontrado." };

  const path = `${id}/${crypto.randomUUID()}.${validado.logo.extension}`;
  const storage = db.storage.from(LOGO_BUCKET);
  const { error: uploadError } = await storage.upload(path, bytes, {
    contentType: validado.logo.mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) return { error: `No se pudo subir el logotipo: ${uploadError.message}` };

  const logoUrl = storage.getPublicUrl(path).data.publicUrl;
  const { error } = await db
    .from("club57_partners")
    .update({ logo_url: logoUrl, logo_path: path, updated_by: staff.userId })
    .eq("id", id);
  if (error) {
    await storage.remove([path]);
    return { error: `No se pudo guardar el logotipo: ${error.message}` };
  }
  if (socio.logo_path) await storage.remove([socio.logo_path as string]);
  return { logoUrl };
}

