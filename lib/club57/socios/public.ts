import { createClient } from "@/lib/supabase/server";

export { filtrarSocios, girosDe, seleccionDelDia, type GiroOption } from "./filtros";

// Consultas del directorio para el sitio público (home y /directorio).
// SOLO leen la vista club57_partners_publicos, que no tiene teléfono,
// correo, dirección, contacto ni notas: aunque esta función se usara mal,
// esos datos no existen en lo que devuelve (ver migración 20261102010000).

export interface PublicPartner {
  id: string;
  nombre_comercial: string;
  slug: string;
  giro_id: string;
  giro: string;
  logo_url: string | null;
  municipio: string | null;
  colonia: string | null;
}

export const PUBLIC_PARTNER_COLUMNS = "id, nombre_comercial, slug, giro_id, giro, logo_url, municipio, colonia";
export const DIRECTORIO_PAGE_SIZE = 12;

/** Todos los socios publicados (el directorio son decenas, no miles). */
export async function getPublicPartners(): Promise<{ partners: PublicPartner[]; error: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club57_partners_publicos")
    .select(PUBLIC_PARTNER_COLUMNS)
    .order("nombre_comercial", { ascending: true })
    .limit(2000);
  return { partners: (data ?? []) as PublicPartner[], error: Boolean(error) };
}

export type DirectorioAcceso = "visitante" | "sin_membresia" | "miembro";

/** Quién está viendo: sin sesión, con sesión sin membresía activa, o miembro activo. */
export async function getDirectorioAcceso(): Promise<DirectorioAcceso> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "visitante";
  const { data, error } = await supabase.rpc("is_active_club57_member");
  return !error && data === true ? "miembro" : "sin_membresia";
}
