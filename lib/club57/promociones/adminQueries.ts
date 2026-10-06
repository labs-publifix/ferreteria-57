import type { createClient } from "@/lib/supabase/server";
import type { PromoEstado, PromoTipo } from "./config";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export interface PromoAdminRow {
  id: string;
  tipo: PromoTipo;
  titulo: string;
  estado: PromoEstado;
  inicio: string | null;
  fin: string | null;
  nombre: string;
  bytes: number;
  descargasUnicas: number;
  descargasTotales: number;
  archivoEliminado: boolean;
  /** Solo Liquidaciones: Excel de origen. */
  fuente: { nombre: string; productos: number } | null;
}

// Lectura del panel admin (RLS: solo is_admin()). Las descargas únicas
// salen del resumen agregado en SQL, nunca de traer la bitácora completa.
export async function loadPromocionesAdmin(
  supabase: ServerSupabase,
  tipo?: PromoTipo
): Promise<{ rows: PromoAdminRow[]; error: string | null }> {
  let query = supabase
    .from("club57_promociones")
    .select("id, tipo, titulo, estado, vigencia_inicio, vigencia_fin, archivo_nombre_original, archivo_bytes, archivo_eliminado_at, fuente_excel_nombre, fuente_productos, created_at")
    .order("created_at", { ascending: false });
  if (tipo) query = query.eq("tipo", tipo);

  const [promosResult, resumenResult] = await Promise.all([query, supabase.rpc("club57_promo_descargas_resumen")]);
  if (promosResult.error) return { rows: [], error: promosResult.error.message };

  const resumen = new Map<string, { unicas: number; totales: number }>();
  for (const row of (resumenResult.data ?? []) as { promocion_id: string; descargas_unicas: number; descargas_totales: number }[]) {
    resumen.set(row.promocion_id, { unicas: Number(row.descargas_unicas), totales: Number(row.descargas_totales) });
  }

  const rows = (promosResult.data ?? []).map((row) => ({
    id: row.id as string,
    tipo: row.tipo as PromoTipo,
    titulo: row.titulo as string,
    estado: row.estado as PromoEstado,
    inicio: row.vigencia_inicio as string | null,
    fin: row.vigencia_fin as string | null,
    nombre: row.archivo_nombre_original as string,
    bytes: Number(row.archivo_bytes),
    descargasUnicas: resumen.get(row.id as string)?.unicas ?? 0,
    descargasTotales: resumen.get(row.id as string)?.totales ?? 0,
    archivoEliminado: Boolean(row.archivo_eliminado_at),
    fuente: row.fuente_excel_nombre
      ? { nombre: row.fuente_excel_nombre as string, productos: Number(row.fuente_productos ?? 0) }
      : null,
  }));
  return { rows, error: null };
}

export function publicadasDe(rows: PromoAdminRow[]) {
  return rows
    .filter((row): row is PromoAdminRow & { inicio: string; fin: string } => row.estado === "publicada" && !!row.inicio && !!row.fin)
    .map((row) => ({ id: row.id, tipo: row.tipo, titulo: row.titulo, inicio: row.inicio, fin: row.fin, descargasUnicas: row.descargasUnicas }));
}
