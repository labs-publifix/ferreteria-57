// Vista del backlog para /admin/blog: orden, resumen y filtros — funciones
// puras sobre los temas ya leídos de la base con su estado derivado.
import { normalizeText } from "@/lib/normalizeText";
import type { BlogTopic, TopicEstado, TopicStatus } from "./types";

export type TopicView = BlogTopic & TopicStatus;

export const ESTADO_FILTROS = ["todos", "pendiente", "programado", "publicado", "descartado"] as const;
export type EstadoFiltro = (typeof ESTADO_FILTROS)[number];

export interface BacklogFiltros {
  estado: EstadoFiltro;
  cluster: string;
  q: string;
}

export function parseFiltros(params: { estado?: string; cluster?: string; q?: string }): BacklogFiltros {
  const estado = (ESTADO_FILTROS as readonly string[]).includes(params.estado ?? "")
    ? (params.estado as EstadoFiltro)
    : "todos";
  return { estado, cluster: (params.cluster ?? "").trim(), q: (params.q ?? "").trim().slice(0, 100) };
}

// Fecha ascendente; los temas sin fecha (Reserva) al final; empate por orden.
export function ordenarTemas<T extends Pick<BlogTopic, "fecha_programada" | "orden">>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.fecha_programada !== b.fecha_programada) {
      if (a.fecha_programada === null) return 1;
      if (b.fecha_programada === null) return -1;
      return a.fecha_programada < b.fecha_programada ? -1 : 1;
    }
    return a.orden - b.orden;
  });
}

export function filtrarTemas(rows: TopicView[], filtros: BacklogFiltros): TopicView[] {
  const q = normalizeText(filtros.q);
  return rows.filter((row) => {
    if (filtros.estado !== "todos" && row.estado !== filtros.estado) return false;
    if (filtros.cluster && row.cluster !== filtros.cluster) return false;
    if (q) {
      const texto = normalizeText([row.id, row.titulo ?? "", row.keyword ?? ""].join(" "));
      if (!texto.includes(q)) return false;
    }
    return true;
  });
}

export interface BacklogResumen {
  conteo: Record<TopicEstado, number>;
  atrasados: number;
  /** Tema no publicado ni descartado con la fecha más próxima (incluye atrasados). */
  siguiente: TopicView | null;
}

export function resumenBacklog(rows: TopicView[]): BacklogResumen {
  const conteo: Record<TopicEstado, number> = { publicado: 0, programado: 0, pendiente: 0, descartado: 0 };
  let atrasados = 0;
  for (const row of rows) {
    conteo[row.estado] += 1;
    if (row.atrasado) atrasados += 1;
  }
  const siguiente =
    ordenarTemas(rows.filter((row) => (row.estado === "pendiente" || row.estado === "programado") && row.fecha_programada))[0] ??
    null;
  return { conteo, atrasados, siguiente };
}

export function clustersDe(rows: Pick<BlogTopic, "cluster">[]): string[] {
  return [...new Set(rows.map((row) => row.cluster).filter((c): c is string => Boolean(c)))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
}
