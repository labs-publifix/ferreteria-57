import { parseCsvRecords } from "./csv";

// Datos editoriales del blog que viven en archivos del repo (los leen los
// scripts; el sitio no los usa en runtime):
//   supabase/seed/blog-backlog.csv  → temas, slug, keyword, tipo, fecha
//   docs/blog/mapa-enlaces.csv      → enlaces internos planeados

export interface BacklogTopic {
  id: string;
  slug: string;
  titulo: string;
  cluster: string;
  rol: string;
  tipo: string;
  keyword: string;
  fechaProgramada: string;
  guiaTitulo: string;
}

export interface PlannedLink {
  id: string;
  origen: string;
  destino: string;
  ancla: string;
  tipo: string;
  cuando: string;
  fecha: string;
  estado: string;
}

export function parseBacklog(text: string): BacklogTopic[] {
  return parseCsvRecords(text).map((row) => ({
    id: row.id,
    slug: row.slug,
    titulo: row.titulo,
    cluster: row.cluster,
    rol: row.rol,
    tipo: row.tipo,
    keyword: row.keyword,
    fechaProgramada: row.fecha_programada,
    guiaTitulo: row.guia_titulo,
  }));
}

export function parseLinkMap(text: string): PlannedLink[] {
  return parseCsvRecords(text).map((row) => ({
    id: row.id_enlace,
    origen: row.origen,
    destino: row.destino,
    ancla: row.ancla,
    tipo: row.tipo,
    cuando: row.cuando,
    fecha: row.fecha,
    estado: row.estado,
  }));
}
