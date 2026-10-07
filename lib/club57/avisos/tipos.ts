// Tipos compartidos entre el servidor y la UI del aviso por email (sin
// imports de servidor: se usan en componentes de cliente).
import type { PromoTipo } from "@/lib/club57/promociones/config";
import type { PromoEstadoVisible } from "@/lib/club57/promociones/vigencia";
import type { CampanaEnCola } from "./estimacion";

export type AvisoEstado = "programada" | "en_proceso" | "completada" | "con_errores" | "cancelada";

export interface AvisoCampanaResumen {
  id: string;
  estado: AvisoEstado;
  alcance: "todos" | "no_recibieron";
  total: number;
  enviados: number;
  fallidos: number;
  omitidos: number;
  omitidosVencida: number;
  pendientes: number;
  programadoPara: string;
  finalizadaAt: string | null;
  pausaMotivo: "limite_diario" | "limite_mensual" | null;
  createdAt: string;
  /** Fecha del último correo que sí salió. */
  ultimoEnvio: string | null;
  /** Día estimado del último envío (solo activas); null si no termina. */
  fechaFinEstimada: string | null;
  /** Pendientes que no alcanzarían antes del fin de vigencia. */
  noAlcanzan: number;
}

export interface AvisoCapacidad {
  capDiario: number;
  usadosHoy: number;
  restantesHoy: number;
  cercaLimiteMensual: boolean;
}

export interface AvisoPanelData {
  promo: {
    id: string;
    tipo: PromoTipo;
    titulo: string;
    inicio: string;
    fin: string;
    estadoVisible: PromoEstadoVisible;
  };
  hoy: string;
  asuntoMuestra: string;
  destinatarios: { todos: number; noRecibieron: number };
  capacidad: AvisoCapacidad;
  /** Otros avisos activos (para estimar el nuevo detrás de ellos). */
  cola: CampanaEnCola[];
  /** Avisos de esta promoción, del más reciente al más antiguo. */
  campanas: AvisoCampanaResumen[];
  adminEmail: string | null;
  ahoraMs: number;
  programadoInicioMs: number;
}

export interface AvisoFilaData {
  ultima: AvisoCampanaResumen | null;
  /** Métrica: de quienes recibieron el último aviso, cuántos descargaron. */
  metricas: { enviados: number; descargaron: number; ultimoEnvio: string | null } | null;
}

export interface AvisosListaData {
  capacidad: AvisoCapacidad;
  porPromo: Record<string, AvisoFilaData>;
}
