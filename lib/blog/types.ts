// Fila de public.blog_topics (ver supabase/migrations/20261010010000_blog_topics.sql).
export interface BlogTopic {
  id: string;
  orden: number;
  lote: number;
  etapa: string | null;
  /** Día de calendario "AAAA-MM-DD" (columna `date`): nunca se convierte de zona horaria. */
  fecha_programada: string | null;
  dia_semana: string | null;
  cluster: string | null;
  rol: string | null;
  tipo: string | null;
  titulo: string | null;
  slug: string | null;
  keyword: string | null;
  audiencia: string | null;
  guia_titulo: string | null;
  origen: "cliente" | "propuesto" | null;
  descartado: boolean;
  descartado_at: string | null;
}

/** Registro de un artículo real del blog (ver lib/blog/registry.ts). */
export interface RegistryEntry {
  slug: string;
  /** Instante de publicación (ISO 8601). */
  publishAt: string;
}

export type TopicEstado = "publicado" | "programado" | "pendiente" | "descartado";

export interface TopicStatus {
  estado: TopicEstado;
  atrasado: boolean;
}
