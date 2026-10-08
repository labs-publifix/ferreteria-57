"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/supabase/requireStaff";
import { getNow } from "@/lib/blog/now";
import { getRegistryEntry } from "@/lib/blog/registry";
import { resolveTopicStatus } from "@/lib/blog/topic-status";

const ID_PATTERN = /^[A-Za-z0-9_-]{1,20}$/;

// Única escritura del módulo en la Fase 1: descartar / restaurar un tema
// (borrado lógico reversible). Solo admin; RLS de blog_topics vuelve a
// exigir is_admin() en la base. Un tema publicado o programado ya tiene
// artículo: no se puede descartar ni restaurar desde aquí.
export async function setTopicDescartado(id: string, descartado: boolean): Promise<{ error?: string }> {
  const staff = await requireStaff();
  if (!staff || staff.role !== "admin") return { error: "Solo un administrador puede hacer este cambio." };
  if (!ID_PATTERN.test(id)) return { error: "Tema no encontrado." };

  const { data: topic, error: readError } = await staff.supabase
    .from("blog_topics")
    .select("id, descartado, fecha_programada")
    .eq("id", id)
    .maybeSingle();
  if (readError) return { error: `No se pudo leer el tema: ${readError.message}` };
  if (!topic) return { error: "Tema no encontrado." };

  const { estado } = resolveTopicStatus(topic, getRegistryEntry(id), getNow());
  if (estado === "publicado" || estado === "programado") {
    return { error: "Este tema ya tiene artículo publicado o programado; no se puede descartar." };
  }
  if (topic.descartado === descartado) return {};

  const { error } = await staff.supabase
    .from("blog_topics")
    .update({ descartado, descartado_at: descartado ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: `No se pudo guardar el cambio: ${error.message}` };

  revalidatePath("/admin/blog");
  return {};
}
