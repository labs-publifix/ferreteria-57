import { normalizeText } from "@/lib/normalizeText";

// Filtros, orden y estatus del listado del admin, como funciones puras para
// probarlas sin base (la página trae todos los socios y aplica esto).

export interface AdminPartnerRow {
  id: string;
  nombre_comercial: string;
  slug: string;
  giro_id: string | null;
  giro: string | null;
  giro_activo: boolean;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  municipio: string | null;
  colonia: string | null;
  logo_url: string | null;
  activo: boolean;
  eliminado_at: string | null;
  consentimiento_datos: boolean;
  consentimiento_medio: string | null;
  origen: "manual" | "carga_masiva";
  updated_at: string;
}

export const ESTATUS_OPCIONES = [
  { value: "", label: "Vigentes (sin eliminados)" },
  { value: "publicados", label: "Publicados en el directorio" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
  { value: "pendientes", label: "Pendientes de completar" },
  { value: "sin_consentimiento", label: "Sin consentimiento de datos" },
  { value: "con_consentimiento", label: "Con consentimiento de datos" },
  { value: "eliminados", label: "Eliminados" },
] as const;

export const ORDEN_OPCIONES = [
  { value: "nombre", label: "Nombre (A–Z)" },
  { value: "-nombre", label: "Nombre (Z–A)" },
  { value: "giro", label: "Giro" },
  { value: "municipio", label: "Municipio" },
  { value: "-actualizado", label: "Actualizados recientemente" },
] as const;

export type Estatus = (typeof ESTATUS_OPCIONES)[number]["value"];
export type Orden = (typeof ORDEN_OPCIONES)[number]["value"];

/** Publicado = se ve en /directorio y en /cuenta (activo, no eliminado y con giro activo). */
export function estaPublicado(row: AdminPartnerRow): boolean {
  return row.activo && !row.eliminado_at && Boolean(row.giro_id) && row.giro_activo;
}

/** Pendiente de completar: le falta giro (o su giro está desactivado). */
export function estaPendiente(row: AdminPartnerRow): boolean {
  return !row.giro_id || !row.giro_activo;
}

export function filtrarAdmin(rows: AdminPartnerRow[], q: string, giroId: string, estatus: Estatus): AdminPartnerRow[] {
  const needle = normalizeText(q);
  const digits = q.replace(/\D/g, "");
  return rows.filter((row) => {
    if (estatus === "eliminados" ? !row.eliminado_at : row.eliminado_at) return false;
    if (estatus === "publicados" && !estaPublicado(row)) return false;
    if (estatus === "activos" && !row.activo) return false;
    if (estatus === "inactivos" && row.activo) return false;
    if (estatus === "pendientes" && !estaPendiente(row)) return false;
    if (estatus === "sin_consentimiento" && row.consentimiento_datos) return false;
    if (estatus === "con_consentimiento" && !row.consentimiento_datos) return false;
    if (giroId === "sin_giro" ? row.giro_id : giroId && row.giro_id !== giroId) return false;
    if (!needle) return true;
    const texto = normalizeText([row.nombre_comercial, row.contacto, row.correo, row.colonia, row.municipio].join(" "));
    return texto.includes(needle) || (digits.length >= 3 && (row.telefono ?? "").includes(digits));
  });
}

export function ordenarAdmin(rows: AdminPartnerRow[], orden: Orden): AdminPartnerRow[] {
  const byText = (a: string | null, b: string | null) => (a ?? "~").localeCompare(b ?? "~", "es");
  const sorted = [...rows];
  switch (orden) {
    case "-nombre":
      return sorted.sort((a, b) => byText(b.nombre_comercial, a.nombre_comercial));
    case "giro":
      return sorted.sort((a, b) => byText(a.giro, b.giro) || byText(a.nombre_comercial, b.nombre_comercial));
    case "municipio":
      return sorted.sort((a, b) => byText(a.municipio, b.municipio) || byText(a.nombre_comercial, b.nombre_comercial));
    case "-actualizado":
      return sorted.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    default:
      return sorted.sort((a, b) => byText(a.nombre_comercial, b.nombre_comercial));
  }
}
